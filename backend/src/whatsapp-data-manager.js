/**
 * 🌐 GLOBAL WHATSAPP DATA MANAGER
 * 
 * This is the SINGLE SOURCE OF TRUTH for all WhatsApp data
 * All components should get WhatsApp data through this manager
 * 
 * Features:
 * - Real-time data synchronization
 * - Automatic updates on account changes
 * - Centralized caching and state management
 * - Event-driven updates to frontend
 * - Background data refresh
 */

const { PrismaClient } = require('@prisma/client');
const logger = require('./logger');

class WhatsAppDataManager {
  constructor() {
    this.prisma = new PrismaClient();
    this.whatsappClient = null;
    this.io = null;
    
    // Cached data - Single source of truth
    this.cache = {
      groups: [],
      contacts: [],
      chats: [],
      messages: [],
      senders: [],
      lastUpdate: null,
      isConnected: false
    };
    
    // Auto-refresh intervals
    this.intervals = {
      groups: null,
      contacts: null,
      messages: null
    };
    
    // Sync status
    this.syncStatus = {
      isRunning: false,
      lastSync: null,
      errors: []
    };
    
    logger.info('🌐 WhatsApp Data Manager initialized');
  }

  /**
   * Initialize with WhatsApp client and Socket.IO
   */
  initialize(whatsappClient, io) {
    this.whatsappClient = whatsappClient;
    this.io = io;
    
    // Start background sync processes
    this.startBackgroundSync();
    
    // Setup client event listeners
    this.setupClientListeners();
    
    logger.success('✅ WhatsApp Data Manager ready');
  }

  /**
   * Setup listeners for WhatsApp client events
   */
  setupClientListeners() {
    if (!this.whatsappClient) return;

    // When WhatsApp client becomes ready
    if (this.whatsappClient.on) {
      this.whatsappClient.on('ready', () => {
        logger.info('📱 WhatsApp client ready - triggering data sync');
        this.cache.isConnected = true;
        this.syncAllData();
        this.broadcastStatus();
      });

      this.whatsappClient.on('disconnected', () => {
        logger.warn('📱 WhatsApp client disconnected');
        this.cache.isConnected = false;
        this.broadcastStatus();
      });
    }
  }

  /**
   * 🔄 SYNC ALL WHATSAPP DATA
   * This is the main function that keeps everything up to date
   */
  async syncAllData() {
    if (this.syncStatus.isRunning) {
      logger.warn('⚠️ Sync already running, skipping...');
      return;
    }

    try {
      this.syncStatus.isRunning = true;
      this.syncStatus.errors = [];
      
      logger.info('🔄 STARTING COMPLETE WHATSAPP DATA SYNC...');

      // Parallel sync of all data types
      const syncPromises = [
        this.syncGroups(),
        this.syncContacts(), 
        this.syncRecentMessages(),
        this.syncSenders()
      ];

      await Promise.allSettled(syncPromises);

      this.cache.lastUpdate = new Date().toISOString();
      this.syncStatus.lastSync = new Date().toISOString();
      
      // Broadcast updates to all connected clients
      this.broadcastDataUpdate();
      
      logger.success('✅ Complete WhatsApp data sync finished');

    } catch (error) {
      logger.error('❌ Error in complete data sync:', error);
      this.syncStatus.errors.push(error.message);
    } finally {
      this.syncStatus.isRunning = false;
    }
  }

  /**
   * 👥 SYNC WHATSAPP GROUPS
   */
  async syncGroups() {
    try {
      if (!this.isWhatsAppReady()) {
        logger.warn('⚠️ WhatsApp not ready - loading from database');
        return await this.loadGroupsFromDatabase();
      }

      logger.info('👥 Syncing WhatsApp groups...');
      
      // Get fresh groups from WhatsApp client
      const chats = await this.whatsappClient.client.getChats();
      const groups = chats.filter(chat => chat.isGroup);

      // Transform to our format
      const freshGroups = groups.map(group => ({
        id: group.id._serialized,
        name: group.name,
        participantCount: group.participants?.length || 0,
        lastVerified: new Date().toISOString(),
        botInGroup: true,
        isActive: true,
        description: group.description || '',
        fromWhatsApp: true
      }));

      // Update cache
      this.cache.groups = freshGroups;
      
      // Sync with database in background
      this.syncGroupsToDatabase(freshGroups);

      logger.info(`✅ Synced ${freshGroups.length} WhatsApp groups`);
      return freshGroups;

    } catch (error) {
      logger.error('❌ Error syncing groups:', error);
      this.syncStatus.errors.push(`Groups sync: ${error.message}`);
      return await this.loadGroupsFromDatabase();
    }
  }

  /**
   * 📞 SYNC CONTACTS
   */
  async syncContacts() {
    try {
      if (!this.isWhatsAppReady()) return [];

      logger.info('📞 Syncing contacts...');
      
      const chats = await this.whatsappClient.client.getChats();
      const contacts = chats.map(chat => ({
        id: chat.id._serialized,
        name: chat.name,
        number: chat.id.user,
        isGroup: chat.isGroup,
        lastSeen: new Date().toISOString(),
        fromWhatsApp: true
      }));

      this.cache.contacts = contacts;
      logger.info(`✅ Synced ${contacts.length} contacts`);
      return contacts;

    } catch (error) {
      logger.error('❌ Error syncing contacts:', error);
      return [];
    }
  }

  /**
   * 📧 SYNC RECENT MESSAGES & SENDERS
   */
  async syncRecentMessages() {
    try {
      logger.info('📧 Syncing recent messages...');
      
      // Get recent messages from database
      const messages = await this.prisma.message.findMany({
        take: 100,
        orderBy: { timestamp: 'desc' },
        select: {
          id: true,
          fromNumber: true,
          fromName: true,
          chatId: true,
          chatName: true,
          body: true,
          timestamp: true,
          isGroup: true,
          sentiment: true,
          intent: true,
          isFlagged: true
        }
      });

      this.cache.messages = messages;

      // Extract unique senders
      const sendersMap = new Map();
      messages.forEach(msg => {
        if (!sendersMap.has(msg.fromNumber)) {
          sendersMap.set(msg.fromNumber, {
            number: msg.fromNumber,
            name: msg.fromName || msg.fromNumber,
            lastMessage: msg.timestamp,
            messageCount: 1,
            isGroup: msg.isGroup
          });
        } else {
          const sender = sendersMap.get(msg.fromNumber);
          sender.messageCount++;
          if (msg.timestamp > sender.lastMessage) {
            sender.lastMessage = msg.timestamp;
            sender.name = msg.fromName || sender.name;
          }
        }
      });

      this.cache.senders = Array.from(sendersMap.values());
      
      logger.info(`✅ Synced ${messages.length} messages, ${this.cache.senders.length} senders`);
      return { messages, senders: this.cache.senders };

    } catch (error) {
      logger.error('❌ Error syncing messages:', error);
      return { messages: [], senders: [] };
    }
  }

  /**
   * 📧 SYNC SENDERS FROM MESSAGES
   */
  async syncSenders() {
    // This is handled in syncRecentMessages()
    return this.cache.senders;
  }

  /**
   * 🗃️ LOAD GROUPS FROM DATABASE (Fallback)
   */
  async loadGroupsFromDatabase() {
    try {
      const dbGroups = await this.prisma.whatsAppGroup.findMany({
        where: { is_active: true },
        orderBy: { group_name: 'asc' }
      });

      const groups = dbGroups.map(group => ({
        id: group.group_id,
        name: group.group_name,
        participantCount: 0,
        lastVerified: group.updated_at,
        botInGroup: false,
        isActive: group.is_active,
        description: group.description || '',
        fromWhatsApp: false,
        fromDatabase: true
      }));

      this.cache.groups = groups;
      logger.info(`📁 Loaded ${groups.length} groups from database`);
      return groups;

    } catch (error) {
      logger.error('❌ Error loading groups from database:', error);
      return [];
    }
  }

  /**
   * 🗃️ SYNC GROUPS TO DATABASE (Background)
   */
  async syncGroupsToDatabase(groups) {
    try {
      for (const group of groups) {
        await this.prisma.whatsAppGroup.upsert({
          where: { group_id: group.id },
          update: {
            group_name: group.name,
            is_active: true,
            updated_at: new Date()
          },
          create: {
            group_id: group.id,
            group_name: group.name,
            department: 'UNASSIGNED',
            priority_level: 3,
            is_active: true,
            description: group.description
          }
        });
      }
      logger.info('✅ Groups synced to database');
    } catch (error) {
      logger.error('❌ Error syncing groups to database:', error);
    }
  }

  /**
   * 📨 HANDLE NEW INCOMING MESSAGE
   */
  async handleNewMessage(messageData) {
    try {
      // Add to cache
      this.cache.messages.unshift(messageData);
      
      // Keep only recent 100 messages in cache
      if (this.cache.messages.length > 100) {
        this.cache.messages = this.cache.messages.slice(0, 100);
      }

      // Update senders cache
      this.updateSenderInCache(messageData);
      
      // Broadcast new message to frontend
      this.broadcastNewMessage(messageData);
      
      logger.info(`📨 New message added to cache from ${messageData.fromName || messageData.fromNumber}`);

    } catch (error) {
      logger.error('❌ Error handling new message:', error);
    }
  }

  /**
   * 👤 UPDATE SENDER IN CACHE
   */
  updateSenderInCache(messageData) {
    const senderIndex = this.cache.senders.findIndex(s => s.number === messageData.fromNumber);
    
    if (senderIndex >= 0) {
      // Update existing sender
      this.cache.senders[senderIndex].messageCount++;
      this.cache.senders[senderIndex].lastMessage = messageData.timestamp;
      this.cache.senders[senderIndex].name = messageData.fromName || this.cache.senders[senderIndex].name;
    } else {
      // Add new sender
      this.cache.senders.push({
        number: messageData.fromNumber,
        name: messageData.fromName || messageData.fromNumber,
        lastMessage: messageData.timestamp,
        messageCount: 1,
        isGroup: messageData.isGroup
      });
    }
  }

  /**
   * 🔄 START BACKGROUND SYNC PROCESSES
   */
  startBackgroundSync() {
    // Sync groups every 5 minutes
    this.intervals.groups = setInterval(() => {
      if (this.isWhatsAppReady()) {
        this.syncGroups();
      }
    }, 5 * 60 * 1000);

    // Sync contacts every 10 minutes
    this.intervals.contacts = setInterval(() => {
      if (this.isWhatsAppReady()) {
        this.syncContacts();
      }
    }, 10 * 60 * 1000);

    // Sync recent messages every 2 minutes
    this.intervals.messages = setInterval(() => {
      this.syncRecentMessages();
    }, 2 * 60 * 1000);

    logger.info('🔄 Background sync processes started');
  }

  /**
   * 🛑 STOP BACKGROUND SYNC
   */
  stopBackgroundSync() {
    Object.values(this.intervals).forEach(interval => {
      if (interval) clearInterval(interval);
    });
    logger.info('🛑 Background sync processes stopped');
  }

  /**
   * 📡 BROADCAST DATA UPDATE TO FRONTEND
   */
  broadcastDataUpdate() {
    if (!this.io) return;

    const update = {
      type: 'whatsapp_data_update',
      data: {
        groups: this.cache.groups,
        senders: this.cache.senders,
        messages: this.cache.messages.slice(0, 20), // Send only recent 20 for performance
        groupCount: this.cache.groups.length,
        senderCount: this.cache.senders.length,
        messageCount: this.cache.messages.length,
        lastUpdate: this.cache.lastUpdate,
        isConnected: this.cache.isConnected
      },
      timestamp: new Date().toISOString()
    };

    this.io.emit('whatsapp_data_update', update);
    logger.info('📡 Data update broadcasted to frontend');
  }

  /**
   * 📡 BROADCAST NEW MESSAGE
   */
  broadcastNewMessage(messageData) {
    if (!this.io) return;

    this.io.emit('new_message', {
      type: 'new_message',
      message: messageData,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 📡 BROADCAST STATUS UPDATE
   */
  broadcastStatus() {
    if (!this.io) return;

    this.io.emit('whatsapp_status_update', {
      isConnected: this.cache.isConnected,
      syncStatus: this.syncStatus,
      dataStats: {
        groups: this.cache.groups.length,
        senders: this.cache.senders.length,
        messages: this.cache.messages.length
      },
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 🗑️ CLEAR ALL CACHED DATA
   */
  clearCache() {
    this.cache = {
      groups: [],
      contacts: [],
      chats: [],
      messages: [],
      senders: [],
      lastUpdate: null,
      isConnected: false
    };
    
    logger.info('🗑️ Data cache cleared');
    this.broadcastDataUpdate();
  }

  /**
   * ✅ CHECK IF WHATSAPP IS READY
   */
  isWhatsAppReady() {
    return this.whatsappClient && 
           this.whatsappClient.isReady && 
           this.whatsappClient.client;
  }

  /**
   * 📊 GET CACHED DATA
   */
  getCachedGroups() {
    return this.cache.groups;
  }

  getCachedSenders() {
    return this.cache.senders;
  }

  getCachedMessages() {
    return this.cache.messages;
  }

  getCachedContacts() {
    return this.cache.contacts;
  }

  getDataStats() {
    return {
      groups: this.cache.groups.length,
      senders: this.cache.senders.length,
      messages: this.cache.messages.length,
      contacts: this.cache.contacts.length,
      lastUpdate: this.cache.lastUpdate,
      isConnected: this.cache.isConnected,
      syncStatus: this.syncStatus
    };
  }

  /**
   * 🔄 FORCE REFRESH ALL DATA
   */
  async forceRefresh() {
    logger.info('🔄 Force refresh requested');
    await this.syncAllData();
    return this.getDataStats();
  }

  /**
   * 💾 CLEANUP ON SHUTDOWN
   */
  async shutdown() {
    this.stopBackgroundSync();
    await this.prisma.$disconnect();
    logger.info('🛑 WhatsApp Data Manager shutdown complete');
  }
}

// Export singleton instance
const dataManager = new WhatsAppDataManager();

module.exports = dataManager;