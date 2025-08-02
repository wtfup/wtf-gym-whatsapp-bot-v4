#!/usr/bin/env node

/**
 * 🚀 WTF WhatsApp Dashboard - Single Command Runner
 * 
 * This script starts both backend and frontend in one terminal
 * Perfect for development and testing
 */

const { spawn } = require('child_process');
const path = require('path');
const os = require('os');

// Colors for terminal output
const colors = {
  backend: '\x1b[34m',    // Blue
  frontend: '\x1b[32m',   // Green
  system: '\x1b[35m',     // Magenta
  success: '\x1b[92m',    // Bright Green
  error: '\x1b[91m',      // Bright Red
  reset: '\x1b[0m'
};

// System info
const isWindows = os.platform() === 'win32';
const shell = isWindows ? 'powershell.exe' : 'bash';

function log(prefix, message, color = colors.system) {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`${color}[${timestamp}] [${prefix}]${colors.reset} ${message}`);
}

function startProcess(name, command, cwd, color) {
  log(name, `Starting ${name.toLowerCase()}...`, color);
  
  const proc = spawn('npm', ['run', command], {
    cwd: path.join(__dirname, cwd),
    stdio: 'pipe',
    shell: true
  });

  proc.stdout.on('data', (data) => {
    const output = data.toString().trim();
    if (output) {
      // Filter out verbose webpack warnings for cleaner output
      if (!output.includes('WARNING in') && !output.includes('no-unused-vars')) {
        console.log(`${color}[${name}]${colors.reset} ${output}`);
      }
    }
  });

  proc.stderr.on('data', (data) => {
    const output = data.toString().trim();
    if (output && !output.includes('DeprecationWarning')) {
      console.log(`${color}[${name}]${colors.reset} ⚠️  ${output}`);
    }
  });

  proc.on('close', (code) => {
    if (code === 0) {
      log(name, `Process exited successfully`, colors.success);
    } else {
      log(name, `Process exited with code ${code}`, colors.error);
    }
  });

  proc.on('error', (error) => {
    log(name, `Process error: ${error.message}`, colors.error);
  });

  return proc;
}

// Banner
console.log(`
${colors.success}╔══════════════════════════════════════════╗
║        🚀 WTF WhatsApp Dashboard         ║
║         Single Command Runner           ║
╚══════════════════════════════════════════╝${colors.reset}
`);

log('SYSTEM', '🚀 Starting WTF WhatsApp Dashboard Development Environment...', colors.system);
log('SYSTEM', `💻 Platform: ${os.platform()} ${os.arch()}`, colors.system);
log('SYSTEM', `🔧 Node.js: ${process.version}`, colors.system);
log('SYSTEM', '📡 Backend: http://localhost:3000', colors.system);
log('SYSTEM', '🌐 Frontend: http://localhost:5174', colors.system);
console.log();

// Start both processes
const backend = startProcess('BACKEND', 'dev', 'backend', colors.backend);
const frontend = startProcess('FRONTEND', 'start', 'frontend', colors.frontend);

// Handle graceful shutdown
function gracefulShutdown() {
  log('SYSTEM', '🛑 Shutting down development environment...', colors.error);
  
  backend.kill('SIGTERM');
  frontend.kill('SIGTERM');
  
  setTimeout(() => {
    backend.kill('SIGKILL');
    frontend.kill('SIGKILL');
    process.exit(0);
  }, 5000);
}

// Handle different shutdown signals
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
process.on('SIGHUP', gracefulShutdown);

// Handle Windows Ctrl+C
if (isWindows) {
  require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  }).on('SIGINT', gracefulShutdown);
}

// Success message after 10 seconds
setTimeout(() => {
  console.log(`
${colors.success}╔══════════════════════════════════════════╗
║             🎉 SYSTEM READY!             ║
║                                          ║
║  📡 Backend API: http://localhost:3000   ║
║  🌐 Dashboard:   http://localhost:5174   ║
║                                          ║
║  Press Ctrl+C to stop                    ║
╚══════════════════════════════════════════╝${colors.reset}
`);
}, 10000);