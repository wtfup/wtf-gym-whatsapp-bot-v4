require('dotenv').config({ path: '.env.local' });

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');

const logger = require('./logger');
const whatsappClient = require('./whatsapp');
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

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:5173"
}));
app.use(express.json());

// MEDIA SERVING: Static media files endpoint
app.use('/api/media', express.static(path.join(__dirname, '..', 'public', 'media')));

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

// WhatsApp Groups Management API  
app.get('/api/whatsapp-groups', async (req, res) => {
  try {
    const groups = await prisma.whatsAppGroup.findMany({
      orderBy: { department: 'asc' }
    });
    
    res.json(groups);
  } catch (error) {
    logger.error('❌ WHATSAPP GROUPS: Failed to fetch groups', error);
    res.status(500).json({ 
      error: 'Failed to fetch WhatsApp groups',
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

app.put('/api/whatsapp-groups/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updatedGroup = await prisma.whatsAppGroup.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    logger.info(`✅ WHATSAPP GROUPS: Updated group ID ${id}`);
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

    await prisma.whatsAppGroup.delete({
      where: { id: parseInt(id) }
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
      orderBy: { priority_level: 'asc' }
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
    const { limit = 50, offset = 0 } = req.query;
    const messages = await prisma.message.findMany({
      orderBy: { timestamp: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset)
    });
    
    // MAP DATABASE FIELDS TO FRONTEND EXPECTED FIELD NAMES
    const mappedMessages = messages.map(msg => ({
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
      flag_type: msg.isFlagged ? (msg.intent === 'complaint' ? 'complaint' : 'flagged') : null,
      flag_reason: msg.flagReason,
      isFlagged: msg.isFlagged,
      // Keep original fields for compatibility
      fromName: msg.fromName,
      body: msg.body,
      chatName: msg.chatName
    }));
    
    res.json(mappedMessages);
  } catch (error) {
    logger.error('Error fetching messages', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
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

// Flagged messages endpoints
app.get('/api/flagged-messages', async (req, res) => {
  try {
    const { limit = 50, offset = 0, category, priority, status } = req.query;
    
    const where = {};
    if (category) where.category = category;
    if (priority) where.priority = priority;
    if (status) where.status = status;

    const flaggedMessages = await prisma.flaggedMessage.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    const total = await prisma.flaggedMessage.count({ where });

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
      flag_type: msg.category || 'complaint',
      flag_reason: msg.flagReason,
      isFlagged: true,
      // Keep original fields for compatibility
      fromName: msg.fromName,
      body: msg.body,
      chatName: msg.chatName
    }));

    res.json({ flaggedMessages: mappedMessages, total });
  } catch (error) {
    logger.error('Error fetching flagged messages', error);
    res.status(500).json({ error: 'Failed to fetch flagged messages' });
  }
});

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