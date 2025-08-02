const { PrismaClient } = require('@prisma/client');
const logger = require('./logger');

const prisma = new PrismaClient();

/**
 * WhatsApp Routing Engine for WTF Gym Bot
 * 
 * Intelligently routes messages to appropriate WhatsApp groups based on:
 * - AI categorization results (INSTRUCTION/ESCALATION/COMPLAINT/URGENT/CASUAL)
 * - Department specialization (Equipment, Facility, Customer Service, Management)  
 * - Priority-based routing matrix
 * - Emergency escalation protocols
 * - Load balancing and response time optimization
 */
class WhatsAppRoutingEngine {
  constructor(whatsappClient) {
    this.whatsappClient = whatsappClient;
    
    // Routing configuration
    this.config = {
      MAX_ROUTING_ATTEMPTS: 3,
      EMERGENCY_ESCALATION_TIMEOUT: 5 * 60 * 1000, // 5 minutes
      STANDARD_ESCALATION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
      RETRY_DELAY: 2000, // 2 seconds between retries
      LOAD_BALANCING_ENABLED: true,
      RESPONSE_TIME_TRACKING: true
    };

    // Department routing matrix
    this.DEPARTMENT_MATRIX = {
      EQUIPMENT_MAINTENANCE: {
        categories: ['INSTRUCTION', 'COMPLAINT'],
        keywords: ['equipment', 'machine', 'treadmill', 'weights', 'broken', 'not working'],
        priority: 1,
        response_time_kpi: 15, // minutes
        escalation_threshold: 2 // number of unresolved issues
      },
      FACILITY_MANAGEMENT: {
        categories: ['INSTRUCTION', 'COMPLAINT'],
        keywords: ['AC', 'temperature', 'bathroom', 'cleanliness', 'dirty', 'smell'],
        priority: 2,
        response_time_kpi: 30,
        escalation_threshold: 3
      },
      CUSTOMER_SERVICE: {
        categories: ['COMPLAINT', 'CASUAL'],
        keywords: ['billing', 'membership', 'staff', 'trainer', 'service'],
        priority: 3,
        response_time_kpi: 10,
        escalation_threshold: 2
      },
      MANAGEMENT: {
        categories: ['URGENT', 'ESCALATION'],
        keywords: ['emergency', 'danger', 'safety', 'escalation', 'manager'],
        priority: 1,
        response_time_kpi: 5,
        escalation_threshold: 1
      }
    };

    // Priority routing order
    this.PRIORITY_ORDER = {
      URGENT: 1,
      ESCALATION: 2,
      COMPLAINT: 3,
      INSTRUCTION: 4,
      CASUAL: 5
    };

    // Routing statistics
    this.routingStats = {
      total_routed: 0,
      successful_routes: 0,
      failed_routes: 0,
      escalations: 0,
      average_routing_time: 0
    };
  }

  /**
   * Main routing method - intelligently route message to appropriate groups
   */
  async routeMessage(messageData, aiAnalysisResult, contextualAnalysis = null) {
    const routingId = `route_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const startTime = Date.now();
    
    logger.info(`🔄 ROUTING [${routingId}]: Starting intelligent routing for category: ${aiAnalysisResult.advanced_category}`);

    try {
      // Step 1: Determine routing strategy
      const routingStrategy = await this.determineRoutingStrategy(aiAnalysisResult, contextualAnalysis);
      
      // Step 2: Get target groups based on strategy
      const targetGroups = await this.getTargetGroups(routingStrategy, aiAnalysisResult);
      
      // Step 3: Apply priority and load balancing
      const optimizedTargets = await this.optimizeTargetSelection(targetGroups, routingStrategy);
      
      // Step 4: Execute routing with retry logic
      const routingResults = await this.executeRouting(optimizedTargets, messageData, aiAnalysisResult, routingId);
      
      // Step 5: Log routing activity and update statistics
      await this.logRoutingActivity(routingId, messageData, routingResults, startTime);
      
      const totalTime = Date.now() - startTime;
      this.updateRoutingStats(routingResults.success, totalTime);
      
      logger.info(`✅ ROUTING [${routingId}]: Completed in ${totalTime}ms - Success: ${routingResults.success}, Groups: ${routingResults.routed_groups.length}`);
      
      return {
        routing_id: routingId,
        success: routingResults.success,
        routed_groups: routingResults.routed_groups,
        strategy_used: routingStrategy.name,
        processing_time: totalTime,
        escalation_triggered: routingResults.escalation_triggered
      };

    } catch (error) {
      logger.error(`❌ ROUTING [${routingId}]: Failed:`, error);
      
      // Emergency fallback routing
      const fallbackResult = await this.emergencyFallbackRouting(messageData, aiAnalysisResult);
      
      return {
        routing_id: routingId,
        success: false,
        error: error.message,
        fallback_used: true,
        fallback_result: fallbackResult
      };
    }
  }

  /**
   * Determine the best routing strategy based on AI analysis
   */
  async determineRoutingStrategy(aiAnalysisResult, contextualAnalysis) {
    const strategy = {
      name: 'STANDARD_ROUTING',
      priority_level: this.PRIORITY_ORDER[aiAnalysisResult.advanced_category] || 5,
      routing_methods: ['AI_CATEGORY', 'KEYWORD_MATCHING'],
      escalation_enabled: false,
      emergency_mode: false,
      load_balancing: true
    };

    // Emergency routing for URGENT messages
    if (aiAnalysisResult.advanced_category === 'URGENT') {
      strategy.name = 'EMERGENCY_ROUTING';
      strategy.priority_level = 1;
      strategy.routing_methods = ['DIRECT_MANAGEMENT', 'ALL_DEPARTMENTS'];
      strategy.escalation_enabled = true;
      strategy.emergency_mode = true;
      strategy.load_balancing = false;
      
      logger.warning(`🚨 ROUTING STRATEGY: Emergency mode activated for URGENT message`);
    }
    
    // Escalation routing for repeated/frustrated messages
    else if (aiAnalysisResult.advanced_category === 'ESCALATION' || 
             (contextualAnalysis?.risk_assessment?.overall_risk >= 0.8)) {
      strategy.name = 'ESCALATION_ROUTING';
      strategy.priority_level = 1;
      strategy.routing_methods = ['MANAGEMENT_ESCALATION', 'AI_CATEGORY'];
      strategy.escalation_enabled = true;
      strategy.load_balancing = false;
      
      logger.warning(`📈 ROUTING STRATEGY: Escalation mode for frustrated customer`);
    }
    
    // Priority routing for complaints
    else if (aiAnalysisResult.advanced_category === 'COMPLAINT') {
      strategy.name = 'PRIORITY_ROUTING';
      strategy.priority_level = 2;
      strategy.routing_methods = ['AI_CATEGORY', 'KEYWORD_MATCHING', 'DEPARTMENT_SPECIALIZATION'];
      strategy.escalation_enabled = true;
      
      logger.info(`⚡ ROUTING STRATEGY: Priority routing for complaint`);
    }
    
    // Standard routing for instructions and casual messages
    else {
      strategy.name = 'STANDARD_ROUTING';
      strategy.routing_methods = ['KEYWORD_MATCHING', 'AI_CATEGORY'];
      
      logger.info(`📋 ROUTING STRATEGY: Standard routing for ${aiAnalysisResult.advanced_category}`);
    }

    return strategy;
  }

  /**
   * Get target WhatsApp groups based on routing strategy
   */
  async getTargetGroups(strategy, aiAnalysisResult) {
    const targetGroups = [];
    
    try {
      // Method 1: Direct management routing (for emergencies/escalations)
      if (strategy.routing_methods.includes('DIRECT_MANAGEMENT') || 
          strategy.routing_methods.includes('MANAGEMENT_ESCALATION')) {
        const managementGroups = await prisma.whatsAppGroup.findMany({
          where: {
            department: 'MANAGEMENT',
            is_active: true
          },
          orderBy: {
            priority_level: 'asc'
          }
        });
        
        targetGroups.push(...managementGroups.map(group => ({
          ...group,
          routing_method: 'MANAGEMENT',
          match_score: 1.0
        })));
      }

      // Method 2: AI Category-based routing
      if (strategy.routing_methods.includes('AI_CATEGORY')) {
        const categoryGroups = await this.getCategoryBasedGroups(aiAnalysisResult.advanced_category);
        targetGroups.push(...categoryGroups);
      }

      // Method 3: Keyword-based routing
      if (strategy.routing_methods.includes('KEYWORD_MATCHING')) {
        const keywordGroups = await this.getKeywordBasedGroups(aiAnalysisResult.business_context);
        targetGroups.push(...keywordGroups);
      }

      // Method 4: Department specialization routing
      if (strategy.routing_methods.includes('DEPARTMENT_SPECIALIZATION')) {
        const deptGroups = await this.getDepartmentSpecializationGroups(aiAnalysisResult);
        targetGroups.push(...deptGroups);
      }

      // Method 5: All departments (for critical emergencies)
      if (strategy.routing_methods.includes('ALL_DEPARTMENTS')) {
        const allGroups = await prisma.whatsAppGroup.findMany({
          where: { is_active: true },
          orderBy: { priority_level: 'asc' }
        });
        
        targetGroups.push(...allGroups.map(group => ({
          ...group,
          routing_method: 'ALL_DEPARTMENTS',
          match_score: 0.8
        })));
      }

      // Remove duplicates and sort by match score
      const uniqueGroups = this.removeDuplicateGroups(targetGroups);
      const sortedGroups = uniqueGroups.sort((a, b) => b.match_score - a.match_score);

      logger.info(`🎯 TARGET GROUPS: Found ${sortedGroups.length} potential targets`);
      return sortedGroups;

    } catch (error) {
      logger.error('❌ TARGET GROUPS: Failed to get target groups:', error);
      return [];
    }
  }

  /**
   * Get groups based on AI category
   */
  async getCategoryBasedGroups(category) {
    const categoryMapping = {
      URGENT: ['MANAGEMENT'],
      ESCALATION: ['MANAGEMENT', 'CUSTOMER_SERVICE'],
      COMPLAINT: ['CUSTOMER_SERVICE', 'FACILITY_MANAGEMENT', 'EQUIPMENT_MAINTENANCE'],
      INSTRUCTION: ['EQUIPMENT_MAINTENANCE', 'FACILITY_MANAGEMENT'],
      CASUAL: ['CUSTOMER_SERVICE']
    };

    const departments = categoryMapping[category] || ['CUSTOMER_SERVICE'];
    
    const groups = await prisma.whatsAppGroup.findMany({
      where: {
        department: { in: departments },
        is_active: true
      },
      orderBy: {
        priority_level: 'asc'
      }
    });

    return groups.map(group => ({
      ...group,
      routing_method: 'AI_CATEGORY',
      match_score: 0.9
    }));
  }

  /**
   * Get groups based on keyword matching
   */
  async getKeywordBasedGroups(businessContext) {
    const keywordGroups = [];
    
    if (!businessContext || !businessContext.gym_areas) {
      return keywordGroups;
    }

    // Get issue categories with matching keywords
    const categories = await prisma.issueCategory.findMany({
      where: { auto_route: true },
      include: { routing_rules: { include: { whatsapp_group: true } } }
    });

    for (const category of categories) {
      try {
        const keywords = JSON.parse(category.keywords);
        const gymAreas = businessContext.gym_areas || [];
        
        // Check if any keywords match gym areas
        const hasMatch = keywords.some(keyword => 
          gymAreas.some(area => area.toLowerCase().includes(keyword.toLowerCase()))
        );

        if (hasMatch && category.routing_rules.length > 0) {
          category.routing_rules.forEach(rule => {
            if (rule.whatsapp_group && rule.is_active) {
              keywordGroups.push({
                ...rule.whatsapp_group,
                routing_method: 'KEYWORD_MATCHING',
                match_score: 0.8,
                matched_category: category.category_name
              });
            }
          });
        }
      } catch (error) {
        logger.warning(`⚠️ KEYWORD MATCHING: Failed to parse keywords for category ${category.id}`);
      }
    }

    return keywordGroups;
  }

  /**
   * Get groups based on department specialization
   */
  async getDepartmentSpecializationGroups(aiAnalysisResult) {
    const specializationGroups = [];
    
    // Use business context to determine specialization
    const businessContext = aiAnalysisResult.business_context || {};
    const urgencyLevel = businessContext.urgency_level || 'medium';
    
    // High urgency goes to specialized departments
    if (urgencyLevel === 'high' || urgencyLevel === 'critical') {
      const specializedGroups = await prisma.whatsAppGroup.findMany({
        where: {
          OR: [
            { department: 'EQUIPMENT_MAINTENANCE' },
            { department: 'FACILITY_MANAGEMENT' }
          ],
          is_active: true,
          priority_level: { lte: 2 }
        }
      });

      specializationGroups.push(...specializedGroups.map(group => ({
        ...group,
        routing_method: 'SPECIALIZATION',
        match_score: 0.85
      })));
    }

    return specializationGroups;
  }

  /**
   * Remove duplicate groups from target list
   */
  removeDuplicateGroups(groups) {
    const seen = new Set();
    const unique = [];
    
    for (const group of groups) {
      if (!seen.has(group.id)) {
        seen.add(group.id);
        unique.push(group);
      }
    }
    
    return unique;
  }

  /**
   * Optimize target selection with load balancing and priority
   */
  async optimizeTargetSelection(targetGroups, strategy) {
    if (targetGroups.length === 0) {
      logger.warning('⚠️ OPTIMIZATION: No target groups available');
      return [];
    }

    let optimizedTargets = [...targetGroups];

    // Emergency mode: route to all available groups
    if (strategy.emergency_mode) {
      logger.info('🚨 OPTIMIZATION: Emergency mode - routing to all groups');
      return optimizedTargets.slice(0, 5); // Limit to 5 groups max
    }

    // Load balancing for standard routing
    if (strategy.load_balancing && this.config.LOAD_BALANCING_ENABLED) {
      optimizedTargets = await this.applyLoadBalancing(optimizedTargets);
    }

    // Priority filtering
    const highPriorityGroups = optimizedTargets.filter(group => group.priority_level <= 2);
    if (highPriorityGroups.length > 0) {
      optimizedTargets = highPriorityGroups;
    }

    // Limit to top 3 groups for non-emergency routing
    const finalTargets = optimizedTargets.slice(0, 3);
    
    logger.info(`⚡ OPTIMIZATION: Selected ${finalTargets.length} optimized targets`);
    return finalTargets;
  }

  /**
   * Apply load balancing based on recent routing activity
   */
  async applyLoadBalancing(groups) {
    try {
      // Get recent routing activity (last 24 hours)
      const recentActivity = await prisma.messageRoutingLog.groupBy({
        by: ['target_group_id'],
        where: {
          routed_at: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        },
        _count: {
          target_group_id: true
        }
      });

      // Create load map
      const loadMap = new Map();
      recentActivity.forEach(activity => {
        loadMap.set(activity.target_group_id, activity._count.target_group_id);
      });

      // Sort groups by load (ascending) and match score (descending)
      return groups.sort((a, b) => {
        const loadA = loadMap.get(a.id) || 0;
        const loadB = loadMap.get(b.id) || 0;
        
        // If load difference is significant, prioritize less loaded group
        if (Math.abs(loadA - loadB) > 2) {
          return loadA - loadB;
        }
        
        // Otherwise, prioritize by match score
        return b.match_score - a.match_score;
      });

    } catch (error) {
      logger.error('❌ LOAD BALANCING: Failed to apply load balancing:', error);
      return groups;
    }
  }

  /**
   * Execute routing to selected groups with retry logic
   */
  async executeRouting(targetGroups, messageData, aiAnalysisResult, routingId) {
    const result = {
      success: false,
      routed_groups: [],
      failed_groups: [],
      escalation_triggered: false,
      routing_logs: []
    };

    if (targetGroups.length === 0) {
      logger.warning(`⚠️ ROUTING [${routingId}]: No target groups to route to`);
      return result;
    }

    // Format routing message
    const routingMessage = this.formatRoutingMessage(messageData, aiAnalysisResult);

    // Route to each target group
    for (const targetGroup of targetGroups) {
      let attempts = 0;
      let routingSuccess = false;

      while (attempts < this.config.MAX_ROUTING_ATTEMPTS && !routingSuccess) {
        attempts++;
        
        try {
          logger.info(`📤 ROUTING [${routingId}]: Attempt ${attempts} to ${targetGroup.group_name}`);
          
          // Send message to WhatsApp group
          const sendResult = await this.sendToWhatsAppGroup(targetGroup.group_id, routingMessage);
          
          if (!sendResult) {
            throw new Error('Message sending failed - group unavailable');
          }
          
          // Log successful routing
          const routingLog = await this.createRoutingLog(
            messageData.id,
            targetGroup,
            true, // success
            null, // no error
            attempts,
            routingId
          );
          
          result.routed_groups.push({
            group_id: targetGroup.group_id,
            group_name: targetGroup.group_name,
            department: targetGroup.department,
            routing_method: targetGroup.routing_method,
            attempts: attempts
          });
          
          result.routing_logs.push(routingLog);
          routingSuccess = true;
          
          logger.info(`✅ ROUTING [${routingId}]: Successfully routed to ${targetGroup.group_name}`);

        } catch (error) {
          logger.error(`❌ ROUTING [${routingId}]: Attempt ${attempts} failed for ${targetGroup.group_name}:`, error);
          
          if (attempts >= this.config.MAX_ROUTING_ATTEMPTS) {
            // Log failed routing
            const routingLog = await this.createRoutingLog(
              messageData.id,
              targetGroup,
              false, // failed
              error.message,
              attempts,
              routingId
            );
            
            result.failed_groups.push({
              group_id: targetGroup.group_id,
              group_name: targetGroup.group_name,
              error: error.message,
              attempts: attempts
            });
            
            result.routing_logs.push(routingLog);
          } else {
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, this.config.RETRY_DELAY));
          }
        }
      }
    }

    result.success = result.routed_groups.length > 0;
    
    // Trigger escalation if all routing failed for critical messages
    if (!result.success && (aiAnalysisResult.advanced_category === 'URGENT' || aiAnalysisResult.advanced_category === 'ESCALATION')) {
      result.escalation_triggered = await this.triggerEscalationProtocol(messageData, aiAnalysisResult, routingId);
    }

    return result;
  }

  /**
   * Format message for routing to WhatsApp groups
   */
  formatRoutingMessage(messageData, aiAnalysisResult) {
    const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    const category = aiAnalysisResult.advanced_category;
    const urgencyEmoji = this.getUrgencyEmoji(category);
    const confidence = (aiAnalysisResult.confidence_score * 100).toFixed(0);
    
    let formattedMessage = `${urgencyEmoji} *WTF GYM - ${category} MESSAGE* ${urgencyEmoji}\n\n`;
    formattedMessage += `📱 *From:* ${messageData.fromName || messageData.fromNumber}\n`;
    formattedMessage += `💬 *Message:* ${messageData.body}\n`;
    formattedMessage += `⏰ *Time:* ${timestamp}\n`;
    formattedMessage += `🎯 *Category:* ${category} (${confidence}% confidence)\n`;
    
    if (aiAnalysisResult.escalation_score > 0.5) {
      formattedMessage += `⚡ *Escalation Risk:* ${(aiAnalysisResult.escalation_score * 100).toFixed(0)}%\n`;
    }
    
    if (aiAnalysisResult.business_context?.urgency_level) {
      formattedMessage += `📊 *Urgency:* ${aiAnalysisResult.business_context.urgency_level.toUpperCase()}\n`;
    }
    
    formattedMessage += `\n---\n*Please respond promptly to maintain customer satisfaction* 🤝`;
    
    return formattedMessage;
  }

  /**
   * Get emoji for urgency level
   */
  getUrgencyEmoji(category) {
    const emojiMap = {
      URGENT: '🚨',
      ESCALATION: '📢',
      COMPLAINT: '⚠️',
      INSTRUCTION: '📋',
      CASUAL: '💬'
    };
    return emojiMap[category] || '💬';
  }

  /**
   * Send message to WhatsApp group
   */
  async sendToWhatsAppGroup(groupId, message) {
    try {
      if (!this.whatsappClient || !this.whatsappClient.sendMessage) {
        throw new Error('WhatsApp client not available');
      }
      
      await this.whatsappClient.sendMessage(groupId, message);
      logger.info(`✅ WHATSAPP: Message sent to group ${groupId}`);
      return true;
      
    } catch (error) {
      // Handle specific WhatsApp evaluation errors more gracefully
      if (error.message && error.message.includes('Evaluation failed')) {
        logger.warning(`⚠️ WHATSAPP: Group ${groupId} unavailable (evaluation failed) - skipping`);
        // Don't throw error for evaluation failures - group might not exist or be accessible
        return false;
      } else {
        logger.error(`❌ WHATSAPP: Failed to send message to group ${groupId}:`, error);
        throw error;
      }
    }
  }

  /**
   * Create routing log entry
   */
  async createRoutingLog(messageId, targetGroup, success, errorMessage, attempts, routingId) {
    try {
      // Find the routing rule used (if any)
      const routingRule = await prisma.routingRule.findFirst({
        where: {
          whatsapp_group_id: targetGroup.id,
          is_active: true
        }
      });

      const logEntry = await prisma.messageRoutingLog.create({
        data: {
          message_id: messageId,
          routing_rule_id: routingRule?.id || null,
          target_group_id: targetGroup.id,
          routing_success: success,
          error_message: errorMessage,
          retry_count: attempts - 1,
          metadata: JSON.stringify({
            routing_id: routingId,
            routing_method: targetGroup.routing_method,
            match_score: targetGroup.match_score,
            department: targetGroup.department
          })
        }
      });

      return logEntry;

    } catch (error) {
      logger.error('❌ ROUTING LOG: Failed to create routing log:', error);
      return null;
    }
  }

  /**
   * Trigger escalation protocol for critical failures
   */
  async triggerEscalationProtocol(messageData, aiAnalysisResult, routingId) {
    try {
      logger.warning(`🚨 ESCALATION [${routingId}]: Triggering escalation protocol for critical message`);
      
      // Try to send to all management groups
      const managementGroups = await prisma.whatsAppGroup.findMany({
        where: {
          department: 'MANAGEMENT',
          is_active: true
        }
      });

      const escalationMessage = `🚨 *URGENT ESCALATION* 🚨\n\n` +
        `❌ *ROUTING FAILED* for critical message\n` +
        `📱 From: ${messageData.fromName || messageData.fromNumber}\n` +
        `💬 Message: ${messageData.body}\n` +
        `🎯 Category: ${aiAnalysisResult.advanced_category}\n` +
        `⚡ Escalation Score: ${(aiAnalysisResult.escalation_score * 100).toFixed(0)}%\n\n` +
        `*IMMEDIATE ATTENTION REQUIRED* ⚠️`;

      let escalationSuccess = false;
      for (const group of managementGroups) {
        try {
          await this.sendToWhatsAppGroup(group.group_id, escalationMessage);
          escalationSuccess = true;
          logger.info(`✅ ESCALATION: Sent to management group ${group.group_name}`);
        } catch (error) {
          logger.error(`❌ ESCALATION: Failed to send to ${group.group_name}:`, error);
        }
      }

      return escalationSuccess;

    } catch (error) {
      logger.error(`❌ ESCALATION [${routingId}]: Escalation protocol failed:`, error);
      return false;
    }
  }

  /**
   * Log routing activity and update statistics
   */
  async logRoutingActivity(routingId, messageData, routingResults, startTime) {
    try {
      // Update routing rule statistics
      for (const logEntry of routingResults.routing_logs) {
        if (logEntry && logEntry.routing_rule_id) {
          await this.updateRoutingRuleStats(logEntry.routing_rule_id, routingResults.success);
        }
      }

      // Log overall routing activity
      logger.info(`📊 ROUTING ACTIVITY [${routingId}]: Success: ${routingResults.success}, Groups: ${routingResults.routed_groups.length}, Time: ${Date.now() - startTime}ms`);

    } catch (error) {
      logger.error('❌ ROUTING ACTIVITY: Failed to log activity:', error);
    }
  }

  /**
   * Update routing rule statistics
   */
  async updateRoutingRuleStats(routingRuleId, success) {
    try {
      const currentRule = await prisma.routingRule.findUnique({
        where: { id: routingRuleId }
      });

      if (currentRule) {
        const newTotalRouted = currentRule.total_routed + 1;
        const newSuccessfulRoutes = success ? currentRule.successful_routes + 1 : currentRule.successful_routes;
        const newSuccessRate = newTotalRouted > 0 ? newSuccessfulRoutes / newTotalRouted : 0;

        await prisma.routingRule.update({
          where: { id: routingRuleId },
          data: {
            total_routed: newTotalRouted,
            successful_routes: newSuccessfulRoutes,
            success_rate: newSuccessRate
          }
        });
      }

    } catch (error) {
      logger.error('❌ ROUTING STATS: Failed to update routing rule stats:', error);
    }
  }

  /**
   * Update overall routing statistics
   */
  updateRoutingStats(success, processingTime) {
    this.routingStats.total_routed++;
    
    if (success) {
      this.routingStats.successful_routes++;
    } else {
      this.routingStats.failed_routes++;
    }

    // Update average routing time
    const totalRouted = this.routingStats.total_routed;
    const currentAverage = this.routingStats.average_routing_time;
    this.routingStats.average_routing_time = 
      (currentAverage * (totalRouted - 1) + processingTime) / totalRouted;
  }

  /**
   * Emergency fallback routing when main routing fails
   */
  async emergencyFallbackRouting(messageData, aiAnalysisResult) {
    try {
      logger.warning('🚨 EMERGENCY FALLBACK: Attempting emergency routing');
      
      // Try to send to customer service as last resort
      const fallbackGroups = await prisma.whatsAppGroup.findMany({
        where: {
          department: 'CUSTOMER_SERVICE',
          is_active: true
        },
        take: 1
      });

      if (fallbackGroups.length > 0) {
        const fallbackMessage = `⚠️ *EMERGENCY ROUTING* ⚠️\n\n` +
          `System routing failed - please handle manually\n` +
          `From: ${messageData.fromName || messageData.fromNumber}\n` +
          `Message: ${messageData.body}\n` +
          `Category: ${aiAnalysisResult.advanced_category}`;

        await this.sendToWhatsAppGroup(fallbackGroups[0].group_id, fallbackMessage);
        return { success: true, group: fallbackGroups[0].group_name };
      }

      return { success: false, error: 'No fallback groups available' };

    } catch (error) {
      logger.error('❌ EMERGENCY FALLBACK: Failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get routing statistics
   */
  getRoutingStatistics() {
    return {
      ...this.routingStats,
      success_rate: this.routingStats.total_routed > 0 ? 
        this.routingStats.successful_routes / this.routingStats.total_routed : 0
    };
  }

  /**
   * Reset routing statistics
   */
  resetRoutingStatistics() {
    this.routingStats = {
      total_routed: 0,
      successful_routes: 0,
      failed_routes: 0,
      escalations: 0,
      average_routing_time: 0
    };
  }
}

module.exports = WhatsAppRoutingEngine;