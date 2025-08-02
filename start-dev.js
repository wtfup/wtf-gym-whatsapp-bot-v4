const { spawn } = require('child_process');
const path = require('path');

// Color codes for output
const colors = {
  backend: '\x1b[34m', // Blue
  frontend: '\x1b[32m', // Green
  reset: '\x1b[0m'
};

function startProcess(name, command, cwd, color) {
  console.log(`${color}[${name}] Starting...${colors.reset}`);
  
  const proc = spawn('npm', ['run', command], {
    cwd: path.join(__dirname, cwd),
    stdio: 'pipe',
    shell: true
  });

  proc.stdout.on('data', (data) => {
    const output = data.toString().trim();
    if (output) {
      console.log(`${color}[${name}]${colors.reset} ${output}`);
    }
  });

  proc.stderr.on('data', (data) => {
    const output = data.toString().trim();
    if (output) {
      console.log(`${color}[${name}]${colors.reset} ⚠️  ${output}`);
    }
  });

  proc.on('close', (code) => {
    console.log(`${color}[${name}]${colors.reset} Process exited with code ${code}`);
  });

  return proc;
}

console.log('🚀 Starting WTF WhatsApp Dashboard Development Environment...\n');

// Start backend and frontend
    const backend = startProcess('BACKEND', 'dev', 'backend', colors.backend);
    const frontend = startProcess('FRONTEND', 'start', 'frontend', colors.frontend);

// Handle process cleanup
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down development environment...');
  backend.kill();
  frontend.kill();
  process.exit(0);
});

process.on('SIGTERM', () => {
  backend.kill();
  frontend.kill();
  process.exit(0);
}); 