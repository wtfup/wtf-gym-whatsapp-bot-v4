const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const path = require('path');
const logger = require('./logger');
const { PrismaClient } = require('@prisma/client');
const aiEngine = require('./ai-analysis-engine');

const prisma = new PrismaClient();

class WhatsAppClient {
  constructor() {
    this.client = null;
    this.io = null;
    this.isReady = false;
    this.qrCode = null;
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
      
      this.emitToFrontend('ready', {
        pushname: clientInfo.pushname,
        number: clientInfo.wid.user,
        platform: clientInfo.platform
      });

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

      // Save to database
      await this.saveMessage(messageData);

      // AI Analysis & Auto-flagging
      await this.processAIAnalysis(messageData);

      // Emit to frontend
      this.emitToFrontend('message', messageData);

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

      // Emit to frontend
      this.emitToFrontend('message', messageData);

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
          sentiment: messageData.sentiment,
          intent: messageData.intent,
          entities: messageData.entities ? JSON.stringify(messageData.entities) : null,
          confidence: messageData.confidence,
          isFlagged: messageData.isFlagged,
          flagReason: messageData.flagReason,
          flaggedAt: messageData.flaggedAt
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
          sentiment: messageData.sentiment,
          intent: messageData.intent,
          entities: messageData.entities ? JSON.stringify(messageData.entities) : null,
          confidence: messageData.confidence,
          isFlagged: messageData.isFlagged,
          flagReason: messageData.flagReason,
          flaggedAt: messageData.flaggedAt
        }
      });
    } catch (error) {
      logger.error('Error saving message to database', error);
    }
  }

  async processAIAnalysis(messageData) {
    try {
      // Skip AI analysis for messages from self
      if (messageData.isFromMe) {
        return;
      }

      logger.info(`🤖 Processing AI analysis for message from ${messageData.fromName}`);

      // Get AI analysis
      const analysis = await aiEngine.analyzeMessage(messageData.body, {
        chatName: messageData.chatName,
        fromName: messageData.fromName,
        isGroup: messageData.isGroup
      });

      // Update message data with AI analysis
      messageData.sentiment = analysis.sentiment.sentiment;
      messageData.intent = analysis.intent.intent;
      messageData.entities = analysis.entities;
      messageData.confidence = analysis.confidence;
      messageData.isFlagged = analysis.flagging.shouldFlag;
      messageData.flagReason = analysis.flagging.flagReasons.join(', ');
      messageData.flaggedAt = analysis.flagging.shouldFlag ? new Date() : null;

      // Handle flagged messages
      if (analysis.flagging.shouldFlag) {
        await this.handleFlaggedMessage(messageData, analysis);
      }

      logger.success(`🤖 AI analysis completed: ${analysis.sentiment.sentiment}/${analysis.intent.intent} (Flagged: ${analysis.flagging.shouldFlag})`);

    } catch (error) {
      logger.error('Error in AI analysis processing', error);
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
        flagReason: analysis.flagging.flagReasons.join(', '),
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

  async destroy() {
    if (this.client) {
      await this.client.destroy();
      logger.info('WhatsApp client destroyed');
    }
  }
}

module.exports = new WhatsAppClient(); 