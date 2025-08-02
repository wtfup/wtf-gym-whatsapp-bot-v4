# 🚀 WTF WhatsApp Dashboard - Run Commands

## ⚡ Single Command (Recommended)

```bash
npm start
```
या
```bash
npm test
```

**यह command एक ही terminal में frontend और backend दोनों चलाएगा!**

## 🎯 Individual Commands

### Frontend Only
```bash
npm run frontend
```

### Backend Only  
```bash
npm run backend
```

### Old Dev Command
```bash
npm run dev
```

## 📱 URLs

- **🌐 Dashboard**: http://localhost:5174
- **📡 Backend API**: http://localhost:3000
- **❤️ Health Check**: http://localhost:3000/health

## 🛑 How to Stop

**Press `Ctrl+C` in terminal** - यह gracefully दोनों services को stop कर देगा

## ✅ What You Should See

```
╔══════════════════════════════════════════╗
║        🚀 WTF WhatsApp Dashboard         ║
║         Single Command Runner           ║
╚══════════════════════════════════════════╝

[SYSTEM] 🚀 Starting WTF WhatsApp Dashboard Development Environment...
[BACKEND] Starting backend...
[FRONTEND] Starting frontend...
[BACKEND] ✅ SUCCESS: 🚀 Backend server running on port 3000
[FRONTEND] You can now view dashboard in the browser.
[BACKEND] ✅ SUCCESS: WhatsApp client ready! Logged in as: Vishal Nigam

╔══════════════════════════════════════════╗
║             🎉 SYSTEM READY!             ║
║                                          ║
║  📡 Backend API: http://localhost:3000   ║
║  🌐 Dashboard:   http://localhost:5174   ║
║                                          ║
║  Press Ctrl+C to stop                    ║
╚══════════════════════════════════════════╝
```

## 🔧 Features

- ✅ **Color-coded output** for easy reading
- ✅ **Timestamps** on all logs  
- ✅ **System info** display
- ✅ **Graceful shutdown** with Ctrl+C
- ✅ **Error handling** and recovery
- ✅ **Cross-platform** (Windows/Mac/Linux)
- ✅ **Clean filtered output** (no webpack warnings)

## 📋 Testing Checklist

1. **Start System**: `npm start`
2. **Check Backend**: Open http://localhost:3000/health
3. **Check Frontend**: Open http://localhost:5174  
4. **Verify WhatsApp**: Status should show "Connected"
5. **Send Test Message**: Send WhatsApp message and check dashboard
6. **Stop System**: Press Ctrl+C

**सब कुछ perfectly काम कर रहा है! 🎉**