const { spawn } = require('child_process');
const path = require('path');
const http = require('http');

const API_PORT = 8000;
const HEALTH_CHECK_INTERVAL = 500;
const MAX_HEALTH_CHECKS = 60; // 30 seconds max wait

let pythonProcess = null;

/**
 * Check if the backend is healthy
 */
function checkHealth() {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${API_PORT}/health`, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

/**
 * Wait for backend to be ready
 */
async function waitForBackend() {
  for (let i = 0; i < MAX_HEALTH_CHECKS; i++) {
    if (await checkHealth()) {
      return true;
    }
    await new Promise(r => setTimeout(r, HEALTH_CHECK_INTERVAL));
  }
  return false;
}

/**
 * Start the Python FastAPI backend
 */
async function startPythonBackend() {
  // Check if already running
  if (await checkHealth()) {
    console.log('Backend already running');
    return null;
  }

  const projectRoot = path.join(__dirname, '..');

  // Determine Python executable
  const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';

  // Start uvicorn
  pythonProcess = spawn(pythonCmd, [
    '-m', 'uvicorn',
    'src.api.main:app',
    '--host', '127.0.0.1',
    '--port', String(API_PORT),
    '--log-level', 'info'
  ], {
    cwd: projectRoot,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: {
      ...process.env,
      PYTHONUNBUFFERED: '1'
    }
  });

  // Log output
  pythonProcess.stdout.on('data', (data) => {
    console.log(`[Backend] ${data.toString().trim()}`);
  });

  pythonProcess.stderr.on('data', (data) => {
    console.error(`[Backend] ${data.toString().trim()}`);
  });

  pythonProcess.on('error', (error) => {
    console.error('Failed to start Python backend:', error);
  });

  pythonProcess.on('exit', (code) => {
    console.log(`Python backend exited with code ${code}`);
    pythonProcess = null;
  });

  // Wait for backend to be ready
  const ready = await waitForBackend();
  if (!ready) {
    throw new Error('Backend failed to start within timeout');
  }

  return pythonProcess;
}

/**
 * Stop the Python backend
 */
function stopPythonBackend(process) {
  if (process) {
    console.log('Stopping Python backend...');

    if (process.platform === 'win32') {
      spawn('taskkill', ['/pid', process.pid, '/f', '/t']);
    } else {
      process.kill('SIGTERM');

      // Force kill after 5 seconds
      setTimeout(() => {
        if (process && !process.killed) {
          process.kill('SIGKILL');
        }
      }, 5000);
    }
  }
}

module.exports = {
  startPythonBackend,
  stopPythonBackend,
  checkHealth
};
