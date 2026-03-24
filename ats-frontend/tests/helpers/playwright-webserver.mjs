import { copyFileSync, existsSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const frontendDir = path.resolve(__dirname, '../..');
const backendDir = path.resolve(__dirname, '../../../ats-backend');
const serverScript = path.resolve(backendDir, 'scripts/playwright-server.ts');
const tsNodeRegister = path.resolve(backendDir, 'node_modules/ts-node/register/transpile-only');
const devDatabasePath = path.resolve(backendDir, 'prisma/dev.db');
const databaseBackupPath = `/tmp/ats-resume-analyzer-dev-${process.pid}.db.bak`;

const backendPort = '4010';
const serverUrl = `http://127.0.0.1:${backendPort}`;
const require = createRequire(import.meta.url);

let databaseRestored = false;
let serverInstance = null;
let isShuttingDown = false;

const runCommand = (command, args, cwd, env = {}) => {
  const result = spawnSync(command, args, {
    cwd,
    env: {
      ...process.env,
      ...env,
    },
    stdio: 'inherit',
  });

  if (result.status !== 0) {
    throw new Error(`Command failed: ${command} ${args.join(' ')}`);
  }
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const waitForServer = async (url, timeoutMs = 30_000) => {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url, { redirect: 'manual' });
      if (response.status < 500) {
        return;
      }
    } catch (_error) {
      // Keep polling until the server is reachable or we time out.
    }

    await delay(500);
  }

  throw new Error(`Timed out waiting for ${url}`);
};

const restoreDatabaseBackup = () => {
  if (databaseRestored || !existsSync(databaseBackupPath)) {
    return;
  }

  databaseRestored = true;
  copyFileSync(databaseBackupPath, devDatabasePath);
  rmSync(databaseBackupPath, { force: true });
};

const shutdown = (signal = 'SIGTERM') => {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;

  if (serverInstance?.listening) {
    serverInstance.close(() => {
      restoreDatabaseBackup();
      process.exit(signal === 'SIGINT' ? 130 : 0);
    });
    return;
  }

  restoreDatabaseBackup();
  process.exit(signal === 'SIGINT' ? 130 : 0);
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('exit', restoreDatabaseBackup);

runCommand('npm', ['run', 'prisma:generate'], backendDir);
runCommand('npm', ['run', 'build'], frontendDir, {
  VITE_API_URL: `http://127.0.0.1:${backendPort}`,
});

if (!existsSync(databaseBackupPath)) {
  copyFileSync(devDatabasePath, databaseBackupPath);
}

runCommand('sqlite3', [devDatabasePath, 'DROP TABLE IF EXISTS "refresh_sessions";'], backendDir);
runCommand('npx', ['prisma', 'db', 'push', '--skip-generate'], backendDir);

console.log(`[WebServer] Starting combined server on port ${backendPort}`);
process.env.PORT = backendPort;
process.env.NODE_ENV = 'development';
process.env.TS_NODE_PROJECT = path.resolve(backendDir, 'tsconfig.json');

require(tsNodeRegister);

const { startPlaywrightServer } = require(serverScript);

serverInstance = startPlaywrightServer(Number(backendPort));

const serverExit = new Promise((resolve, reject) => {
  serverInstance.once('close', resolve);
  serverInstance.once('error', reject);
});

try {
  await waitForServer(serverUrl);
  console.log(`[WebServer] Combined server ready at ${serverUrl}`);
  await serverExit;
} finally {
  restoreDatabaseBackup();
}
