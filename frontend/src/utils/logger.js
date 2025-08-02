/**
 * Global Frontend Logging System
 * 
 * This utility provides centralized logging for the React dashboard,
 * sending all logs to the backend for real-time observability.
 */

// Import LiveConsole integration
import { addLogEntry } from '../components/LiveConsole';

// Log levels
export const LOG_LEVELS = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error'
};

// Default configuration
const DEFAULT_CONFIG = {
  endpoint: '/api/frontend-log',
  batchSize: 10,
  flushInterval: 5000, // 5 seconds
  maxRetries: 3,
  retryDelay: 1000,
  enabled: true
};

// Log queue for batching
let logQueue = [];
let flushTimer = null;
let isFlushing = false;

/**
 * Send logs to backend with retry logic
 */
const sendLogToBackend = async (logData, retryCount = 0) => {
  try {
    const response = await fetch(DEFAULT_CONFIG.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...logData,
        timestamp: logData.timestamp || new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.warn(`[LOGGER] Failed to send log to backend (attempt ${retryCount + 1}):`, error.message);
    
    if (retryCount < DEFAULT_CONFIG.maxRetries) {
      // Exponential backoff
      const delay = DEFAULT_CONFIG.retryDelay * Math.pow(2, retryCount);
      await new Promise(resolve => setTimeout(resolve, delay));
      return sendLogToBackend(logData, retryCount + 1);
    }
    
    // Final fallback - log to console
    console.error('[LOGGER] Failed to send log after all retries:', logData);
    return null;
  }
};

/**
 * Flush queued logs to backend
 */
const flushLogQueue = async () => {
  if (isFlushing || logQueue.length === 0) return;
  
  isFlushing = true;
  
  try {
    const logsToSend = logQueue.splice(0, DEFAULT_CONFIG.batchSize);
    
    // Send each log individually for better error handling
    for (const logData of logsToSend) {
      await sendLogToBackend(logData);
    }
  } catch (error) {
    console.error('[LOGGER] Error flushing log queue:', error);
  } finally {
    isFlushing = false;
    
    // If there are more logs in the queue, schedule another flush
    if (logQueue.length > 0) {
      flushTimer = setTimeout(flushLogQueue, DEFAULT_CONFIG.flushInterval);
    }
  }
};

/**
 * Schedule log queue flush
 */
const scheduleFlush = () => {
  if (flushTimer) {
    clearTimeout(flushTimer);
  }
  
  flushTimer = setTimeout(flushLogQueue, DEFAULT_CONFIG.flushInterval);
};

/**
 * Main logging function
 */
export const logFrontend = ({ 
  level = 'info', 
  source = 'dashboard', 
  message, 
  data = {},
  immediate = false 
}) => {
  if (!DEFAULT_CONFIG.enabled || !message) return;
  
  const logData = {
    level,
    source,
    message,
    data,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href,
    sessionId: getSessionId()
  };
  
  // Always log to console for immediate visibility
  const consoleMethod = level === 'error' ? 'error' : 
                       level === 'warn' ? 'warn' : 
                       level === 'debug' ? 'debug' : 'log';
  
  console[consoleMethod](`[${source.toUpperCase()}] ${message}`, data);
  
  // Add to LiveConsole for visual debugging
  addLogEntry({ level, source, message, data });
  
  // Send to backend
  if (immediate) {
    // Send immediately for critical logs
    sendLogToBackend(logData);
  } else {
    // Queue for batching
    logQueue.push(logData);
    
    // Flush immediately if queue is full
    if (logQueue.length >= DEFAULT_CONFIG.batchSize) {
      flushLogQueue();
    } else {
      scheduleFlush();
    }
  }
};

/**
 * Convenience methods for different log levels
 */
export const logDebug = (source, message, data = {}) => 
  logFrontend({ level: 'debug', source, message, data });

export const logInfo = (source, message, data = {}) => 
  logFrontend({ level: 'info', source, message, data });

export const logWarn = (source, message, data = {}) => 
  logFrontend({ level: 'warn', source, message, data });

export const logError = (source, message, data = {}) => 
  logFrontend({ level: 'error', source, message, data, immediate: true });

/**
 * Generate session ID for tracking
 */
const getSessionId = () => {
  if (!window.sessionStorage.getItem('logger_session_id')) {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    window.sessionStorage.setItem('logger_session_id', sessionId);
  }
  return window.sessionStorage.getItem('logger_session_id');
};

/**
 * Configure logger settings
 */
export const configureLogger = (config = {}) => {
  Object.assign(DEFAULT_CONFIG, config);
};

/**
 * Enable/disable logging
 */
export const setLoggerEnabled = (enabled) => {
  DEFAULT_CONFIG.enabled = enabled;
};

/**
 * Force flush all queued logs
 */
export const flushAllLogs = () => {
  if (flushTimer) {
    clearTimeout(flushTimer);
  }
  return flushLogQueue();
};

/**
 * Get current queue status
 */
export const getLoggerStatus = () => ({
  queueLength: logQueue.length,
  isFlushing,
  enabled: DEFAULT_CONFIG.enabled,
  config: { ...DEFAULT_CONFIG }
});

// Auto-flush on page unload
window.addEventListener('beforeunload', () => {
  flushAllLogs();
});

// Export default for convenience
export default logFrontend; 