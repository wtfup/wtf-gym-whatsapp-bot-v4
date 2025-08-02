// Shared types and constants for WhatsApp Dashboard System

// Message Types
export const MESSAGE_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  VIDEO: 'video',
  AUDIO: 'audio',
  DOCUMENT: 'document',
  STICKER: 'sticker',
  LOCATION: 'location',
  CONTACT: 'contact',
  UNKNOWN: 'unknown'
};

// Log Levels
export const LOG_LEVELS = {
  INFO: 'INFO',
  SUCCESS: 'SUCCESS',
  WARNING: 'WARNING',
  ERROR: 'ERROR',
  WHATSAPP: 'WHATSAPP',
  CONNECTION: 'CONNECTION',
  QR: 'QR',
  AUTH: 'AUTH',
  SOCKET: 'SOCKET'
};

// WhatsApp Status Types
export const WHATSAPP_STATUS = {
  INITIALIZING: 'initializing',
  QR_REQUIRED: 'qr_required',
  AUTHENTICATING: 'authenticating',
  READY: 'ready',
  DISCONNECTED: 'disconnected',
  ERROR: 'error'
};

// Socket Events
export const SOCKET_EVENTS = {
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  
  // WhatsApp Events
  WHATSAPP_STATUS: 'whatsapp_status',
  QR: 'qr',
  AUTHENTICATED: 'authenticated',
  READY: 'ready',
  DISCONNECTED: 'disconnected',
  AUTH_FAILURE: 'auth_failure',
  LOADING: 'loading',
  
  // Message Events
  MESSAGE: 'message',
  MESSAGE_CREATE: 'message_create',
  
  // Log Events
  LOG: 'log',
  
  // Client Requests
  REQUEST_QR: 'request_qr',
  SEND_MESSAGE: 'send_message'
};

// API Endpoints
export const API_ENDPOINTS = {
  HEALTH: '/health',
  STATUS: '/api/status',
  MESSAGES: '/api/messages',
  CHATS: '/api/chats',
  SEND_MESSAGE: '/api/send-message'
};

// Default Configuration
export const DEFAULT_CONFIG = {
  BACKEND_PORT: 3000,
  FRONTEND_PORT: 5173,
  MAX_MESSAGES_DISPLAY: 100,
  MAX_LOGS_DISPLAY: 200,
  MESSAGE_SYNC_LIMIT: 50,
  CHAT_SYNC_LIMIT: 20
};

// Utility Functions
export const formatPhoneNumber = (number) => {
  // Ensure number has @c.us suffix for WhatsApp
  if (!number.includes('@')) {
    return `${number}@c.us`;
  }
  return number;
};

export const isValidPhoneNumber = (number) => {
  // Basic validation for WhatsApp phone numbers
  const phoneRegex = /^\d{10,15}(@c\.us)?$/;
  return phoneRegex.test(number);
};

export const getMessageDirection = (message) => {
  return message.isFromMe ? 'outgoing' : 'incoming';
};

export const formatTimestamp = (timestamp) => {
  return new Date(timestamp).toLocaleString();
};

// Error Types
export const ERROR_TYPES = {
  WHATSAPP_CONNECTION: 'whatsapp_connection_error',
  WHATSAPP_AUTH: 'whatsapp_auth_error',
  DATABASE: 'database_error',
  SOCKET: 'socket_error',
  MESSAGE_SEND: 'message_send_error',
  VALIDATION: 'validation_error'
};

// Success Messages
export const SUCCESS_MESSAGES = {
  WHATSAPP_CONNECTED: 'WhatsApp connected successfully',
  MESSAGE_SENT: 'Message sent successfully',
  DATABASE_CONNECTED: 'Database connected successfully',
  SERVER_STARTED: 'Server started successfully'
};

export default {
  MESSAGE_TYPES,
  LOG_LEVELS,
  WHATSAPP_STATUS,
  SOCKET_EVENTS,
  API_ENDPOINTS,
  DEFAULT_CONFIG,
  ERROR_TYPES,
  SUCCESS_MESSAGES,
  formatPhoneNumber,
  isValidPhoneNumber,
  getMessageDirection,
  formatTimestamp
}; 