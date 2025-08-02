// AUTOMATIC ENVIRONMENT DETECTION SYSTEM
// This file automatically detects local vs production and sets all URLs accordingly

const isLocalEnvironment = () => {
  // Multiple ways to detect local environment
  const hostname = window.location.hostname;
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0';
  const isLocalPort = window.location.port === '3000';
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  return isLocalhost || isLocalPort || isDevelopment;
};

// AUTOMATIC CONFIGURATION
const environment = {
  isLocal: isLocalEnvironment(),
  
  // API Base URL
  get apiBaseUrl() {
    return this.isLocal ? 'http://localhost:3000' : 'https://wtf-whatsapp-bot.fly.dev';
  },
  
  // WebSocket URL  
  get websocketUrl() {
    return this.isLocal ? 'ws://localhost:3000' : 'wss://wtf-whatsapp-bot.fly.dev';
  },
  
  // Health Check URL
  get healthUrl() {
    return `${this.apiBaseUrl}/api/health`;
  },
  
  // WhatsApp QR URL
  get qrUrl() {
    return `${this.apiBaseUrl}/api/whatsapp/qr`;
  },
  
  // Messages API URL
  get messagesUrl() {
    return `${this.apiBaseUrl}/api/messages`;
  },
  
  // Flagged Messages API URL
  get flaggedMessagesUrl() {
    return `${this.apiBaseUrl}/api/flagged-messages`;
  },
  
  // Analytics API URL
  get analyticsUrl() {
    return `${this.apiBaseUrl}/api/analytics/overview`;
  },
  
  // WhatsApp Status URL
  get statusUrl() {
    return `${this.apiBaseUrl}/api/status`;
  }
};

// Debug logging
console.log('🔧 ENVIRONMENT DETECTED:', {
  isLocal: environment.isLocal,
  hostname: window.location.hostname,
  port: window.location.port,
  NODE_ENV: process.env.NODE_ENV,
  apiBaseUrl: environment.apiBaseUrl,
  websocketUrl: environment.websocketUrl
});

export default environment; 