# 🚀 WTF WhatsApp Dashboard System

A real-time WhatsApp Message Intelligence System with a beautiful dashboard, built using `whatsapp-web.js`, React, and Socket.IO.

## ✨ Features

- 🔥 **Real-time WhatsApp Integration** using `whatsapp-web.js`
- 💬 **Live Message Stream** with WebSocket connections
- 📱 **QR Code Authentication** for WhatsApp Web
- 🎨 **Beautiful Modern UI** with Tailwind CSS and dark mode
- 📊 **Real-time Logs** displayed in browser console
- 💾 **Message Persistence** with Prisma ORM (SQLite local, PostgreSQL prod)
- 🚀 **Single Command Dev Setup** - no Docker needed locally
- ☁️ **Fly.io Production Ready** with persistent storage
- 📤 **Send Messages** directly from dashboard

## 🏗️ Architecture

```
wtf-whatsapp-dashboard/
├── backend/           # Node.js + Express + Socket.IO + WhatsApp
├── frontend/          # React + Vite + Tailwind CSS
├── shared/            # Shared types and utilities
├── start-dev.js       # Unified development starter
└── fly.prod.toml      # Fly.io deployment config
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- A WhatsApp account for QR authentication

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install all project dependencies
npm run install-all
```

### 2. Start Development Environment

```bash
# This starts both backend and frontend together
npm run dev
```

This will:
- Start backend server on `http://localhost:3000`
- Start frontend dev server on `http://localhost:5173`
- Set up real-time logging in both terminal and browser
- Initialize WhatsApp client and generate QR code

### 3. Connect WhatsApp

1. Open `http://localhost:5173` in your browser
2. Scan the QR code with your WhatsApp mobile app:
   - WhatsApp → Menu → Linked Devices → Link a Device
3. Once connected, you'll see real-time messages in the dashboard

## 📱 Usage

### Real-time Message Monitoring
- All incoming and outgoing WhatsApp messages appear instantly
- Messages show sender info, chat type (group/private), timestamps
- Full message history is stored in database

### Send Messages
- Click "Send Message" button in dashboard
- Enter phone number in format: `919876543210@c.us`
- Type message and send directly through the interface

### Live Logging
- Click "Logs" button to see real-time system logs
- All events (connections, messages, errors) are logged
- Download logs as text file for debugging

## ⚙️ Configuration

### Environment Files

**Backend** (`.env.local`):
```env
PORT=3000
SESSION_PATH=./storage/session
DATABASE_URL="file:./dev.db"
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

**Frontend** (`.env.local`):
```env
VITE_SOCKET_SERVER=http://localhost:3000
VITE_API_BASE_URL=http://localhost:3000
```

### Database

- **Local Development**: SQLite database (`dev.db`)
- **Production**: PostgreSQL on Fly.io
- **ORM**: Prisma with automatic migrations

## 🌐 Production Deployment

### Fly.io Setup

1. Install Fly CLI: `curl -L https://fly.io/install.sh | sh`

2. Login: `fly auth login`

3. Create App:
```bash
fly launch --config fly.prod.toml --no-deploy
```

4. Set Production Environment:
```bash
fly secrets set DATABASE_URL="postgresql://user:pass@host:5432/dbname"
fly secrets set SESSION_PATH="./storage/session"
fly secrets set NODE_ENV="production"
```

5. Create Persistent Volume:
```bash
fly volumes create whatsapp_sessions --region sin --size 1
```

6. Deploy:
```bash
fly deploy
```

### Production Environment Variables

Set these via `fly secrets set`:
```env
DATABASE_URL=postgresql://...
SESSION_PATH=./storage/session
NODE_ENV=production
CORS_ORIGIN=https://your-app.fly.dev
```

## 🔧 Development

### Project Structure

```
backend/src/
├── index.js          # Main Express server
├── whatsapp.js       # WhatsApp client logic
├── logger.js         # Unified logging system
└── prisma/           # Database schema

frontend/src/
├── App.jsx           # Main React component
├── hooks/            # Custom React hooks
└── components/       # UI components
```

### Available Scripts

```bash
# Development
npm run dev              # Start both frontend and backend

# Backend only
cd backend && npm run dev

# Frontend only  
cd frontend && npm run dev

# Database
cd backend && npm run db:push    # Apply schema changes
cd backend && npm run db:studio  # Open Prisma Studio
```

### Real-time Flow

1. **WhatsApp** → `whatsapp.js` (message event)
2. **Backend** → `Socket.IO` (emit to frontend)
3. **Frontend** → React state (real-time UI update)
4. **Database** → Prisma (message persistence)
5. **Logs** → Terminal + Browser console

## 🎨 UI Features

- **Dark/Light Mode**: Automatic based on system preference
- **Responsive Design**: Works on desktop, tablet, mobile
- **Real-time Updates**: Messages and logs update instantly
- **Beautiful Animations**: Smooth transitions and hover effects
- **Status Indicators**: Connection status, WhatsApp auth status
- **Message Filtering**: Group vs private message differentiation

## 🐛 Troubleshooting

### Common Issues

**1. WhatsApp Client Not Connecting**
- Check if QR code is displayed
- Ensure WhatsApp Web isn't already connected on another device
- Try refreshing QR code

**2. Messages Not Appearing**
- Check browser console for WebSocket connection
- Verify backend logs for message processing
- Ensure database is properly connected

**3. Development Server Issues**
- Make sure ports 3000 and 5173 are available
- Check if all dependencies are installed
- Verify environment files are present

### Debug Mode

Enable detailed logging:
```bash
DEBUG=* npm run dev
```

## 📊 Future Features

- 🤖 **AI Message Analysis** with sentiment detection
- 🔔 **Smart Notifications** for important messages
- 📈 **Analytics Dashboard** with message statistics
- 🔄 **Message Routing** to different handlers
- 🛡️ **Spam Detection** and filtering
- 📋 **Message Templates** for quick replies

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Submit a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

If you encounter any issues:

1. Check the troubleshooting section above
2. Review logs in browser and terminal
3. Create an issue with detailed error information
4. Include environment details and steps to reproduce

---

**Made with ❤️ for the WTF community**

*Real-time WhatsApp intelligence has never been this easy!* 