require('dotenv').config({ path: '.env.local' });

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const axios = require('axios');

const logger = require('./logger');
const whatsappClient = require('./whatsapp');
const whatsappDataManager = require('./whatsapp-data-manager');
const { PrismaClient } = require('@prisma/client');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

// SLACK CONFIGURATION
const SLACK_CONFIG = {
  webhookUrl: process.env.SLACK_WEBHOOK_URL || '',
  environment: process.env.ENVIRONMENT || 'development',
  enabled: !!(process.env.SLACK_WEBHOOK_URL && !process.env.SLACK_WEBHOOK_URL.includes('REPLACE_WITH'))
};

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:5173"
}));
app.use(express.json());

// MEDIA SERVING: Static media files endpoint
app.use('/api/media', express.static(path.join(__dirname, '..', 'public', 'media')));

// ===========================================
// SLACK NOTIFICATION FUNCTION
// ===========================================

/**
 * Send rich Slack notification with comprehensive formatting
 * @param {Object} messageData - Original message data
 * @param {Object} routingResult - Routing result data (optional)
 * @param {Object} flaggingData - Flagging data (optional)
 * @returns {Promise<Object>} - Success/failure result
 */
const sendSlackNotification = async (messageData, routingResult = null, flaggingData = null) => {
  if (!SLACK_CONFIG.enabled || !SLACK_CONFIG.webhookUrl) {
    logger.info('⚠️ SLACK: Webhook not configured - skipping notification');
    return { success: false, reason: 'not_configured' };
  }

  try {
    const timestamp = new Date(messageData.received_at || new Date()).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata'
    });
    const environment = SLACK_CONFIG.environment.toUpperCase();
    const envEmoji = environment === 'DEVELOPMENT' ? '🧪' : '🏭';
    
    let slackMessage = {
      username: `WTF Gym Bot [${environment}]`,
      icon_emoji: ':robot_face:',
      attachments: []
    };

    // FLAGGED MESSAGE NOTIFICATION
    if (flaggingData) {
      const severity = flaggingData.flagType || 'medium';
      const severityColor = severity === 'high' ? '#E50012' : severity === 'medium' ? '#FF9800' : '#2E7D32';
      const severityEmoji = severity === 'high' ? '🔴' : severity === 'medium' ? '🟡' : '🟢';
      
      // Determine issue category based on content
      let issueCategory = 'General Complaint';
      let department = 'Management';
      
      const message = messageData.message?.toLowerCase() || '';
      const intent = messageData.intent?.toLowerCase() || '';
      
      if (message.includes('machine') || message.includes('equipment') || intent.includes('equipment')) {
        issueCategory = 'Facility - Equipment & Machines';
        department = 'Technical';
      } else if (message.includes('trainer') || message.includes('staff') || intent.includes('staff')) {
        issueCategory = 'Staff - Service Quality';
        department = 'Operations';
      } else if (message.includes('payment') || message.includes('fee') || intent.includes('billing')) {
        issueCategory = 'Billing & Membership';
        department = 'Finance';
      } else if (message.includes('clean') || message.includes('dirty') || intent.includes('hygiene')) {
        issueCategory = 'Hygiene & Cleanliness';
        department = 'Operations';
      }
      
      // Enhanced Slack notification with rich formatting
      slackMessage.attachments.push({
        color: severityColor,
        pretext: `${envEmoji} *Action Required* - WTF GYM ISSUE`,
        title: `${severityEmoji} ${issueCategory}`,
        title_link: environment === 'DEVELOPMENT' ? 
          'http://localhost:5010/flagged' : 
          'https://wtf-whatsapp-bot.fly.dev/flagged',
        fields: [
          {
            title: '🏷️ Issue Category',
            value: issueCategory,
            short: true
          },
          {
            title: '🏢 Department',
            value: department,
            short: true
          },
          {
            title: '📍 Location',
            value: messageData.group_name || 'Direct Message',
            short: true
          },
          {
            title: '👤 Reported By',
            value: `${messageData.sender_name || messageData.fromName} (${messageData.number || messageData.fromNumber || 'N/A'})`,
            short: true
          },
          {
            title: '🚨 Severity',
            value: severity.toUpperCase(),
            short: true
          },
          {
            title: '⚡ Confidence',
            value: `${Math.round((flaggingData.confidence || messageData.confidence || 0) * 100)}%`,
            short: true
          },
          {
            title: '🤖 AI Analysis',
            value: messageData.sentiment ? `${messageData.sentiment} sentiment` : 'Processing...',
            short: true
          },
          {
            title: '🎯 Intent',
            value: messageData.intent || 'Unknown',
            short: true
          },
          {
            title: '📝 Issue Details',
            value: `"${messageData.message ? messageData.message.substring(0, 200) : messageData.body?.substring(0, 200) || 'No message content'}${(messageData.message || messageData.body || '').length > 200 ? '...' : ''}"`,
            short: false
          }
        ],
        footer: `WTF Gym Intelligence System | ${environment} | ${timestamp}`,
        ts: Math.floor(new Date(messageData.received_at || new Date()).getTime() / 1000)
      });
    }
    
    // ROUTING SUCCESS NOTIFICATION
    if (routingResult && routingResult.success) {
      slackMessage.attachments.push({
        color: '#2E7D32',
        pretext: `${envEmoji} *Auto-Routing Success*`,
        title: '✅ Message Successfully Routed to WhatsApp Group',
        fields: [
          {
            title: '🎯 Target Group',
            value: routingResult.targetGroup || 'Unknown Group',
            short: true
          },
          {
            title: '📋 Rule Applied',
            value: routingResult.ruleName || 'AI-based routing',
            short: true
          },
          {
            title: '⚡ Processing Time',
            value: `${routingResult.processingTime || 0}ms`,
            short: true
          },
          {
            title: '🔄 Status',
            value: 'Successfully delivered to WhatsApp group',
            short: true
          }
        ],
        footer: `WTF Gym Routing System | ${environment}`,
        ts: Math.floor(Date.now() / 1000)
      });
    }

    // Send to Slack
    const response = await axios.post(SLACK_CONFIG.webhookUrl, slackMessage, {
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.status === 200) {
      logger.success(`✅ SLACK: Notification sent successfully to ${environment} channel`);
      return { success: true, response: response.data };
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

  } catch (error) {
    logger.error('❌ SLACK: Failed to send notification', error);
    return { success: false, error: error.message };
  }
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    whatsapp: whatsappClient.getStatus()
  });
});

// API Routes
app.get('/api/status', (req, res) => {
  res.json(whatsappClient.getStatus());
});

// Advanced Analytics API for AI Performance Monitoring
app.get('/api/advanced-analytics', async (req, res) => {
  try {
    const timeframe = req.query.timeframe || '7'; // days
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(timeframe));

    // AI Categorization Performance
    const categoryDistribution = await prisma.message.groupBy({
      by: ['advanced_category'],
      where: {
        timestamp: { gte: cutoffDate },
        advanced_category: { not: null }
      },
      _count: { advanced_category: true },
      _avg: { 
        confidence: true,
        escalation_score: true
      }
    });

    // Escalation Risk Analysis
    const escalationAnalysis = await prisma.message.findMany({
      where: {
        timestamp: { gte: cutoffDate },
        escalation_score: { gt: 0.7 }
      },
      select: {
        advanced_category: true,
        escalation_score: true,
        repetition_count: true,
        fromNumber: true,
        timestamp: true
      },
      orderBy: { escalation_score: 'desc' },
      take: 20
    });

    // AI Performance Metrics
    const aiPerformance = await prisma.aIAnalysisPerformance.findMany({
      where: {
        created_at: { gte: cutoffDate }
      },
      select: {
        confidence_score: true,
        processing_time: true,
        model_version: true,
        human_feedback: true
      }
    });

    // Department Routing Stats
    const routingStats = await prisma.messageRoutingLog.groupBy({
      by: ['target_group_id'],
      where: {
        routed_at: { gte: cutoffDate }
      },
      _count: { target_group_id: true },
      _avg: { response_time: true }
    });

    // Get WhatsApp groups for routing stats
    const whatsappGroups = await prisma.whatsAppGroup.findMany({
      select: { id: true, group_name: true, department: true }
    });

    // Combine routing stats with group info
    const enrichedRoutingStats = routingStats.map(stat => {
      const group = whatsappGroups.find(g => g.id === stat.target_group_id);
      return {
        ...stat,
        group_name: group?.group_name || 'Unknown',
        department: group?.department || 'Unknown'
      };
    });

    // Calculate AI accuracy and processing metrics
    const totalMessages = await prisma.message.count({
      where: { timestamp: { gte: cutoffDate } }
    });

    const flaggedMessages = await prisma.message.count({
      where: { 
        timestamp: { gte: cutoffDate },
        isFlagged: true
      }
    });

    const avgProcessingTime = aiPerformance.length > 0 ? 
      aiPerformance.reduce((sum, p) => sum + (p.processing_time || 0), 0) / aiPerformance.length : 0;

    const avgConfidence = aiPerformance.length > 0 ?
      aiPerformance.reduce((sum, p) => sum + (p.confidence_score || 0), 0) / aiPerformance.length : 0;

    res.json({
      timeframe: `${timeframe} days`,
      overview: {
        total_messages: totalMessages,
        flagged_messages: flaggedMessages,
        flagging_rate: totalMessages > 0 ? (flaggedMessages / totalMessages) * 100 : 0,
        avg_processing_time: Math.round(avgProcessingTime),
        avg_confidence: Math.round(avgConfidence * 100)
      },
      category_distribution: categoryDistribution,
      escalation_analysis: escalationAnalysis,
      ai_performance: {
        total_analyses: aiPerformance.length,
        avg_processing_time: avgProcessingTime,
        avg_confidence: avgConfidence,
        feedback_breakdown: aiPerformance.reduce((acc, p) => {
          const feedback = p.human_feedback || 'pending';
          acc[feedback] = (acc[feedback] || 0) + 1;
          return acc;
        }, {})
      },
      routing_performance: enrichedRoutingStats,
      generated_at: new Date()
    });

  } catch (error) {
    logger.error('❌ ADVANCED ANALYTICS: Failed to generate analytics', error);
    res.status(500).json({ 
      error: 'Failed to generate advanced analytics',
      details: error.message 
    });
  }
});

// Routing Dashboard API for Real-time Routing Analytics
app.get('/api/routing-dashboard', async (req, res) => {
  try {
    const timeframe = req.query.timeframe || '24'; // hours
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - parseInt(timeframe));

    // Real-time routing activity
    const recentRoutingActivity = await prisma.messageRoutingLog.findMany({
      where: {
        routed_at: { gte: cutoffDate }
      },
      include: {
        target_group: true,
        routing_rule: {
          include: {
            issue_category: true
          }
        }
      },
      orderBy: { routed_at: 'desc' },
      take: 50
    });

    // Routing success rates by department
    const departmentStats = await prisma.messageRoutingLog.groupBy({
      by: ['target_group_id'],
      where: {
        routed_at: { gte: cutoffDate }
      },
      _count: { target_group_id: true },
      _sum: { retry_count: true },
      _avg: { response_time: true }
    });

    // Get department information
    const departments = await prisma.whatsAppGroup.findMany({
      select: { 
        id: true, 
        group_name: true, 
        department: true,
        priority_level: true,
        response_time_kpi: true
      }
    });

    // Enrich department stats
    const enrichedDepartmentStats = departmentStats.map(stat => {
      const dept = departments.find(d => d.id === stat.target_group_id);
      return {
        department: dept?.department || 'Unknown',
        group_name: dept?.group_name || 'Unknown',
        priority_level: dept?.priority_level || 5,
        response_time_kpi: dept?.response_time_kpi || 60,
        message_count: stat._count.target_group_id,
        avg_response_time: Math.round(stat._avg.response_time || 0),
        total_retries: stat._sum.retry_count || 0,
        performance_score: dept?.response_time_kpi ? 
          Math.max(0, 100 - ((stat._avg.response_time || 0) / dept.response_time_kpi) * 100) : 0
      };
    }).sort((a, b) => a.priority_level - b.priority_level);

    // Message category routing breakdown
    const categoryRoutingBreakdown = await prisma.message.groupBy({
      by: ['advanced_category'],
      where: {
        timestamp: { gte: cutoffDate },
        advanced_category: { not: null }
      },
      _count: { advanced_category: true }
    });

    // Escalation alerts (high-risk messages)
    const escalationAlerts = await prisma.message.findMany({
      where: {
        timestamp: { gte: cutoffDate },
        escalation_score: { gt: 0.8 }
      },
      select: {
        id: true,
        fromNumber: true,
        fromName: true,
        body: true,
        advanced_category: true,
        escalation_score: true,
        repetition_count: true,
        timestamp: true
      },
      orderBy: { escalation_score: 'desc' },
      take: 10
    });

    // Current system load
    const totalRoutingRules = await prisma.routingRule.count({
      where: { is_active: true }
    });

    const activeGroups = await prisma.whatsAppGroup.count({
      where: { is_active: true }
    });

    res.json({
      timeframe: `${timeframe} hours`,
      system_status: {
        active_routing_rules: totalRoutingRules,
        active_whatsapp_groups: activeGroups,
        total_routes_processed: recentRoutingActivity.length
      },
      recent_activity: recentRoutingActivity.map(activity => ({
        message_id: activity.message_id,
        routed_at: activity.routed_at,
        target_group: activity.target_group?.group_name || 'Unknown',
        department: activity.target_group?.department || 'Unknown',
        success: activity.routing_success,
        response_time: activity.response_time,
        retry_count: activity.retry_count,
        rule_used: activity.routing_rule?.rule_name || 'Manual',
        category: activity.routing_rule?.issue_category?.category_name || 'Unknown'
      })),
      department_performance: enrichedDepartmentStats,
      category_breakdown: categoryRoutingBreakdown,
      escalation_alerts: escalationAlerts,
      generated_at: new Date()
    });

  } catch (error) {
    logger.error('❌ ROUTING DASHBOARD: Failed to generate dashboard data', error);
    res.status(500).json({ 
      error: 'Failed to generate routing dashboard data',
      details: error.message 
    });
  }
});

// Escalation Monitor API for Critical Issue Tracking
app.get('/api/escalation-monitor', async (req, res) => {
  try {
    const timeframe = req.query.timeframe || '7'; // days
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(timeframe));

    // High-risk escalations (score > 0.8)
    const criticalEscalations = await prisma.message.findMany({
      where: {
        timestamp: { gte: cutoffDate },
        escalation_score: { gt: 0.8 }
      },
      select: {
        id: true,
        messageId: true,
        fromNumber: true,
        fromName: true,
        chatName: true,
        body: true,
        advanced_category: true,
        escalation_score: true,
        repetition_count: true,
        timestamp: true,
        business_context: true
      },
      orderBy: { escalation_score: 'desc' }
    });

    // Repetition patterns (messages repeated 3+ times)
    const repetitionPatterns = await prisma.message.findMany({
      where: {
        timestamp: { gte: cutoffDate },
        repetition_count: { gte: 3 }
      },
      select: {
        fromNumber: true,
        fromName: true,
        body: true,
        repetition_count: true,
        advanced_category: true,
        escalation_score: true,
        timestamp: true
      },
      orderBy: { repetition_count: 'desc' },
      take: 20
    });

    // Escalation trends by sender
    const senderEscalationTrends = await prisma.message.groupBy({
      by: ['fromNumber'],
      where: {
        timestamp: { gte: cutoffDate },
        escalation_score: { gt: 0.5 }
      },
      _count: { fromNumber: true },
      _avg: { escalation_score: true },
      _max: { escalation_score: true },
      having: {
        escalation_score: { _avg: { gt: 0.6 } }
      },
      orderBy: {
        escalation_score: { _avg: 'desc' }
      }
    });

    // Get sender names for trends
    const senderNumbers = senderEscalationTrends.map(trend => trend.fromNumber);
    const senderInfo = await prisma.message.findMany({
      where: {
        fromNumber: { in: senderNumbers },
        fromName: { not: null }
      },
      select: {
        fromNumber: true,
        fromName: true
      },
      distinct: ['fromNumber']
    });

    // Enrich sender trends with names
    const enrichedSenderTrends = senderEscalationTrends.map(trend => {
      const sender = senderInfo.find(s => s.fromNumber === trend.fromNumber);
      return {
        ...trend,
        sender_name: sender?.fromName || 'Unknown',
        risk_level: trend._avg.escalation_score > 0.8 ? 'CRITICAL' : 
                   trend._avg.escalation_score > 0.6 ? 'HIGH' : 'MEDIUM'
      };
    });

    // Department escalation breakdown
    const departmentEscalations = await prisma.message.groupBy({
      by: ['advanced_category'],
      where: {
        timestamp: { gte: cutoffDate },
        escalation_score: { gt: 0.6 }
      },
      _count: { advanced_category: true },
      _avg: { escalation_score: true }
    });

    // Recent contextual analysis patterns
    const contextualPatterns = await prisma.contextualAnalysis.findMany({
      where: {
        created_at: { gte: cutoffDate },
        risk_score: { gt: 0.7 }
      },
      select: {
        sender_number: true,
        pattern_type: true,
        risk_score: true,
        recommended_action: true,
        created_at: true
      },
      orderBy: { risk_score: 'desc' },
      take: 15
    });

    // Calculate escalation metrics
    const totalMessages = await prisma.message.count({
      where: { timestamp: { gte: cutoffDate } }
    });

    const escalatedMessages = await prisma.message.count({
      where: { 
        timestamp: { gte: cutoffDate },
        escalation_score: { gt: 0.6 }
      }
    });

    const escalationRate = totalMessages > 0 ? (escalatedMessages / totalMessages) * 100 : 0;

    res.json({
      timeframe: `${timeframe} days`,
      escalation_overview: {
        total_messages: totalMessages,
        escalated_messages: escalatedMessages,
        escalation_rate: Math.round(escalationRate * 100) / 100,
        critical_escalations: criticalEscalations.length,
        repetition_issues: repetitionPatterns.length
      },
      critical_escalations: criticalEscalations,
      repetition_patterns: repetitionPatterns,
      sender_risk_profiles: enrichedSenderTrends,
      department_escalations: departmentEscalations,
      contextual_alerts: contextualPatterns,
      generated_at: new Date()
    });

  } catch (error) {
    logger.error('❌ ESCALATION MONITOR: Failed to generate escalation data', error);
    res.status(500).json({ 
      error: 'Failed to generate escalation monitor data',
      details: error.message 
    });
  }
});

// Routing Rules Management API
app.get('/api/routing-rules', async (req, res) => {
  try {
    const rules = await prisma.routingRule.findMany({
      include: {
        issue_category: true,
        whatsapp_group: true
      }
    });
    
    res.json(rules);
  } catch (error) {
    logger.error('❌ ROUTING RULES: Failed to fetch routing rules', error);
    res.status(500).json({ 
      error: 'Failed to fetch routing rules',
      details: error.message 
    });
  }
});

app.post('/api/routing-rules', async (req, res) => {
  try {
    const { 
      rule_name, 
      issue_category_id, 
      whatsapp_group_id, 
      priority_level, 
      severity_filter,
      is_active = true 
    } = req.body;

    const newRule = await prisma.routingRule.create({
      data: {
        rule_name,
        issue_category_id,
        whatsapp_group_id,
        priority_level,
        severity_filter,
        is_active
      },
      include: {
        issue_category: true,
        whatsapp_group: true
      }
    });

    logger.info(`✅ ROUTING RULES: Created new rule: ${rule_name}`);
    res.status(201).json(newRule);
  } catch (error) {
    logger.error('❌ ROUTING RULES: Failed to create routing rule', error);
    res.status(500).json({ 
      error: 'Failed to create routing rule',
      details: error.message 
    });
  }
});

app.put('/api/routing-rules/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updatedRule = await prisma.routingRule.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        issue_category: true,
        whatsapp_group: true
      }
    });

    logger.info(`✅ ROUTING RULES: Updated rule ID ${id}`);
    res.json(updatedRule);
  } catch (error) {
    logger.error('❌ ROUTING RULES: Failed to update routing rule', error);
    res.status(500).json({ 
      error: 'Failed to update routing rule',
      details: error.message 
    });
  }
});

app.delete('/api/routing-rules/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.routingRule.delete({
      where: { id: parseInt(id) }
    });

    logger.info(`✅ ROUTING RULES: Deleted rule ID ${id}`);
    res.json({ message: 'Routing rule deleted successfully' });
  } catch (error) {
    logger.error('❌ ROUTING RULES: Failed to delete routing rule', error);
    res.status(500).json({ 
      error: 'Failed to delete routing rule',
      details: error.message 
    });
  }
});

// WhatsApp Groups Management API - Via Data Manager with Database Configuration
app.get('/api/whatsapp-groups', async (req, res) => {
  try {
    logger.info('📡 API: Groups requested via Data Manager with DB config');
    
    // Get groups from centralized data manager (WhatsApp chat data)
    const cachedGroups = whatsappDataManager.getCachedGroups();
    const stats = whatsappDataManager.getDataStats();
    
    // Get database configuration for all groups
    const dbGroups = await prisma.whatsAppGroup.findMany();
    const dbGroupsMap = new Map(dbGroups.map(g => [g.group_id, g]));
    
    // Merge WhatsApp chat data with database configuration
    const groups = cachedGroups.map(group => {
      const dbConfig = dbGroupsMap.get(group.id || group.group_id);
      return {
        ...group,
        // Add database fields
        is_active: dbConfig?.is_active || false,
        department: dbConfig?.department || 'UNASSIGNED',
        priority_level: dbConfig?.priority_level || 5,
        response_time_kpi: dbConfig?.response_time_kpi || 60,
        configured_in_db: !!dbConfig
      };
    });
    
    res.json({
      success: true,
      groups: groups,
      count: groups.length,
      lastUpdate: stats.lastUpdate,
      isConnected: stats.isConnected,
      fromDataManager: true,
      dbConfigMerged: true
    });
    
    logger.info(`✅ Returned ${groups.length} groups from Data Manager (${dbGroups.length} configured in DB)`);
    
  } catch (error) {
    logger.error('❌ API: Failed to fetch groups from Data Manager', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch WhatsApp groups from Data Manager',
      details: error.message 
    });
  }
});

app.post('/api/whatsapp-groups', async (req, res) => {
  try {
    const { 
      group_id, 
      group_name, 
      department, 
      priority_level = 5,
      response_time_kpi = 60,
      is_active = true 
    } = req.body;

    const newGroup = await prisma.whatsAppGroup.create({
      data: {
        group_id,
        group_name,
        department,
        priority_level,
        response_time_kpi,
        is_active
      }
    });

    logger.info(`✅ WHATSAPP GROUPS: Created new group: ${group_name}`);
    res.status(201).json(newGroup);
  } catch (error) {
    logger.error('❌ WHATSAPP GROUPS: Failed to create group', error);
    res.status(500).json({ 
      error: 'Failed to create WhatsApp group',
      details: error.message 
    });
  }
});

// GET single WhatsApp group by ID
app.get('/api/whatsapp-groups/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Handle both database primary key ID and WhatsApp group ID
    const whereClause = isNaN(id) ? { group_id: id } : { id: parseInt(id) };
    
    const group = await prisma.whatsAppGroup.findUnique({
      where: whereClause
    });

    if (!group) {
      return res.status(404).json({ 
        error: 'WhatsApp group not found',
        searchedId: id 
      });
    }

    logger.info(`✅ WHATSAPP GROUPS: Retrieved group ID ${id}`);
    res.json(group);
  } catch (error) {
    logger.error('❌ WHATSAPP GROUPS: Failed to get group', error);
    res.status(500).json({ 
      error: 'Failed to get WhatsApp group',
      details: error.message 
    });
  }
});

app.put('/api/whatsapp-groups/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, isActive, allowNotifications, ...otherData } = req.body;

    // Handle both database primary key ID and WhatsApp group ID
    const whereClause = isNaN(id) ? { group_id: id } : { id: parseInt(id) };
    
    // Map frontend field names to database field names
    const updateData = {
      group_name: name,  // Frontend 'name' → Database 'group_name'
      description: description || '',  // Keep description as is
      is_active: isActive,  // Frontend 'isActive' → Database 'is_active'
      // Note: allowNotifications doesn't exist in schema, skipping
      updated_at: new Date(),
      ...otherData  // Include any other valid fields
    };

    // Remove undefined/null values to avoid Prisma errors
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined || updateData[key] === null) {
        delete updateData[key];
      }
    });

    const updatedGroup = await prisma.whatsAppGroup.update({
      where: whereClause,
      data: updateData
    });

    logger.info(`✅ WHATSAPP GROUPS: Updated group ID ${id} with fields:`, Object.keys(updateData));
    res.json(updatedGroup);
  } catch (error) {
    logger.error('❌ WHATSAPP GROUPS: Failed to update group', error);
    res.status(500).json({ 
      error: 'Failed to update WhatsApp group',
      details: error.message 
    });
  }
});

app.delete('/api/whatsapp-groups/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Handle both database primary key ID and WhatsApp group ID
    const whereClause = isNaN(id) ? { group_id: id } : { id: parseInt(id) };

    await prisma.whatsAppGroup.delete({
      where: whereClause
    });

    logger.info(`✅ WHATSAPP GROUPS: Deleted group ID ${id}`);
    res.json({ message: 'WhatsApp group deleted successfully' });
  } catch (error) {
    logger.error('❌ WHATSAPP GROUPS: Failed to delete group', error);
    res.status(500).json({ 
      error: 'Failed to delete WhatsApp group',
      details: error.message 
    });
  }
});

// Issue Categories Management API
app.get('/api/issue-categories', async (req, res) => {
  try {
    const categories = await prisma.issueCategory.findMany({
      orderBy: { priority_weight: 'asc' }
    });
    
    res.json(categories);
  } catch (error) {
    logger.error('❌ ISSUE CATEGORIES: Failed to fetch categories', error);
    res.status(500).json({ 
      error: 'Failed to fetch issue categories',
      details: error.message 
    });
  }
});

app.post('/api/issue-categories', async (req, res) => {
  try {
    const { 
      category_name, 
      description,
      priority_level = 5,
      keywords = [],
      is_active = true 
    } = req.body;

    const newCategory = await prisma.issueCategory.create({
      data: {
        category_name,
        description,
        priority_level,
        keywords,
        is_active
      }
    });

    logger.info(`✅ ISSUE CATEGORIES: Created new category: ${category_name}`);
    res.status(201).json(newCategory);
  } catch (error) {
    logger.error('❌ ISSUE CATEGORIES: Failed to create category', error);
    res.status(500).json({ 
      error: 'Failed to create issue category',
      details: error.message 
    });
  }
});

app.put('/api/issue-categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updatedCategory = await prisma.issueCategory.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    logger.info(`✅ ISSUE CATEGORIES: Updated category ID ${id}`);
    res.json(updatedCategory);
  } catch (error) {
    logger.error('❌ ISSUE CATEGORIES: Failed to update category', error);
    res.status(500).json({ 
      error: 'Failed to update issue category',
      details: error.message 
    });
  }
});

app.delete('/api/issue-categories/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.issueCategory.delete({
      where: { id: parseInt(id) }
    });

    logger.info(`✅ ISSUE CATEGORIES: Deleted category ID ${id}`);
    res.json({ message: 'Issue category deleted successfully' });
  } catch (error) {
    logger.error('❌ ISSUE CATEGORIES: Failed to delete category', error);
    res.status(500).json({ 
      error: 'Failed to delete issue category',
      details: error.message 
    });
  }
});

// Manual Routing API
app.post('/api/manual-routing', async (req, res) => {
  try {
    const { 
      message_id, 
      target_group_ids, 
      custom_message = null,
      priority = 'normal' 
    } = req.body;

    // Get the original message
    const message = await prisma.message.findUnique({
      where: { id: parseInt(message_id) }
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Get target groups
    const targetGroups = await prisma.whatsAppGroup.findMany({
      where: { 
        id: { in: target_group_ids.map(id => parseInt(id)) },
        is_active: true 
      }
    });

    if (targetGroups.length === 0) {
      return res.status(400).json({ error: 'No valid target groups found' });
    }

    const routingMessage = custom_message || 
      `🔄 Manual Route: ${message.body}\n\nFrom: ${message.fromName || message.fromNumber}\nTime: ${message.timestamp}`;

    const results = [];
    const routingId = `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Send to each group
    for (const group of targetGroups) {
      try {
        // Note: WhatsApp routing would happen here in production
        // For now, just log the routing attempt
        logger.info(`📤 MANUAL ROUTING [${routingId}]: Sending to ${group.group_name}`);

        // Create routing log
        const routingLog = await prisma.messageRoutingLog.create({
          data: {
            message_id: parseInt(message_id),
            target_group_id: group.id,
            routing_rule_id: null, // Manual routing has no rule
            routing_success: true,
            routing_error: null,
            retry_count: 0,
            response_time: 0,
            routed_at: new Date(),
            routing_strategy: 'manual',
            routing_id: routingId
          }
        });

        results.push({
          group_id: group.group_id,
          group_name: group.group_name,
          department: group.department,
          status: 'success',
          routing_log_id: routingLog.id
        });

      } catch (error) {
        logger.error(`❌ MANUAL ROUTING: Failed to route to ${group.group_name}`, error);
        
        results.push({
          group_id: group.group_id,
          group_name: group.group_name,
          department: group.department,
          status: 'failed',
          error: error.message
        });
      }
    }

    // Update the message with routing status
    await prisma.message.update({
      where: { id: parseInt(message_id) },
      data: {
        routing_status: 'manually_routed',
        routed_groups: targetGroups.map(g => g.group_name).join(', '),
        routing_strategy: 'manual'
      }
    });

    logger.info(`✅ MANUAL ROUTING [${routingId}]: Completed - ${results.filter(r => r.status === 'success').length}/${results.length} successful`);

    res.json({
      routing_id: routingId,
      message_id: parseInt(message_id),
      total_groups: targetGroups.length,
      successful_routes: results.filter(r => r.status === 'success').length,
      failed_routes: results.filter(r => r.status === 'failed').length,
      results: results
    });

  } catch (error) {
    logger.error('❌ MANUAL ROUTING: Failed to process manual routing', error);
    res.status(500).json({ 
      error: 'Failed to process manual routing',
      details: error.message 
    });
  }
});

app.get('/api/messages', async (req, res) => {
  try {
    const { limit = 50, offset = 0, group, sender, q } = req.query;
    
    // 🔥 USE WHATSAPP DATA MANAGER FOR FRESH MESSAGES
    const cachedMessages = whatsappDataManager.getCachedMessages();
    const dataStats = whatsappDataManager.getDataStats();
    
    logger.info(`📱 API: Messages requested - ${cachedMessages.length} cached, connected: ${dataStats.isConnected}`);
    
    // Apply filters if provided
    let filteredMessages = [...cachedMessages];
    
    if (group && group !== 'all') {
      filteredMessages = filteredMessages.filter(msg => 
        msg.chatName && msg.chatName.toLowerCase().includes(group.toLowerCase())
      );
    }
    
    if (sender && sender !== 'all') {
      filteredMessages = filteredMessages.filter(msg => 
        msg.fromName && msg.fromName.toLowerCase().includes(sender.toLowerCase())
      );
    }
    
    if (q) {
      filteredMessages = filteredMessages.filter(msg => 
        msg.body && msg.body.toLowerCase().includes(q.toLowerCase())
      );
    }
    
    // Sort by timestamp descending (newest first)
    filteredMessages.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Apply pagination
    const startIndex = parseInt(offset);
    const endIndex = startIndex + parseInt(limit);
    const paginatedMessages = filteredMessages.slice(startIndex, endIndex);
    
    // MAP TO FRONTEND EXPECTED FIELD NAMES
    const mappedMessages = paginatedMessages.map(msg => ({
      ...msg,
      id: msg.id || `${msg.fromNumber}_${msg.timestamp}`,
      sender_name: msg.fromName || 'Unknown',
      message: msg.body || '',
      group_name: msg.chatName || 'Direct Message',
      received_at: msg.timestamp,
      number: msg.fromNumber || '',
      // AI ANALYSIS FIELDS
      sentiment: msg.sentiment || 'neutral',
      ai_sentiment: msg.sentiment || 'neutral',
      intent: msg.intent || 'unknown',
      ai_intent: msg.intent || 'unknown',
      confidence: msg.confidence || 0,
      // MEDIA FIELDS FOR FRONTEND
      media_url: msg.mediaUrl,
      media_type: msg.mediaType,
      media_filename: msg.mediaFilename,
      media_size: msg.mediaSize,
      mime_type: msg.mimeType,
      has_media: msg.hasMedia || false,
      // FLAGGING FIELDS
      flag_type: msg.isFlagged ? (msg.intent === 'complaint' ? 'complaint' : 'flagged') : null,
      flag_reason: msg.flagReason,
      isFlagged: msg.isFlagged || false,
      // Keep original fields for compatibility
      fromName: msg.fromName,
      body: msg.body,
      chatName: msg.chatName,
      // DATA MANAGER INFO
      fromDataManager: true,
      lastUpdate: dataStats.lastUpdate
    }));
    
    logger.info(`✅ Returned ${mappedMessages.length} messages from Data Manager (${filteredMessages.length} total after filters)`);
    
    res.json(mappedMessages);
  } catch (error) {
    logger.error('❌ Error fetching messages from Data Manager', error);
    res.status(500).json({ error: 'Failed to fetch messages from Data Manager' });
  }
});

app.get('/api/chats', async (req, res) => {
  try {
    const chats = await prisma.chat.findMany({
      orderBy: { updatedAt: 'desc' }
    });
    res.json(chats);
  } catch (error) {
    logger.error('Error fetching chats', error);
    res.status(500).json({ error: 'Failed to fetch chats' });
  }
});

app.post('/api/send-message', async (req, res) => {
  try {
    const { to, message } = req.body;
    
    if (!to || !message) {
      return res.status(400).json({ error: 'Missing required fields: to, message' });
    }

    const result = await whatsappClient.sendMessage(to, message);
    res.json({ success: true, messageId: result.id.id });

  } catch (error) {
    logger.error('Error in send message endpoint', error);
    res.status(500).json({ error: error.message });
  }
});

// WhatsApp QR Code endpoint
app.get('/api/whatsapp/qr', async (req, res) => {
  try {
    const status = await whatsappClient.getStatus();
    
    if (status.qrCode) {
      // Return QR code in expected format
      res.json({
        success: true,
        qrCode: status.qrCode,
        status: 'qr_available',
        authenticated: false
      });
    } else if (status.isReady) {
      // Already authenticated
      res.json({
        success: true,
        authenticated: true,
        status: 'authenticated',
        clientInfo: status.clientInfo
      });
    } else {
      // Not ready yet
      res.json({
        success: false,
        status: 'initializing',
        authenticated: false,
        message: 'WhatsApp client is initializing...'
      });
    }
  } catch (error) {
    logger.error('Error getting QR code', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get QR code',
      status: 'error'
    });
  }
});

// WhatsApp Status endpoint - FIXED: Added missing status endpoint
app.get('/api/whatsapp/status', async (req, res) => {
  try {
    const status = await whatsappClient.getStatus();
    
    res.json({
      success: true,
      authenticated: status.isReady || false,
      status: status.isReady ? 'authenticated' : (status.qrCode ? 'qr_available' : 'initializing'),
      clientInfo: status.clientInfo || null,
      qrCode: status.qrCode || null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error getting WhatsApp status', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get status',
      status: 'error',
      timestamp: new Date().toISOString()
    });
  }
});

// WhatsApp actions
app.post('/api/whatsapp/logout', async (req, res) => {
  try {
    await whatsappClient.destroy();
    res.json({ success: true, message: 'WhatsApp logged out successfully' });
  } catch (error) {
    logger.error('Error logging out WhatsApp', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/whatsapp/restart', async (req, res) => {
  try {
    await whatsappClient.destroy();
    await whatsappClient.initialize();
    res.json({ success: true, message: 'WhatsApp client restarted' });
  } catch (error) {
    logger.error('Error restarting WhatsApp', error);
    res.status(500).json({ error: error.message });
  }
});

// ENHANCED: Force Logout - Complete session cleanup
app.post('/api/whatsapp/force-logout', async (req, res) => {
  try {
    logger.info('🚨 FORCE LOGOUT REQUEST: Starting complete session cleanup');
    
    // Validate request (you could add authentication here)
    const { confirmationToken } = req.body;
    if (confirmationToken !== 'FORCE_LOGOUT_CONFIRMED') {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid confirmation token. This action requires explicit confirmation.' 
      });
    }
    
    // Perform force logout
    const result = await whatsappClient.forceDestroy();
    
    logger.success('🎉 FORCE LOGOUT: API request completed successfully');
    res.json(result);
    
  } catch (error) {
    logger.error('🚨 FORCE LOGOUT API ERROR:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Flagged messages endpoints - FIXED: Query from messages table where isFlagged = true
app.get('/api/flagged-messages', async (req, res) => {
  try {
    const { limit = 50, offset = 0, category, priority, status } = req.query;
    
    const where = { isFlagged: true };
    if (category) where.advanced_category = category;
    if (priority) where.intent = priority; // Map priority to intent for now
    if (status) where.flagReason = { contains: status };

    const flaggedMessages = await prisma.message.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    const total = await prisma.message.count({ where });

    // MAP DATABASE FIELDS TO FRONTEND EXPECTED FIELD NAMES
    const mappedMessages = flaggedMessages.map(msg => ({
      ...msg,
      sender_name: msg.fromName,
      message: msg.body,
      group_name: msg.chatName,
      received_at: msg.timestamp,
      number: msg.fromNumber,
      // AI ANALYSIS FIELDS
      sentiment: msg.sentiment,
      ai_sentiment: msg.sentiment,
      intent: msg.intent,
      ai_intent: msg.intent,
      confidence: msg.confidence,
      // MEDIA FIELDS FOR FRONTEND
      media_url: msg.mediaUrl,
      media_type: msg.mediaType,
      media_filename: msg.mediaFilename,
      media_size: msg.mediaSize,
      mime_type: msg.mimeType,
      has_media: msg.hasMedia,
      // FLAGGING FIELDS
      flag_type: msg.intent === 'complaint' ? 'complaint' : 'flagged',
      flag_reason: msg.flagReason,
      isFlagged: true,
      // Keep original fields for compatibility
      fromName: msg.fromName,
      body: msg.body,
      chatName: msg.chatName
    }));

    res.json({ messages: mappedMessages, total });
  } catch (error) {
    logger.error('Error fetching flagged messages', error);
    res.status(500).json({ error: 'Failed to fetch flagged messages' });
  }
});

// ADDED: /api/flags endpoint (alias for flagged messages) - Expected by AnalyticsPage
app.get('/api/flags', async (req, res) => {
  try {
    const flaggedMessages = await prisma.message.findMany({
      where: { isFlagged: true },
      orderBy: { timestamp: 'desc' },
      take: 100
    });

    // Map to format expected by AnalyticsPage
    const mappedFlags = flaggedMessages.map(msg => ({
      id: msg.id,
      message: msg.body,
      sender_name: msg.fromName,
      group_name: msg.chatName || 'Direct Message',
      flag_reason: msg.flagReason,
      flag_type: msg.intent === 'complaint' ? 'complaint' : 'flagged',
      timestamp: msg.timestamp,
      received_at: msg.timestamp,
      sentiment: msg.sentiment,
      intent: msg.intent,
      confidence: msg.confidence,
      escalation_score: msg.escalation_score,
      advanced_category: msg.advanced_category
    }));

    res.json(mappedFlags);
  } catch (error) {
    logger.error('Error fetching flags', error);
    res.status(500).json({ error: 'Failed to fetch flags' });
  }
});

// ADDED: /api/issue_management endpoint - Expected by AnalyticsPage
app.get('/api/issue_management', async (req, res) => {
  try {
    // Get department analytics
    const departmentStats = await prisma.message.groupBy({
      by: ['chatName'],
      where: { isFlagged: true },
      _count: { id: true }
    });

    // Get category analytics  
    const categoryStats = await prisma.message.groupBy({
      by: ['advanced_category'],
      where: { 
        isFlagged: true,
        advanced_category: { not: null }
      },
      _count: { id: true }
    });

    // Format for frontend
    const analytics = {
      by_department: departmentStats.map(dept => ({
        department: dept.chatName || 'Unknown',
        count: dept._count.id
      })),
      by_category: categoryStats.map(cat => ({
        category: cat.advanced_category,
        count: cat._count.id,
        color: getColorForCategory(cat.advanced_category)
      }))
    };

    res.json({ analytics });
  } catch (error) {
    logger.error('Error fetching issue management data', error);
    res.status(500).json({ error: 'Failed to fetch issue management data' });
  }
});

// Helper function for category colors
function getColorForCategory(category) {
  const colors = {
    'URGENT': '#E50012',
    'ESCALATION': '#FF9800', 
    'COMPLAINT': '#F44336',
    'INSTRUCTION': '#2196F3',
    'CASUAL': '#4CAF50'
  };
  return colors[category] || '#9E9E9E';
}

app.put('/api/flagged-messages/:id/resolve', async (req, res) => {
  try {
    const { id } = req.params;
    const { resolvedBy, notes } = req.body;

    const updatedMessage = await prisma.flaggedMessage.update({
      where: { id },
      data: {
        status: 'resolved',
        resolvedBy,
        resolvedAt: new Date(),
        notes
      }
    });

    res.json(updatedMessage);
  } catch (error) {
    logger.error('Error resolving flagged message', error);
    res.status(500).json({ error: 'Failed to resolve message' });
  }
});

// Analytics endpoints
app.get('/api/analytics/overview', async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days));

    // Total message counts
    const totalMessages = await prisma.message.count({
      where: { createdAt: { gte: daysAgo } }
    });

    const flaggedMessages = await prisma.flaggedMessage.count({
      where: { createdAt: { gte: daysAgo } }
    });

    // Sentiment distribution
    const sentimentStats = await prisma.message.groupBy({
      by: ['sentiment'],
      where: { 
        createdAt: { gte: daysAgo },
        sentiment: { not: null }
      },
      _count: true
    });

    // Intent distribution
    const intentStats = await prisma.message.groupBy({
      by: ['intent'],
      where: { 
        createdAt: { gte: daysAgo },
        intent: { not: null }
      },
      _count: true
    });

    // Category distribution for flagged messages
    const categoryStats = await prisma.flaggedMessage.groupBy({
      by: ['category'],
      where: { createdAt: { gte: daysAgo } },
      _count: true
    });

    // Priority distribution for flagged messages
    const priorityStats = await prisma.flaggedMessage.groupBy({
      by: ['priority'],
      where: { createdAt: { gte: daysAgo } },
      _count: true
    });

    // Daily message trends
    const dailyStats = await prisma.$queryRaw`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as total_messages,
        COUNT(CASE WHEN is_flagged = 1 THEN 1 END) as flagged_messages
      FROM messages 
      WHERE created_at >= ${daysAgo}
      GROUP BY DATE(created_at)
      ORDER BY date
    `;

    res.json({
      overview: {
        totalMessages,
        flaggedMessages,
        flaggedPercentage: totalMessages > 0 ? (flaggedMessages / totalMessages) * 100 : 0
      },
      sentimentStats: sentimentStats.map(s => ({ sentiment: s.sentiment, count: s._count })),
      intentStats: intentStats.map(i => ({ intent: i.intent, count: i._count })),
      categoryStats: categoryStats.map(c => ({ category: c.category, count: c._count })),
      priorityStats: priorityStats.map(p => ({ priority: p.priority, count: p._count })),
      dailyTrends: dailyStats
    });

  } catch (error) {
    logger.error('Error fetching analytics', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Routing rules management
app.get('/api/routing-rules', async (req, res) => {
  try {
    const rules = await prisma.routingRule.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(rules);
  } catch (error) {
    logger.error('Error fetching routing rules', error);
    res.status(500).json({ error: 'Failed to fetch routing rules' });
  }
});

app.post('/api/routing-rules', async (req, res) => {
  try {
    const { category, targetGroupId, targetGroupName, conditions } = req.body;
    
    const rule = await prisma.routingRule.create({
      data: {
        category,
        targetGroupId,
        targetGroupName,
        conditions: conditions ? JSON.stringify(conditions) : null
      }
    });

    res.json(rule);
  } catch (error) {
    logger.error('Error creating routing rule', error);
    res.status(500).json({ error: 'Failed to create routing rule' });
  }
});

app.put('/api/routing-rules/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { category, targetGroupId, targetGroupName, isActive, conditions } = req.body;
    
    const rule = await prisma.routingRule.update({
      where: { id },
      data: {
        category,
        targetGroupId,
        targetGroupName,
        isActive,
        conditions: conditions ? JSON.stringify(conditions) : null
      }
    });

    res.json(rule);
  } catch (error) {
    logger.error('Error updating routing rule', error);
    res.status(500).json({ error: 'Failed to update routing rule' });
  }
});

// ===========================================
// MISSING API ENDPOINTS FROM DOCUMENTATION
// ===========================================

// GET /api/routing-logs - Fetch routing logs with pagination and filters
app.get('/api/routing-logs', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      category, 
      group, 
      status, 
      from_date, 
      to_date 
    } = req.query;
    
    const offset = (page - 1) * limit;
    const whereClause = {};
    
    // Build filters
    if (status) {
      whereClause.routing_success = status === 'success';
    }
    
    if (from_date && to_date) {
      whereClause.routed_at = {
        gte: new Date(from_date),
        lte: new Date(to_date)
      };
    }
    
    const logs = await prisma.messageRoutingLog.findMany({
      where: whereClause,
      include: {
        routing_rule: {
          include: {
            issue_category: true,
            whatsapp_group: true
          }
        },
        target_group: true
      },
      orderBy: { routed_at: 'desc' },
      skip: offset,
      take: parseInt(limit)
    });
    
    // Get total count
    const total = await prisma.messageRoutingLog.count({ where: whereClause });
    
    res.json({
      success: true,
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('❌ ROUTING LOGS: Failed to fetch routing logs', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch routing logs',
      details: error.message 
    });
  }
});

// GET /api/whatsapp-groups/fresh - Get fresh WhatsApp groups via Data Manager
app.get('/api/whatsapp-groups/fresh', async (req, res) => {
  try {
    logger.info('📡 API: Fresh groups requested via Data Manager');
    
    // Get groups from centralized data manager
    const groups = whatsappDataManager.getCachedGroups();
    const stats = whatsappDataManager.getDataStats();
    
    res.json({ 
      success: true, 
      groups: groups,
      count: groups.length,
      lastUpdate: stats.lastUpdate,
      isConnected: stats.isConnected,
      fromDataManager: true,
      clientStatus: stats.isConnected ? 'ready' : 'not_ready'
    });
    
    logger.info(`✅ Returned ${groups.length} groups from Data Manager`);
    
  } catch (error) {
    logger.error('❌ API: Failed to fetch groups from Data Manager', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch WhatsApp groups from Data Manager',
      details: error.message
    });
  }
});

// 🔄 FORCE REFRESH ALL DATA - Manual trigger for Data Manager
app.post('/api/whatsapp/force-refresh', async (req, res) => {
  try {
    logger.info('🔄 API: Force refresh requested');
    
    const stats = await whatsappDataManager.forceRefresh();
    
    res.json({
      success: true,
      message: 'Data refresh completed successfully',
      stats: stats,
      timestamp: new Date().toISOString()
    });
    
    logger.success('✅ API: Force refresh completed successfully');
    
  } catch (error) {
    logger.error('❌ API: Force refresh failed', error);
    res.status(500).json({
      success: false,
      error: 'Failed to refresh WhatsApp data',
      details: error.message
    });
  }
});

// 📊 GET DATA MANAGER STATS
app.get('/api/whatsapp/data-stats', async (req, res) => {
  try {
    const stats = whatsappDataManager.getDataStats();
    
    res.json({
      success: true,
      stats: stats,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('❌ API: Failed to get data stats', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get data statistics',
      details: error.message
    });
  }
});

// 📧 GET SENDERS FROM DATA MANAGER
app.get('/api/whatsapp/senders', async (req, res) => {
  try {
    const senders = whatsappDataManager.getCachedSenders();
    const stats = whatsappDataManager.getDataStats();
    
    res.json({
      success: true,
      senders: senders,
      count: senders.length,
      lastUpdate: stats.lastUpdate,
      fromDataManager: true
    });
    
  } catch (error) {
    logger.error('❌ API: Failed to get senders', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get senders from Data Manager',
      details: error.message
    });
  }
});

// GET /api/slack/config - Get Slack configuration status
app.get('/api/slack/config', async (req, res) => {
  try {
    const slackStatus = {
      enabled: SLACK_CONFIG.enabled,
      configured: !!(SLACK_CONFIG.webhookUrl && !SLACK_CONFIG.webhookUrl.includes('REPLACE_WITH')),
      environment: SLACK_CONFIG.environment,
      webhook_url_masked: SLACK_CONFIG.webhookUrl ?
        SLACK_CONFIG.webhookUrl.substring(0, 50) + '...' : 'Not configured'
    };
    
    res.json(slackStatus);
  } catch (error) {
    logger.error('❌ SLACK CONFIG: Failed to get configuration', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get Slack configuration',
      details: error.message 
    });
  }
});

// POST /api/slack/test - Send test Slack notification
app.post('/api/slack/test', async (req, res) => {
  try {
    const { message = 'Test notification from WTF Bot', severity = 'info' } = req.body;
    
    const testMessageData = {
      message: message,
      sender_name: 'Test User',
      group_name: 'Test Group',
      number: '+91XXXXXXXXXX',
      received_at: new Date(),
      sentiment: 'neutral',
      intent: 'test'
    };
    
    const testFlaggingData = {
      flagType: severity,
      flagReasons: ['test notification'],
      confidence: 0.95
    };
    
    const result = await sendSlackNotification(testMessageData, null, testFlaggingData);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Test Slack notification sent successfully',
        environment: SLACK_CONFIG.environment,
        webhook_status: 'active'
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.reason || result.error || 'Failed to send notification',
        details: result
      });
    }
  } catch (error) {
    logger.error('❌ SLACK TEST: Failed to send test notification', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to send test Slack notification',
      details: error.message 
    });
  }
});

// GET /api/routing-stats - Get routing statistics and analytics
app.get('/api/routing-stats', async (req, res) => {
  try {
    // Get overall routing statistics
    const totalMessages = await prisma.messageRoutingLog.count();
    const successfulRoutes = await prisma.messageRoutingLog.count({
      where: { routing_success: true }
    });
    const failedRoutes = await prisma.messageRoutingLog.count({
      where: { routing_success: false }
    });
    
    // Get success rate by category
    const categoryStats = await prisma.messageRoutingLog.groupBy({
      by: ['target_group_id'],
      _count: {
        id: true,
        routing_success: true
      },
      where: {
        routing_success: true
      }
    });
    
    // Get total count by category (including failures)
    const totalCategoryStats = await prisma.messageRoutingLog.groupBy({
      by: ['target_group_id'],
      _count: {
        id: true
      }
    });

    // Get group names separately
    const groupIds = totalCategoryStats.map(stat => stat.target_group_id).filter(Boolean);
    const groups = await prisma.whatsAppGroup.findMany({
      where: { id: { in: groupIds } },
      select: { id: true, group_name: true, department: true }
    });
    
    // Get recent routing activity (last 24 hours)
    const recentActivity = await prisma.messageRoutingLog.count({
      where: {
        routed_at: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }
    });
    
    // Calculate response times
    const avgResponseTime = await prisma.messageRoutingLog.aggregate({
      _avg: {
        response_time: true
      },
      where: {
        response_time: {
          not: null
        }
      }
    });
    
    // Merge category stats with group information
    const categoryBreakdown = totalCategoryStats.map(totalStat => {
      const successStat = categoryStats.find(s => s.target_group_id === totalStat.target_group_id);
      const group = groups.find(g => g.id === totalStat.target_group_id);
      const successfulRoutes = successStat?._count.routing_success || 0;
      const totalRoutes = totalStat._count.id;
      
      return {
        target_group_id: totalStat.target_group_id,
        group_name: group?.group_name || 'Unknown Group',
        department: group?.department || 'Unknown',
        total_routes: totalRoutes,
        successful_routes: successfulRoutes,
        success_rate: totalRoutes > 0 ? ((successfulRoutes / totalRoutes) * 100).toFixed(1) : 0
      };
    });

    const stats = {
      overview: {
        totalMessages,
        successfulRoutes,
        failedRoutes,
        successRate: totalMessages > 0 ? (successfulRoutes / totalMessages * 100).toFixed(1) : 0,
        recentActivity
      },
      performance: {
        averageResponseTime: avgResponseTime._avg.response_time || 0,
        routingEfficiency: totalMessages > 0 ? (successfulRoutes / totalMessages * 100).toFixed(1) : 0
      },
      categoryBreakdown,
      lastUpdated: new Date().toISOString()
    };
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    logger.error('❌ ROUTING STATS: Failed to fetch routing statistics', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch routing statistics',
      details: error.message 
    });
  }
});

// =============================================================================
// CONTEXTUAL ANALYSIS API ENDPOINTS
// =============================================================================

// GET /api/contextual-analysis - Main contextual analysis data
app.get('/api/contextual-analysis', async (req, res) => {
  try {
    const { timeframe = '7' } = req.query;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(timeframe));

    // Get all contextual analysis records
    const analyses = await prisma.contextualAnalysis.findMany({
      where: {
        created_at: { gte: cutoffDate }
      },
      orderBy: { created_at: 'desc' }
    });

    // Calculate overall statistics
    const totalAnalyses = analyses.length;
    const avgRiskScore = analyses.reduce((sum, a) => sum + (a.risk_score || 0), 0) / totalAnalyses || 0;
    const highRiskCount = analyses.filter(a => (a.risk_score || 0) >= 0.7).length;
    
    // Calculate risk assessment
    const riskAssessment = {
      overall_risk: avgRiskScore,
      complexity_score: analyses.reduce((sum, a) => sum + (a.analysis_confidence || 0), 0) / totalAnalyses || 0,
      total_analyses: totalAnalyses,
      high_risk_analyses: highRiskCount,
      risk_distribution: {
        low: analyses.filter(a => (a.risk_score || 0) < 0.3).length,
        medium: analyses.filter(a => (a.risk_score || 0) >= 0.3 && (a.risk_score || 0) < 0.7).length,
        high: highRiskCount
      }
    };

    res.json({
      success: true,
      data: {
        total_analyses: totalAnalyses,
        timeframe_days: parseInt(timeframe),
        risk_assessment: riskAssessment,
        recent_analyses: analyses.slice(0, 10)
      }
    });

  } catch (error) {
    logger.error('Error fetching contextual analysis:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch contextual analysis data',
      details: error.message 
    });
  }
});

// GET /api/contextual-analysis/patterns - Pattern insights
app.get('/api/contextual-analysis/patterns', async (req, res) => {
  try {
    const { timeframe = '7' } = req.query;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(timeframe));

    // Get pattern data
    const analyses = await prisma.contextualAnalysis.findMany({
      where: {
        created_at: { gte: cutoffDate }
      },
      orderBy: { risk_score: 'desc' }
    });

    // Process patterns
    const patterns = analyses.map(analysis => {
      let parsedRepetition = {};
      let parsedEscalation = {};
      
      try {
        parsedRepetition = JSON.parse(analysis.repetition_pattern || '{}');
        parsedEscalation = JSON.parse(analysis.escalation_indicators || '{}');
      } catch (e) {
        // Handle parsing errors
      }

      return {
        pattern_type: analysis.pattern_type || 'normal',
        description: `Pattern detected for sender ${analysis.sender_number}`,
        risk_score: analysis.risk_score || 0,
        confidence: analysis.analysis_confidence || 0,
        frequency: parsedRepetition.repetition_count || 1,
        recommended_action: analysis.recommended_action || 'MONITOR',
        sender_number: analysis.sender_number,
        timestamp: analysis.created_at,
        escalation_detected: parsedEscalation.escalation_detected || false
      };
    });

    // Group patterns by type
    const patternTypes = patterns.reduce((acc, pattern) => {
      const type = pattern.pattern_type;
      if (!acc[type]) acc[type] = [];
      acc[type].push(pattern);
      return acc;
    }, {});

    res.json({
      success: true,
      insights: patterns,
      pattern_distribution: patternTypes,
      summary: {
        total_patterns: patterns.length,
        high_risk_patterns: patterns.filter(p => p.risk_score >= 0.7).length,
        escalation_patterns: patterns.filter(p => p.escalation_detected).length
      }
    });

  } catch (error) {
    logger.error('Error fetching pattern insights:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch pattern insights',
      details: error.message 
    });
  }
});

// GET /api/contextual-analysis/senders - Sender behavior analysis
app.get('/api/contextual-analysis/senders', async (req, res) => {
  try {
    const { timeframe = '7' } = req.query;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(timeframe));

    // Get sender patterns
    const senderData = await prisma.contextualAnalysis.groupBy({
      by: ['sender_number'],
      where: {
        created_at: { gte: cutoffDate }
      },
      _count: { sender_number: true },
      _avg: { 
        risk_score: true,
        analysis_confidence: true 
      },
      _max: { risk_score: true }
    });

    // Format sender analysis
    const senderPatterns = senderData.map(sender => ({
      sender_id: sender.sender_number,
      pattern_frequency: sender._count.sender_number,
      risk_score: sender._avg.risk_score || 0,
      max_risk_score: sender._max.risk_score || 0,
      confidence: sender._avg.analysis_confidence || 0,
      behavior_type: (sender._avg.risk_score || 0) >= 0.7 ? 'High Risk' : 
                     (sender._avg.risk_score || 0) >= 0.4 ? 'Moderate Risk' : 'Normal'
    })).sort((a, b) => b.risk_score - a.risk_score);

    res.json({
      success: true,
      sender_patterns: senderPatterns,
      summary: {
        total_senders: senderPatterns.length,
        high_risk_senders: senderPatterns.filter(s => s.risk_score >= 0.7).length,
        active_senders: senderPatterns.filter(s => s.pattern_frequency > 1).length
      }
    });

  } catch (error) {
    logger.error('Error fetching sender analysis:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch sender analysis',
      details: error.message 
    });
  }
});

// GET /api/contextual-analysis/temporal - Temporal pattern analysis
app.get('/api/contextual-analysis/temporal', async (req, res) => {
  try {
    const { timeframe = '7' } = req.query;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(timeframe));

    // Get temporal data grouped by day
    const temporalData = await prisma.contextualAnalysis.findMany({
      where: {
        created_at: { gte: cutoffDate }
      },
      select: {
        created_at: true,
        risk_score: true,
        analysis_confidence: true,
        pattern_type: true
      },
      orderBy: { created_at: 'asc' }
    });

    // Group by day and calculate metrics
    const dayGroups = temporalData.reduce((acc, analysis) => {
      const day = analysis.created_at.toISOString().split('T')[0];
      if (!acc[day]) {
        acc[day] = {
          timestamp: day,
          analyses: [],
          total_count: 0,
          avg_risk: 0,
          pattern_intensity: 0,
          risk_level: 0
        };
      }
      acc[day].analyses.push(analysis);
      acc[day].total_count++;
      return acc;
    }, {});

    // Calculate daily metrics
    const temporalAnalysis = Object.values(dayGroups).map(day => {
      const avgRisk = day.analyses.reduce((sum, a) => sum + (a.risk_score || 0), 0) / day.total_count;
      const avgConfidence = day.analyses.reduce((sum, a) => sum + (a.analysis_confidence || 0), 0) / day.total_count;
      
      return {
        timestamp: day.timestamp,
        pattern_intensity: avgConfidence,
        risk_level: avgRisk,
        total_analyses: day.total_count,
        high_risk_count: day.analyses.filter(a => (a.risk_score || 0) >= 0.7).length
      };
    });

    res.json({
      success: true,
      temporal_analysis: temporalAnalysis,
      summary: {
        total_days: temporalAnalysis.length,
        avg_daily_analyses: temporalData.length / temporalAnalysis.length || 0,
        peak_risk_day: temporalAnalysis.reduce((max, day) => 
          day.risk_level > (max.risk_level || 0) ? day : max, {}
        )
      }
    });

  } catch (error) {
    logger.error('Error fetching temporal analysis:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch temporal analysis',
      details: error.message 
    });
  }
});

// =============================================================================
// SOCKET.IO CONNECTION HANDLING
// =============================================================================

// Socket.IO connection handling
io.on('connection', (socket) => {
  logger.socket(`Client connected: ${socket.id}`);

  // FIXED: Send current WhatsApp status to newly connected client in proper format
  whatsappClient.emitWhatsAppStatus();

  socket.on('request_qr', () => {
    const status = whatsappClient.getStatus();
    if (status.qrCode) {
      socket.emit('qr', { qr: status.qrCode });
    }
  });

  socket.on('disconnect', () => {
    logger.socket(`Client disconnected: ${socket.id}`);
  });
});

// Initialize WhatsApp client
async function initializeWhatsApp() {
  try {
    whatsappClient.setSocketIO(io);

// Initialize WhatsApp Data Manager
whatsappDataManager.initialize(whatsappClient, io);
logger.info('🌐 WhatsApp Data Manager initialized with client and socket');
    await whatsappClient.initialize();
  } catch (error) {
    logger.error('Failed to initialize WhatsApp client', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  await whatsappClient.destroy();
  await prisma.$disconnect();
  server.close(() => {
    logger.success('Server closed successfully');
    process.exit(0);
  });
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  await whatsappClient.destroy();
  await prisma.$disconnect();
  server.close(() => {
    logger.success('Server closed successfully');
    process.exit(0);
  });
});

// =============================================================================
// WHATSAPP ROUTING API ENDPOINTS (for compatibility with copied UI)
// =============================================================================

// GET /api/whatsapp-routing-rules - Get all WhatsApp routing rules with enhanced details
app.get('/api/whatsapp-routing-rules', async (req, res) => {
  try {
    // Get routing rules with relationships
    const rules = await prisma.routingRule.findMany({
      include: {
        issue_category: {
          select: {
            id: true,
            category_name: true,
            department: true,
            color_code: true,
            keywords: true
          }
        },
        whatsapp_group: {
          select: {
            id: true,
            group_id: true,
            group_name: true,
            department: true,
            is_active: true
          }
        }
      },
      orderBy: {
        priority: 'asc'
      }
    });

    // Get fresh WhatsApp groups for validation
    let freshGroups = [];
    try {
      if (whatsappClient && whatsappClient.isReady) {
        const chats = await whatsappClient.client.getChats();
        freshGroups = chats.filter(chat => chat.isGroup).map(group => ({
          id: group.id._serialized,
          name: group.name,
          participantCount: group.participants?.length || 0
        }));
      }
    } catch (error) {
      logger.warn('Could not fetch fresh WhatsApp groups for validation:', error.message);
    }

    // Format rules for frontend
    const formattedRules = rules.map(rule => {
      const freshGroup = freshGroups.find(g => g.id === rule.whatsapp_group?.group_id);
      
      return {
        id: rule.id,
        category_id: rule.category_id,
        whatsapp_group_id: rule.whatsapp_group_id,
        severity_filter: JSON.parse(rule.severity_filter || '["low","medium","high"]'),
        is_active: rule.is_active,
        created_at: rule.created_at,
        updated_at: rule.updated_at,
        
        // Category details
        category_name: rule.issue_category?.category_name || 'Unknown Category',
        department: rule.issue_category?.department || 'General',
        color_code: rule.issue_category?.color_code || '#757575',
        
        // Group details
        group_name: rule.whatsapp_group?.group_name || 'Unknown Group',
        group_status: {
          botInGroup: !!freshGroup,
          participantCount: freshGroup?.participantCount || 0,
          isActive: rule.whatsapp_group?.is_active || false,
          lastVerified: new Date().toISOString()
        }
      };
    });

    res.json({
      success: true,
      rules: formattedRules,
      total: formattedRules.length,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    logger.error('❌ WHATSAPP ROUTING RULES: Failed to fetch routing rules', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch WhatsApp routing rules',
      details: error.message
    });
  }
});

// POST /api/whatsapp-routing-rules - Create new WhatsApp routing rule
app.post('/api/whatsapp-routing-rules', async (req, res) => {
  try {
    const { categoryId, whatsappGroupId, severityFilter, isActive = true } = req.body;
    
    // Validate required fields
    if (!categoryId || !whatsappGroupId) {
      return res.status(400).json({
        success: false,
        error: 'Category ID and WhatsApp Group ID are required'
      });
    }

    // Check if category exists
    const category = await prisma.issueCategory.findUnique({
      where: { id: parseInt(categoryId) }
    });
    
    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Issue category not found'
      });
    }

    // Check if group exists (handle both database ID and WhatsApp group ID)
    const group = await prisma.whatsAppGroup.findFirst({
      where: {
        OR: [
          // If it's a number, treat as database primary key
          ...(isNaN(whatsappGroupId) ? [] : [{ id: parseInt(whatsappGroupId) }]),
          // Always check as WhatsApp group ID string
          { group_id: whatsappGroupId }
        ]
      }
    });
    
    if (!group) {
      return res.status(404).json({
        success: false,
        error: 'WhatsApp group not found'
      });
    }

    // Create routing rule
    const newRule = await prisma.routingRule.create({
      data: {
        rule_name: `Route ${category.category_name} to ${group.group_name}`,
        category_id: parseInt(categoryId),
        whatsapp_group_id: group.id,
        condition_logic: JSON.stringify({
          ai_category: true,
          keywords: true,
          intent: true
        }),
        severity_filter: JSON.stringify(severityFilter || ['low', 'medium', 'high']),
        is_active: isActive,
        priority: category.priority_weight || 3
      },
      include: {
        issue_category: true,
        whatsapp_group: true
      }
    });

    logger.info(`✅ ROUTING RULE: Created new rule for category "${category.category_name}" → group "${group.group_name}"`);

    res.json({
      success: true,
      rule: newRule,
      message: 'Routing rule created successfully'
    });

  } catch (error) {
    logger.error('❌ WHATSAPP ROUTING RULES: Failed to create routing rule', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create WhatsApp routing rule',
      details: error.message
    });
  }
});

// PUT /api/whatsapp-routing-rules/:id - Update WhatsApp routing rule
app.put('/api/whatsapp-routing-rules/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { categoryId, whatsappGroupId, severityFilter, isActive } = req.body;
    
    // Check if rule exists
    const existingRule = await prisma.routingRule.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!existingRule) {
      return res.status(404).json({
        success: false,
        error: 'Routing rule not found'
      });
    }

    // Prepare update data
    const updateData = {};
    
    if (categoryId !== undefined) {
      updateData.category_id = parseInt(categoryId);
    }
    
    if (whatsappGroupId !== undefined) {
      const group = await prisma.whatsAppGroup.findFirst({
        where: {
          OR: [
            { id: parseInt(whatsappGroupId) },
            { group_id: whatsappGroupId }
          ]
        }
      });
      
      if (!group) {
        return res.status(404).json({
          success: false,
          error: 'WhatsApp group not found'
        });
      }
      
      updateData.whatsapp_group_id = group.id;
    }
    
    if (severityFilter !== undefined) {
      updateData.severity_filter = JSON.stringify(severityFilter);
    }
    
    if (isActive !== undefined) {
      updateData.is_active = isActive;
    }

    // Update routing rule
    const updatedRule = await prisma.routingRule.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        issue_category: true,
        whatsapp_group: true
      }
    });

    logger.info(`✅ ROUTING RULE: Updated rule ${id}`);

    res.json({
      success: true,
      rule: updatedRule,
      message: 'Routing rule updated successfully'
    });

  } catch (error) {
    logger.error('❌ WHATSAPP ROUTING RULES: Failed to update routing rule', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update WhatsApp routing rule',
      details: error.message
    });
  }
});

// DELETE /api/whatsapp-routing-rules/:id - Delete WhatsApp routing rule
app.delete('/api/whatsapp-routing-rules/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if rule exists
    const existingRule = await prisma.routingRule.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!existingRule) {
      return res.status(404).json({
        success: false,
        error: 'Routing rule not found'
      });
    }

    // Delete routing rule
    await prisma.routingRule.delete({
      where: { id: parseInt(id) }
    });

    logger.info(`✅ ROUTING RULE: Deleted rule ${id}`);

    res.json({
      success: true,
      message: 'Routing rule deleted successfully'
    });

  } catch (error) {
    logger.error('❌ WHATSAPP ROUTING RULES: Failed to delete routing rule', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete WhatsApp routing rule',
      details: error.message
    });
  }
});

// POST /api/whatsapp-groups/:groupId/configure - Configure WhatsApp group
app.post('/api/whatsapp-groups/:groupId/configure', async (req, res) => {
  try {
    const { groupId } = req.params;
    const { name, description, isActive = true } = req.body;
    
    // Check if group already exists in database
    let group = await prisma.whatsAppGroup.findFirst({
      where: {
        OR: [
          { id: parseInt(groupId) },
          { group_id: groupId }
        ]
      }
    });
    
    if (group) {
      // Update existing group
      group = await prisma.whatsAppGroup.update({
        where: { id: group.id },
        data: {
          group_name: name || group.group_name,
          description: description || group.description,
          is_active: isActive
        }
      });
    } else {
      // Create new group configuration
      group = await prisma.whatsAppGroup.create({
        data: {
          group_id: groupId,
          group_name: name || 'New Group',
          description: description || 'Configured WhatsApp group',
          department: 'GENERAL',
          is_active: isActive
        }
      });
    }

    logger.info(`✅ WHATSAPP GROUP: Configured group "${group.group_name}" (${groupId})`);

    res.json({
      success: true,
      group: group,
      message: 'WhatsApp group configured successfully'
    });

  } catch (error) {
    logger.error('❌ WHATSAPP GROUP: Failed to configure group', error);
    res.status(500).json({
      success: false,
      error: 'Failed to configure WhatsApp group',
      details: error.message
    });
  }
});

// Start server
server.listen(PORT, async () => {
  logger.success(`🚀 Backend server running on port ${PORT}`);
  logger.info(`📊 Environment: ${process.env.NODE_ENV}`);
  logger.info(`🔗 CORS Origin: ${process.env.CORS_ORIGIN}`);
  logger.info(`💾 Database: ${process.env.DATABASE_URL}`);
  
  // Initialize database
  try {
    await prisma.$connect();
    logger.success('📚 Database connected successfully');
  } catch (error) {
    logger.error('Database connection failed', error);
  }

  // Initialize WhatsApp client
  await initializeWhatsApp();
}); 