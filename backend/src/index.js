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

app.get('/api/messages', async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const messages = await prisma.message.findMany({
      orderBy: { timestamp: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset)
    });
    res.json(messages);
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

    res.json({ flaggedMessages, total });
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

  // Send current WhatsApp status to newly connected client
  socket.emit('whatsapp_status', whatsappClient.getStatus());

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