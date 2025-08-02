# 🚀 WTF WhatsApp Dashboard v4

![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green)
![React](https://img.shields.io/badge/React-v19.1.0-blue)
![WhatsApp](https://img.shields.io/badge/WhatsApp-Web.js-25D366)
![AI](https://img.shields.io/badge/AI-Together%20AI-orange)

**Real-time WhatsApp Message Intelligence System with AI-powered Analysis**

## ✨ Key Features

### 🤖 **AI-Powered Intelligence**
- **Sentiment Analysis**: Automatic detection of positive/negative/neutral sentiment
- **Intent Classification**: Categorizes messages (complaint/question/booking/general)
- **Entity Extraction**: Identifies equipment, facilities, and staff mentions
- **Auto-Flagging**: Critical message detection with confidence scoring
- **Together AI Integration**: Powered by Qwen/Qwen2.5-7B-Instruct-Turbo

### 📱 **Real-time Dashboard**
- **Material-UI Design**: Modern, responsive interface
- **Live Message Feed**: Real-time WhatsApp message monitoring
- **Socket.IO Integration**: Instant updates without page refresh
- **Analytics Dashboard**: Message trends, sentiment distribution, flagged analytics
- **QR Code Integration**: Built-in WhatsApp authentication

### 🔧 **Technical Excellence**
- **Single Command Setup**: `npm start` runs everything
- **Persistent Sessions**: WhatsApp LocalAuth for permanent connection
- **Database Flexibility**: SQLite (local) + PostgreSQL (production ready)
- **Microservices Architecture**: Loosely coupled frontend/backend
- **Production Ready**: Fly.io deployment configuration included

## 🚀 Quick Start

### Prerequisites
- Node.js v18+ 
- npm or yarn
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/wtfup/wtf-gym-whatsapp-bot-v4.git
cd wtf-gym-whatsapp-bot-v4

# Install all dependencies
npm run install-all

# Start the system (backend + frontend)
npm start
```

### 🎯 Access Points
- **🌐 Dashboard**: http://localhost:5174
- **📡 Backend API**: http://localhost:3000
- **❤️ Health Check**: http://localhost:3000/health

## 📦 Architecture

### Backend (Node.js + Express)
```
backend/
├── src/
│   ├── index.js              # Main server
│   ├── whatsapp.js          # WhatsApp client
│   ├── ai-analysis-engine.js # AI processing
│   ├── logger.js            # Centralized logging
│   └── prisma/
│       └── schema.prisma    # Database schema
├── package.json
└── .env.local               # Environment config
```

### Frontend (React + Material-UI)
```
frontend/
├── src/
│   ├── App.js               # Main dashboard
│   ├── components/          # UI components
│   ├── config/
│   │   └── environment.js   # Auto environment detection
│   └── utils/
├── package.json
└── .env.development         # Frontend config
```

## 🔧 Available Commands

| Command | Description |
|---------|-------------|
| `npm start` | **🚀 Single command** - Starts both backend & frontend |
| `npm test` | Same as `npm start` |
| `npm run dev` | Development mode with detailed logs |
| `npm run backend` | Backend only |
| `npm run frontend` | Frontend only |
| `npm run install-all` | Install all dependencies |

## 📊 Features in Detail

### AI Analysis Engine
- **Sentiment Detection**: Positive, Negative, Neutral classification
- **Intent Recognition**: Complaint, Question, Booking, General
- **Entity Extraction**: Equipment, Facilities, Staff mentions
- **Confidence Scoring**: AI analysis reliability measurement
- **Auto-Flagging**: Smart detection of critical messages

### Real-time Dashboard
- **Live Message Feed**: Instant WhatsApp message display
- **Analytics Overview**: Message trends and statistics
- **Flagged Messages**: Priority-based message management
- **QR Authentication**: Built-in WhatsApp connection
- **System Status**: Real-time connection monitoring

### Database Schema
```sql
-- Core message storage with AI analysis
Message {
  id, messageId, fromNumber, fromName, toNumber
  chatId, chatName, body, timestamp
  sentiment, intent, entities, confidence
  isFlagged, flagReason, flaggedAt
  hasMedia, mediaUrl, mediaType
}

-- Flagged message management
FlaggedMessage {
  id, messageId, flagReason, category
  priority, status, resolvedBy, resolvedAt
}

-- Automated routing configuration
RoutingRule {
  id, category, targetGroupId, conditions
}
```

## 🌐 Production Deployment

### Fly.io Ready
```bash
# Deploy to production
fly deploy

# Set environment variables
fly secrets set TOGETHER_API_KEY=your_api_key
fly secrets set DATABASE_URL=your_postgres_url
```

### Environment Variables
```bash
# Backend (.env.local)
PORT=3000
SESSION_PATH=./storage/session
DATABASE_URL="file:./dev.db"
CORS_ORIGIN=http://localhost:5174
TOGETHER_API_KEY=your_api_key

# Frontend (.env.development)
REACT_APP_API_URL=http://localhost:3000
REACT_APP_WEBSOCKET_URL=ws://localhost:3000
PORT=5174
```

## 🔍 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | System health check |
| `/api/status` | GET | WhatsApp connection status |
| `/api/messages` | GET | Retrieve messages with filters |
| `/api/flagged-messages` | GET | Get flagged messages |
| `/api/analytics/overview` | GET | Analytics dashboard data |
| `/api/whatsapp/qr` | GET | QR code for authentication |
| `/api/send-message` | POST | Send WhatsApp message |

## 🛠️ Tech Stack

### Backend
- **Node.js + Express**: Web server
- **whatsapp-web.js**: WhatsApp Web API
- **Socket.IO**: Real-time communication
- **Prisma ORM**: Database management
- **SQLite/PostgreSQL**: Data storage
- **Together AI**: AI analysis engine

### Frontend  
- **React 19**: UI framework
- **Material-UI**: Component library
- **Socket.IO Client**: Real-time updates
- **Create React App**: Build system
- **Axios**: HTTP client

### DevOps
- **Fly.io**: Production deployment
- **Git**: Version control
- **npm**: Package management
- **nodemon**: Development hot reload

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **whatsapp-web.js** - WhatsApp Web API wrapper
- **Together AI** - AI analysis capabilities
- **Material-UI** - Beautiful React components
- **Fly.io** - Production hosting platform

## 📞 Support

- 🐛 **Bug Reports**: [Issues](https://github.com/wtfup/wtf-gym-whatsapp-bot-v4/issues)
- 💡 **Feature Requests**: [Issues](https://github.com/wtfup/wtf-gym-whatsapp-bot-v4/issues)
- 📧 **Contact**: Create an issue for support

---

**Built with ❤️ for modern WhatsApp business automation**

[![Deploy on Fly.io](https://img.shields.io/badge/Deploy-Fly.io-purple)](https://fly.io/apps/new?image=wtf-whatsapp-dashboard)
[![Star on GitHub](https://img.shields.io/github/stars/wtfup/wtf-gym-whatsapp-bot-v4?style=social)](https://github.com/wtfup/wtf-gym-whatsapp-bot-v4)