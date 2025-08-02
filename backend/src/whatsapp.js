const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const path = require('path');
const logger = require('./logger');
const { PrismaClient } = require('@prisma/client');
const aiEngine = require('./ai-analysis-engine');
const MultiEngineAIPipeline = require('./multi-engine-ai-pipeline');
const WhatsAppRoutingEngine = require('./whatsapp-routing-engine');

const prisma = new PrismaClient();

class WhatsAppClient {
  constructor() {
    this.client = null;
    this.io = null;
    this.isReady = false;
    this.qrCode = null;
    
    // Initialize advanced AI systems
    this.aiPipeline = new MultiEngineAIPipeline();
    this.routingEngine = null; // Will be initialized after client is ready
  }

  setSocketIO(io) {
    this.io = io;
    logger.setSocketIO(io);
  }

  async initialize() {
    try {
      logger.info('Initializing WhatsApp client...');
      
      this.client = new Client({
        authStrategy: new LocalAuth({
          dataPath: path.resolve(process.env.SESSION_PATH)
        }),
        puppeteer: {
          headless: true,  // Always headless - no separate browser window
          args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
        }
      });

      this.setupEventHandlers();
      
      logger.info('Starting WhatsApp client initialization...');
      await this.client.initialize();
      
    } catch (error) {
      logger.error('Failed to initialize WhatsApp client', error);
      throw error;
    }
  }

  setupEventHandlers() {
    // Loading screen
    this.client.on('loading_screen', (percent, message) => {
      logger.info(`Loading: ${percent}% - ${message}`);
      this.emitToFrontend('loading', { percent, message });
    });

    // QR Code generation
    this.client.on('qr', (qr) => {
      this.qrCode = qr;
      logger.qr('QR Code received - Scan with your WhatsApp mobile app');
      qrcode.generate(qr, { small: true });
      this.emitToFrontend('qr', { qr });
    });

    // Authentication success
    this.client.on('authenticated', () => {
      logger.auth('WhatsApp authentication successful');
      this.emitToFrontend('authenticated', {});
    });

    // Authentication failure
    this.client.on('auth_failure', (msg) => {
      logger.error('WhatsApp authentication failed', msg);
      this.emitToFrontend('auth_failure', { message: msg });
    });

    // Client ready
    this.client.on('ready', async () => {
      this.isReady = true;
      const clientInfo = this.client.info;
      logger.success(`WhatsApp client ready! Logged in as: ${clientInfo.pushname} (${clientInfo.wid.user})`);
      
      // Initialize routing engine with WhatsApp client
      this.routingEngine = new WhatsAppRoutingEngine(this.client);
      logger.info('🔄 Advanced routing engine initialized');
      
      this.emitToFrontend('ready', {
        pushname: clientInfo.pushname,
        number: clientInfo.wid.user,
        platform: clientInfo.platform
      });

      // FIXED: Emit WhatsApp status when ready
      this.emitWhatsAppStatus();

      // Get recent chats and contacts
      await this.syncChatsAndContacts();
    });

    // Incoming messages
    this.client.on('message', async (message) => {
      await this.handleIncomingMessage(message);
    });

    // Message creation (outgoing)
    this.client.on('message_create', async (message) => {
      if (message.fromMe) {
        await this.handleOutgoingMessage(message);
      }
    });

    // Disconnection
    this.client.on('disconnected', (reason) => {
      this.isReady = false;
      logger.warning(`WhatsApp client disconnected: ${reason}`);
      this.emitToFrontend('disconnected', { reason });
    });
  }

  async handleIncomingMessage(message) {
    try {
      const chat = await message.getChat();
      const contact = await message.getContact();
      
      logger.whatsapp(`📥 Message from ${contact.name || contact.number} in ${chat.name || 'Private'}: "${message.body}"`);

      const messageData = {
        id: message.id.id,
        fromNumber: contact.number,
        fromName: contact.name || contact.pushname,
        chatId: chat.id._serialized,
        chatName: chat.name,
        body: message.body,
        timestamp: new Date(message.timestamp * 1000),
        messageType: message.type,
        isGroup: chat.isGroup,
        isFromMe: message.fromMe,
        hasMedia: message.hasMedia
      };

      // MEDIA PROCESSING: Handle media files if present
      if (message.hasMedia) {
        await this.processMediaMessage(message, messageData);
      }

      // AI Analysis & Auto-flagging BEFORE saving to capture AI results
      await this.processAIAnalysis(messageData);

      // Save to database AFTER AI analysis to include AI results
      await this.saveMessage(messageData);

      // Emit to frontend with mapped field names
      this.emitToFrontend('message', {
        ...messageData,
        sender_name: messageData.fromName,
        message: messageData.body,
        group_name: messageData.chatName,
        received_at: messageData.timestamp,
        number: messageData.fromNumber,
        // AI ANALYSIS FIELDS  
        sentiment: messageData.sentiment,
        ai_sentiment: messageData.sentiment,
        intent: messageData.intent,
        ai_intent: messageData.intent,
        confidence: messageData.confidence,
        // ADVANCED CATEGORIZATION FIELDS
        advanced_category: messageData.advanced_category,
        business_context: messageData.business_context,
        escalation_score: messageData.escalation_score,
        repetition_count: messageData.repetition_count,
        // ROUTING FIELDS
        routing_status: messageData.routing_status,
        routed_groups: messageData.routed_groups,
        routing_strategy: messageData.routing_strategy,
        // MEDIA FIELDS FOR FRONTEND
        media_url: messageData.mediaUrl,
        media_type: messageData.mediaType,
        media_filename: messageData.mediaFilename,
        media_size: messageData.mediaSize,
        mime_type: messageData.mimeType,
        has_media: messageData.hasMedia,
        // FLAGGING FIELDS
        flag_type: messageData.advanced_category || (messageData.isFlagged ? 'complaint' : null),
        flag_reason: messageData.flagReason,
        isFlagged: messageData.isFlagged
      });

    } catch (error) {
      logger.error('Error handling incoming message', error);
    }
  }

  async handleOutgoingMessage(message) {
    try {
      const chat = await message.getChat();
      
      logger.whatsapp(`📤 Sent message to ${chat.name || 'Private'}: "${message.body}"`);

      const messageData = {
        id: message.id.id,
        fromNumber: this.client.info.wid.user,
        fromName: this.client.info.pushname,
        toNumber: chat.id.user,
        chatId: chat.id._serialized,
        chatName: chat.name,
        body: message.body,
        timestamp: new Date(message.timestamp * 1000),
        messageType: message.type,
        isGroup: chat.isGroup,
        isFromMe: true,
        hasMedia: message.hasMedia
      };

      // Save to database
      await this.saveMessage(messageData);

      // Emit to frontend with mapped field names
      this.emitToFrontend('message', {
        ...messageData,
        sender_name: messageData.fromName,
        message: messageData.body,
        group_name: messageData.chatName,
        received_at: messageData.timestamp,
        number: messageData.fromNumber,
        // AI ANALYSIS FIELDS (outgoing messages usually don't have AI analysis)
        sentiment: messageData.sentiment || null,
        ai_sentiment: messageData.sentiment || null,
        intent: messageData.intent || null,
        ai_intent: messageData.intent || null,
        confidence: messageData.confidence || null,
        // MEDIA FIELDS FOR FRONTEND
        media_url: messageData.mediaUrl || null,
        media_type: messageData.mediaType || null,
        media_filename: messageData.mediaFilename || null,
        media_size: messageData.mediaSize || null,
        mime_type: messageData.mimeType || null,
        has_media: messageData.hasMedia || false,
        // FLAGGING FIELDS
        flag_type: messageData.isFlagged ? 'complaint' : null,
        flag_reason: messageData.flagReason || null,
        isFlagged: messageData.isFlagged || false
      });

    } catch (error) {
      logger.error('Error handling outgoing message', error);
    }
  }

  async saveMessage(messageData) {
    try {
      await prisma.message.upsert({
        where: { messageId: messageData.id },
        update: {
          fromNumber: messageData.fromNumber,
          fromName: messageData.fromName,
          toNumber: messageData.toNumber,
          chatId: messageData.chatId,
          chatName: messageData.chatName,
          body: messageData.body,
          timestamp: messageData.timestamp,
          messageType: messageData.messageType,
          isGroup: messageData.isGroup,
          isFromMe: messageData.isFromMe,
          hasMedia: messageData.hasMedia,
          mediaUrl: messageData.mediaUrl,
          mediaType: messageData.mediaType,
          mediaFilename: messageData.mediaFilename,
          mediaSize: messageData.mediaSize,
          mimeType: messageData.mimeType,
          sentiment: messageData.sentiment,
          intent: messageData.intent,
          entities: messageData.entities ? JSON.stringify(messageData.entities) : null,
          confidence: messageData.confidence,
          isFlagged: messageData.isFlagged,
          flagReason: messageData.flagReason,
          flaggedAt: messageData.flaggedAt,
          // NEW: Advanced categorization fields
          advanced_category: messageData.advanced_category,
          business_context: messageData.business_context,
          repetition_count: messageData.repetition_count || 0,
          escalation_score: messageData.escalation_score || 0.0
        },
        create: {
          messageId: messageData.id,
          fromNumber: messageData.fromNumber,
          fromName: messageData.fromName,
          toNumber: messageData.toNumber,
          chatId: messageData.chatId,
          chatName: messageData.chatName,
          body: messageData.body,
          timestamp: messageData.timestamp,
          messageType: messageData.messageType,
          isGroup: messageData.isGroup,
          isFromMe: messageData.isFromMe,
          hasMedia: messageData.hasMedia,
          mediaUrl: messageData.mediaUrl,
          mediaType: messageData.mediaType,
          mediaFilename: messageData.mediaFilename,
          mediaSize: messageData.mediaSize,
          mimeType: messageData.mimeType,
          sentiment: messageData.sentiment,
          intent: messageData.intent,
          entities: messageData.entities ? JSON.stringify(messageData.entities) : null,
          confidence: messageData.confidence,
          isFlagged: messageData.isFlagged,
          flagReason: messageData.flagReason,
          flaggedAt: messageData.flaggedAt,
          // NEW: Advanced categorization fields
          advanced_category: messageData.advanced_category,
          business_context: messageData.business_context,
          repetition_count: messageData.repetition_count || 0,
          escalation_score: messageData.escalation_score || 0.0
        }
      });
    } catch (error) {
      logger.error('Error saving message to database', error);
    }
  }

  async processMediaMessage(message, messageData) {
    try {
      logger.info(`📎 Processing media message from ${messageData.fromName}`);

      // Get media data
      const media = await message.downloadMedia();
      
      if (!media) {
        logger.warning('📎 Failed to download media');
        return;
      }

      // Determine media type and extension
      const mimeType = media.mimetype;
      let mediaType = 'document'; // default
      let extension = 'bin'; // default

      if (mimeType.startsWith('image/')) {
        mediaType = 'image';
        extension = mimeType.split('/')[1].split(';')[0];
      } else if (mimeType.startsWith('video/')) {
        mediaType = 'video';
        extension = mimeType.split('/')[1].split(';')[0];
      } else if (mimeType.startsWith('audio/')) {
        mediaType = 'audio';
        extension = mimeType.split('/')[1].split(';')[0];
      } else if (mimeType.includes('application/pdf')) {
        mediaType = 'document';
        extension = 'pdf';
      }

      // Generate unique filename
      const timestamp = Date.now();
      const filename = media.filename || `media_${timestamp}.${extension}`;
      const uniqueFilename = `${timestamp}_${filename}`;

      // Create media directory if it doesn't exist
      const fs = require('fs');
      const path = require('path');
      const mediaDir = path.join(__dirname, '..', 'public', 'media');
      
      if (!fs.existsSync(mediaDir)) {
        fs.mkdirSync(mediaDir, { recursive: true });
      }

      // Save media file
      const filePath = path.join(mediaDir, uniqueFilename);
      const buffer = Buffer.from(media.data, 'base64');
      fs.writeFileSync(filePath, buffer);

      // Generate media URL
      const mediaUrl = `/api/media/${uniqueFilename}`;

      // Update message data
      messageData.mediaUrl = mediaUrl;
      messageData.mediaType = mediaType;
      messageData.mediaFilename = filename;
      messageData.mediaSize = buffer.length;
      messageData.mimeType = mimeType;

      logger.success(`📎 Media processed successfully: ${mediaType} (${Math.round(buffer.length / 1024)}KB) -> ${mediaUrl}`);

    } catch (error) {
      logger.error('📎 Error processing media message', error);
    }
  }

  async processAIAnalysis(messageData) {
    try {
      // Skip AI analysis for messages from self
      if (messageData.isFromMe) {
        return;
      }

      logger.info(`🧠 ADVANCED AI: Processing multi-engine analysis for message from ${messageData.fromName}`);

      // Prepare sender and chat context
      const senderInfo = {
        number: messageData.fromNumber,
        name: messageData.fromName
      };
      
      const chatContext = {
        chatId: messageData.chatId,
        chatName: messageData.chatName,
        isGroup: messageData.isGroup
      };

      // Execute advanced AI pipeline
      const pipelineResult = await this.aiPipeline.analyzeMessage(messageData, senderInfo, chatContext);
      
      if (!pipelineResult.success) {
        logger.warning(`⚠️ AI PIPELINE: Analysis failed, using fallback result`);
      }

      const finalDecision = pipelineResult.final_decision;

      // Update message data with advanced AI analysis
      messageData.sentiment = finalDecision.sentiment || 'neutral';
      messageData.intent = finalDecision.intent || 'general';
      messageData.entities = finalDecision.business_context ? JSON.stringify(finalDecision.business_context) : null;
      messageData.confidence = finalDecision.final_confidence || finalDecision.confidence_score || 0.5;
      messageData.isFlagged = finalDecision.flagging_decision || false;
      messageData.flagReason = this.generateFlagReason(finalDecision);
      messageData.flaggedAt = messageData.isFlagged ? new Date() : null;
      
      // NEW: Advanced categorization fields
      messageData.advanced_category = finalDecision.advanced_category || 'CASUAL';
      messageData.business_context = JSON.stringify(finalDecision.business_context || {});
      messageData.escalation_score = finalDecision.escalation_score || 0.0;
      
      // NEW: Contextual analysis data
      if (pipelineResult.engine_results?.contextual_analysis?.success) {
        const contextualResult = pipelineResult.engine_results.contextual_analysis.result;
        messageData.repetition_count = contextualResult.patterns?.repetition?.repetition_count || 0;
      }

      // Handle flagged messages with advanced routing
      if (messageData.isFlagged) {
        await this.handleAdvancedFlaggedMessage(messageData, finalDecision, pipelineResult);
      }
      
      // Execute intelligent routing for all messages (not just flagged ones)
      if (this.routingEngine && finalDecision.advanced_category !== 'CASUAL') {
        try {
          await this.executeIntelligentRouting(messageData, finalDecision, pipelineResult);
        } catch (routingError) {
          logger.warning('🔄 ROUTING: Failed to route message, continuing without routing');
          logger.warning(`Routing error: ${routingError.message}`);
          // Continue without routing - don't crash the system
          messageData.routing_status = 'failed';
          messageData.routed_groups = '';
          messageData.routing_strategy = 'none';
        }
      } else {
        logger.info('🔄 ROUTING: Skipped for CASUAL message or engine not ready');
      }

      logger.success(`✅ ADVANCED AI: Analysis completed - Category: ${messageData.advanced_category}, Sentiment: ${messageData.sentiment}, Escalation: ${messageData.escalation_score.toFixed(2)} (Flagged: ${messageData.isFlagged})`);

    } catch (error) {
      logger.error('❌ ADVANCED AI: Analysis processing failed', error);
      
      // Fallback to basic analysis
      await this.fallbackToBasicAnalysis(messageData);
    }
  }

  /**
   * Generate flag reason from advanced AI decision
   */
  generateFlagReason(finalDecision) {
    const reasons = [];
    
    if (finalDecision.advanced_category === 'URGENT') {
      reasons.push('Emergency/Safety concern detected');
    }
    
    if (finalDecision.advanced_category === 'ESCALATION') {
      reasons.push('Customer escalation pattern detected');
    }
    
    if (finalDecision.advanced_category === 'COMPLAINT') {
      reasons.push('Service/facility complaint identified');
    }
    
    if (finalDecision.escalation_score >= 0.7) {
      reasons.push(`High escalation risk (${(finalDecision.escalation_score * 100).toFixed(0)}%)`);
    }
    
    if (finalDecision.business_rules_applied?.length > 0) {
      reasons.push(`Business rules: ${finalDecision.business_rules_applied.join(', ')}`);
    }
    
    return reasons.length > 0 ? reasons.join(', ') : 'AI flagging decision';
  }

  /**
   * Handle flagged messages with advanced categorization
   */
  async handleAdvancedFlaggedMessage(messageData, finalDecision, pipelineResult) {
    try {
      logger.warning(`🚨 ADVANCED FLAGGING: ${messageData.advanced_category} - ${this.generateFlagReason(finalDecision)}`);

      // Save to flagged_messages table with enhanced data
      await prisma.flaggedMessage.create({
        data: {
          messageId: messageData.id,
          fromNumber: messageData.fromNumber,
          fromName: messageData.fromName,
          chatId: messageData.chatId,
          chatName: messageData.chatName,
          body: messageData.body,
          timestamp: messageData.timestamp,
          messageType: messageData.messageType,
          isGroup: messageData.isGroup,
          flagReason: messageData.flagReason,
          category: finalDecision.advanced_category,
          priority: this.getCategoryPriority(finalDecision.advanced_category),
          status: 'pending',
          // NEW: Advanced fields
          escalationScore: finalDecision.escalation_score,
          businessContext: messageData.business_context,
          repetitionCount: messageData.repetition_count || 0,
          confidence: messageData.confidence
        }
      });

      // Emit enhanced flagged message to frontend
      this.emitToFrontend('flagged_message', {
        ...messageData,
        // MAP TO FRONTEND EXPECTED FIELD NAMES
        sender_name: messageData.fromName,
        message: messageData.body,
        group_name: messageData.chatName,
        received_at: messageData.timestamp,
        number: messageData.fromNumber,
        // ENHANCED AI ANALYSIS FIELDS
        sentiment: messageData.sentiment,
        ai_sentiment: messageData.sentiment,
        intent: messageData.intent,
        ai_intent: messageData.intent,
        confidence: messageData.confidence,
        // ADVANCED CATEGORIZATION
        advanced_category: messageData.advanced_category,
        escalation_score: messageData.escalation_score,
        business_context: messageData.business_context,
        repetition_count: messageData.repetition_count,
        // MEDIA FIELDS FOR FRONTEND
        media_url: messageData.mediaUrl,
        media_type: messageData.mediaType,
        media_filename: messageData.mediaFilename,
        media_size: messageData.mediaSize,
        mime_type: messageData.mimeType,
        has_media: messageData.hasMedia,
        // FLAGGING FIELDS
        flagReason: messageData.flagReason,
        flag_reason: messageData.flagReason,
        flag_type: finalDecision.advanced_category,
        category: finalDecision.advanced_category,
        priority: this.getCategoryPriority(finalDecision.advanced_category),
        status: 'pending'
      });

      logger.success(`🚨 Advanced flagged message processed and stored`);

    } catch (error) {
      logger.error('❌ ADVANCED FLAGGING: Error handling flagged message', error);
    }
  }

  /**
   * Execute intelligent routing based on AI categorization
   */
  async executeIntelligentRouting(messageData, finalDecision, pipelineResult) {
    try {
      if (!this.routingEngine) {
        logger.warning('⚠️ ROUTING: Routing engine not initialized, skipping routing');
        return;
      }

      logger.info(`🔄 INTELLIGENT ROUTING: Starting for category ${finalDecision.advanced_category}`);

      // Extract contextual analysis for routing decisions
      const contextualAnalysis = pipelineResult.engine_results?.contextual_analysis?.result || null;

      // Execute routing
      const routingResult = await this.routingEngine.routeMessage(messageData, finalDecision, contextualAnalysis);

      if (routingResult.success) {
        logger.success(`✅ ROUTING: Successfully routed to ${routingResult.routed_groups.length} groups using ${routingResult.strategy_used}`);
        
        // Add routing information to message data for frontend
        messageData.routing_status = 'routed';
        messageData.routed_groups = routingResult.routed_groups.map(g => g.group_name).join(', ');
        messageData.routing_strategy = routingResult.strategy_used;
      } else {
        logger.warning(`⚠️ ROUTING: Failed to route message - ${routingResult.error || 'Unknown error'}`);
        messageData.routing_status = 'failed';
        messageData.routing_error = routingResult.error;
      }

      // Emit routing update to frontend
      this.emitToFrontend('routing_update', {
        message_id: messageData.id,
        routing_result: routingResult,
        timestamp: new Date()
      });

    } catch (error) {
      logger.error('❌ ROUTING: Intelligent routing failed', error);
      messageData.routing_status = 'error';
      messageData.routing_error = error.message;
    }
  }

  /**
   * Fallback to basic analysis when advanced pipeline fails
   */
  async fallbackToBasicAnalysis(messageData) {
    try {
      logger.warning('⚠️ FALLBACK: Using basic AI analysis');

      // Use the old AI engine as fallback
      const analysis = await aiEngine.analyzeMessage(messageData.body, {
        chatName: messageData.chatName,
        fromName: messageData.fromName,
        isGroup: messageData.isGroup
      });

      // Map old analysis to new format
      messageData.sentiment = analysis.sentiment.sentiment;
      messageData.intent = analysis.intent.intent;
      messageData.entities = analysis.entities;
      messageData.confidence = analysis.confidence || 0.3;
      messageData.isFlagged = analysis.flagging.shouldFlag;
      messageData.flagReason = analysis.flagging.flagReasons.join(', ');
      messageData.flaggedAt = messageData.isFlagged ? new Date() : null;
      
      // Set fallback values for advanced fields
      messageData.advanced_category = this.mapLegacyToAdvancedCategory(analysis);
      messageData.business_context = JSON.stringify({ fallback_analysis: true });
      messageData.escalation_score = analysis.flagging.shouldFlag ? 0.5 : 0.0;
      messageData.repetition_count = 0;

      // Handle flagged messages with legacy method
      if (analysis.flagging.shouldFlag) {
        await this.handleFlaggedMessage(messageData, analysis);
      }

    } catch (error) {
      logger.error('❌ FALLBACK: Even basic analysis failed', error);
      
      // Set minimal default values
      messageData.sentiment = 'neutral';
      messageData.intent = 'general';
      messageData.confidence = 0.1;
      messageData.isFlagged = false;
      messageData.advanced_category = 'CASUAL';
      messageData.business_context = JSON.stringify({ emergency_fallback: true });
      messageData.escalation_score = 0.0;
      messageData.repetition_count = 0;
    }
  }

  /**
   * Get priority level for category
   */
  getCategoryPriority(category) {
    const priorities = {
      URGENT: 1,
      ESCALATION: 2,
      COMPLAINT: 3,
      INSTRUCTION: 4,
      CASUAL: 5
    };
    return priorities[category] || 5;
  }

  /**
   * Map legacy analysis to advanced category
   */
  mapLegacyToAdvancedCategory(analysis) {
    if (analysis.flagging.shouldFlag) {
      const flagReasons = analysis.flagging.flagReasons.join(' ').toLowerCase();
      if (flagReasons.includes('emergency') || flagReasons.includes('urgent')) {
        return 'URGENT';
      } else if (flagReasons.includes('complaint')) {
        return 'COMPLAINT';
      } else {
        return 'ESCALATION';
      }
    } else if (analysis.intent.intent === 'question') {
      return 'CASUAL';
    } else {
      return 'INSTRUCTION';
    }
  }

  async handleFlaggedMessage(messageData, analysis) {
    try {
      logger.warning(`🚨 Message flagged: ${analysis.flagging.flagReasons.join(', ')}`);

      // Save to flagged_messages table
      await prisma.flaggedMessage.create({
        data: {
          messageId: messageData.id,
          fromNumber: messageData.fromNumber,
          fromName: messageData.fromName,
          chatId: messageData.chatId,
          chatName: messageData.chatName,
          body: messageData.body,
          timestamp: messageData.timestamp,
          flagReason: analysis.flagging.flagReasons.join(', '),
          category: analysis.flagging.category,
          priority: analysis.flagging.priority,
          status: 'pending',
          sentiment: analysis.sentiment.sentiment,
          intent: analysis.intent.intent,
          confidence: analysis.confidence
        }
      });

      // Emit flagged message to frontend
      this.emitToFrontend('flagged_message', {
        ...messageData,
        // MAP TO FRONTEND EXPECTED FIELD NAMES
        sender_name: messageData.fromName,
        message: messageData.body,
        group_name: messageData.chatName,
        received_at: messageData.timestamp,
        number: messageData.fromNumber,
        // AI ANALYSIS FIELDS
        sentiment: analysis.sentiment.sentiment,
        ai_sentiment: analysis.sentiment.sentiment,
        intent: analysis.intent.intent,
        ai_intent: analysis.intent.intent,
        confidence: analysis.confidence,
        // MEDIA FIELDS FOR FRONTEND
        media_url: messageData.mediaUrl,
        media_type: messageData.mediaType,
        media_filename: messageData.mediaFilename,
        media_size: messageData.mediaSize,
        mime_type: messageData.mimeType,
        has_media: messageData.hasMedia,
        // FLAGGING FIELDS
        flagReason: analysis.flagging.flagReasons.join(', '),
        flag_reason: analysis.flagging.flagReasons.join(', '),
        flag_type: analysis.flagging.category, // ✅ FIXED: Use flag_type for frontend
        category: analysis.flagging.category,
        priority: analysis.flagging.priority,
        status: 'pending'
      });

      // Process WhatsApp group routing
      await this.processMessageRouting(messageData, analysis);

      logger.success(`🚨 Flagged message processed and stored`);

    } catch (error) {
      logger.error('Error handling flagged message', error);
    }
  }

  async processMessageRouting(messageData, analysis) {
    try {
      // Get routing rules for this category
      const routingRules = await prisma.routingRule.findMany({
        where: {
          category: analysis.flagging.category,
          isActive: true
        }
      });

      if (routingRules.length === 0) {
        logger.info(`📤 No routing rules found for category: ${analysis.flagging.category}`);
        return;
      }

      for (const rule of routingRules) {
        try {
          // Format message for routing
          const routingMessage = this.formatRoutingMessage(messageData, analysis);
          
          // Send to target group
          await this.sendMessage(rule.targetGroupId, routingMessage);
          
          logger.success(`📤 Message routed to group: ${rule.targetGroupName || rule.targetGroupId}`);
        } catch (routingError) {
          logger.error(`📤 Failed to route to group ${rule.targetGroupName}`, routingError);
        }
      }

    } catch (error) {
      logger.error('Error in message routing', error);
    }
  }

  formatRoutingMessage(messageData, analysis) {
    const priority = analysis.flagging.priority.toUpperCase();
    const category = analysis.flagging.category.toUpperCase();
    
    return `🚨 *${priority} ${category}* 🚨

*From:* ${messageData.fromName || messageData.fromNumber}
*Group:* ${messageData.chatName || 'Private Chat'}
*Time:* ${messageData.timestamp.toLocaleString()}

*Message:*
${messageData.body}

*AI Analysis:*
• Sentiment: ${analysis.sentiment.sentiment}
• Intent: ${analysis.intent.intent}
• Confidence: ${(analysis.confidence * 100).toFixed(1)}%

*Flag Reasons:*
${analysis.flagging.flagReasons.map(reason => `• ${reason}`).join('\n')}

---
*Auto-generated by WTF WhatsApp AI System*`;
  }

  async syncChatsAndContacts() {
    try {
      logger.info('Syncing chats and contacts...');
      
      const chats = await this.client.getChats();
      logger.info(`Found ${chats.length} chats`);

      for (const chat of chats.slice(0, 20)) { // Limit to first 20 chats
        try {
          await prisma.chat.upsert({
            where: { chatId: chat.id._serialized },
            update: {
              name: chat.name,
              isGroup: chat.isGroup,
              isArchived: chat.archived,
              isMuted: chat.isMuted
            },
            create: {
              chatId: chat.id._serialized,
              name: chat.name,
              isGroup: chat.isGroup,
              isArchived: chat.archived,
              isMuted: chat.isMuted
            }
          });
        } catch (error) {
          logger.error(`Error syncing chat ${chat.name}`, error);
        }
      }

      this.emitToFrontend('chats_synced', { count: chats.length });
      logger.success('Chats and contacts synced successfully');

    } catch (error) {
      logger.error('Error syncing chats and contacts', error);
    }
  }

  async sendMessage(to, message) {
    try {
      if (!this.isReady) {
        throw new Error('WhatsApp client is not ready');
      }

      const result = await this.client.sendMessage(to, message);
      logger.whatsapp(`📤 Message sent to ${to}: "${message}"`);
      return result;

    } catch (error) {
      logger.error('Error sending message', error);
      throw error;
    }
  }

  emitToFrontend(event, data) {
    if (this.io) {
      this.io.emit(event, data);
      logger.socket(`Emitted '${event}' to frontend`);
    }
  }

  getStatus() {
    return {
      isReady: this.isReady,
      qrCode: this.qrCode,
      clientInfo: this.isReady ? this.client.info : null
    };
  }

  // FIXED: Emit WhatsApp status to frontend via Socket.IO
  emitWhatsAppStatus() {
    try {
      const status = this.getStatus();
      this.emitToFrontend('whatsapp_status', {
        authenticated: status.isReady,
        status: status.isReady ? 'authenticated' : (status.qrCode ? 'qr_available' : 'initializing'),
        clientInfo: status.clientInfo,
        qrCode: status.qrCode,
        timestamp: new Date().toISOString()
      });
      logger.info(`📱 WhatsApp status emitted: ${status.isReady ? 'authenticated' : 'not authenticated'}`);
    } catch (error) {
      logger.error('Error emitting WhatsApp status', error);
    }
  }

  async destroy() {
    if (this.client) {
      await this.client.destroy();
      logger.info('WhatsApp client destroyed');
    }
  }
}

module.exports = new WhatsAppClient(); 