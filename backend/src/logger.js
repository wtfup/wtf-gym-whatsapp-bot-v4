const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

class Logger {
  constructor() {
    this.io = null;
  }

  setSocketIO(io) {
    this.io = io;
  }

  _formatMessage(level, message, emoji = '') {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] ${emoji} ${level}: ${message}`;
  }

  _log(level, message, color, emoji) {
    const formattedMessage = this._formatMessage(level, message, emoji);
    
    // Console output with color
    console.log(`${color}${formattedMessage}${colors.reset}`);
    
    // Send to frontend via Socket.IO
    if (this.io) {
      this.io.emit('log', {
        timestamp: new Date().toISOString(),
        level,
        message,
        emoji,
        formattedMessage
      });
    }
  }

  info(message) {
    this._log('INFO', message, colors.blue, 'ℹ️');
  }

  success(message) {
    this._log('SUCCESS', message, colors.green, '✅');
  }

  warning(message) {
    this._log('WARNING', message, colors.yellow, '⚠️');
  }

  error(message, error = null) {
    const fullMessage = error ? `${message} - ${error.message}` : message;
    this._log('ERROR', fullMessage, colors.red, '❌');
    if (error && error.stack) {
      console.error(colors.red + error.stack + colors.reset);
    }
  }

  whatsapp(message) {
    this._log('WHATSAPP', message, colors.green, '💬');
  }

  connection(message) {
    this._log('CONNECTION', message, colors.cyan, '🔗');
  }

  qr(message) {
    this._log('QR', message, colors.magenta, '📱');
  }

  auth(message) {
    this._log('AUTH', message, colors.yellow, '🔐');
  }

  socket(message) {
    this._log('SOCKET', message, colors.cyan, '⚡');
  }
}

// Export singleton instance
module.exports = new Logger(); 