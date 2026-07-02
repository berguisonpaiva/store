import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn, spawnSync } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '..');
const backendDir = path.join(workspaceRoot, 'apps', 'backend');
const webDir = path.join(workspaceRoot, 'apps', 'web');
const webDistDir = '.next-e2e';

const backendPort = Number(process.env.E2E_BACKEND_PORT ?? 4000);
const webPort = Number(process.env.E2E_WEB_PORT ?? 3000);
const backendUrl = `http://127.0.0.1:${backendPort}`;
const publicApiUrl = `http://localhost:${backendPort}`;
const webUrl = `http://127.0.0.1:${webPort}`;
const androidApiUrl = `http://10.0.2.2:${backendPort}`;
const iosApiUrl = publicApiUrl;

const childProcesses = [];

function parseArgs(argv) {
  const args = new Set(argv);
  return {
    withWeb: args.has('--web') || args.has('--with-web'),
    requireEmulator: args.has('--emulator') || args.has('--require-emulator'),
  };
}

function log(message) {
  process.stdout.write(`${message}\n`);
}

function getMobileApiUrl(platform = 'android') {
  return platform === 'ios' ? iosApiUrl : androidApiUrl;
}

function runSync(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd ?? workspaceRoot,
    env: { ...process.env, ...(options.env ?? {}) },
    stdio: 'inherit',
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function startProcess(label, command, args, options = {}) {
  const child = spawn(command, args, {
    cwd: options.cwd ?? workspaceRoot,
    env: { ...process.env, ...(options.env ?? {}) },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  child.stdout.on('data', (chunk) => {
    process.stdout.write(`[${label}] ${chunk}`);
  });
  child.stderr.on('data', (chunk) => {
    process.stderr.write(`[${label}] ${chunk}`);
  });
  child.on('exit', (code, signal) => {
    if (signal) {
      log(`[${label}] exited via signal ${signal}`);
      return;
    }
    if ((code ?? 0) !== 0) {
      log(`[${label}] exited with code ${code}`);
    }
  });

  childProcesses.push(child);
  return child;
}

async function waitForHttp(url, expectedStatus = 200, timeoutMs = 60_000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.status === expectedStatus) {
        return response;
      }
    } catch {}

    await delay(1_000);
  }

  throw new Error(`Timed out waiting for ${url}`);
}

async function ensureBackendDatabaseReady() {
  runSync('bun', ['run', 'db:start'], { cwd: backendDir });
  runSync('bun', ['run', 'test:prepare'], { cwd: backendDir });
}

async function startBackend() {
  startProcess('backend', 'bun', ['run', 'start'], {
    cwd: backendDir,
    env: {
      DOTENV_CONFIG_PATH: '.env.test',
      NODE_ENV: 'test',
      ENABLE_TEST_SUPPORT: 'true',
      PORT: String(backendPort),
      CORS_ORIGIN: `http://localhost:${webPort}`,
    },
  });

  await waitForHttp(`${backendUrl}/api/test/health`);
}

async function startWeb() {
  const webEnv = {
    PORT: String(webPort),
    NEXT_PUBLIC_API_URL: publicApiUrl,
    AUTH_TRUST_HOST: 'true',
    NEXT_DIST_DIR: webDistDir,
  };

  runSync('bun', ['run', 'build'], {
    cwd: webDir,
    env: webEnv,
  });

  startProcess(
    'web',
    'bun',
    ['run', 'start', '--', '--hostname', '127.0.0.1', '--port', String(webPort)],
    {
      cwd: webDir,
      env: webEnv,
    },
  );

  await waitForHttp(`${webUrl}/join`);
}

async function resetBackendState() {
  const response = await fetch(`${backendUrl}/api/test/reset`, {
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error(`Reset failed with ${response.status}`);
  }
}

function listBootedAndroidDevices() {
  const result = spawnSync('adb', ['devices'], {
    cwd: workspaceRoot,
    encoding: 'utf8',
  });

  if (result.status !== 0) {
    return [];
  }

  return result.stdout
    .split('\n')
    .slice(1)
    .map((line) => line.trim())
    .filter((line) => line.endsWith('\tdevice'))
    .map((line) => line.split('\t')[0])
    .filter(Boolean);
}

function assertAndroidConnectivity() {
  const devices = listBootedAndroidDevices();

  if (devices.length === 0) {
    throw new Error(
      'No Android emulator/device is booted. Start one first, e.g. `flutter emulators --launch Pixel_5_API_35`.',
    );
  }

  const target = devices[0];
  const check = spawnSync(
    'adb',
    ['-s', target, 'shell', 'toybox', 'nc', '-z', '10.0.2.2', String(backendPort)],
    { cwd: workspaceRoot },
  );

  if (check.status !== 0) {
    throw new Error(
      `Android emulator ${target} could not reach ${androidApiUrl}.`,
    );
  }

  return target;
}

async function smoke({ withWeb, requireEmulator }) {
  await ensureBackendDatabaseReady();
  await startBackend();
  await resetBackendState();

  if (withWeb) {
    await startWeb();
  }

  if (requireEmulator) {
    const device = assertAndroidConnectivity();
    log(`Android emulator connectivity OK via ${device} -> ${androidApiUrl}`);
  }

  log(`Backend ready at ${publicApiUrl}`);
  if (withWeb) {
    log(`Web ready at http://localhost:${webPort}`);
  }
  log(
    `Mobile API URLs: android=${getMobileApiUrl('android')} ios=${getMobileApiUrl('ios')}`,
  );
}

function cleanupAndExit(code = 0) {
  for (const child of childProcesses) {
    if (!child.killed) {
      child.kill('SIGINT');
    }
  }
  process.exit(code);
}

process.on('SIGINT', () => cleanupAndExit(0));
process.on('SIGTERM', () => cleanupAndExit(0));

async function main() {
  const [command = 'up', ...argv] = process.argv.slice(2);
  const options = parseArgs(argv);

  if (command === 'mobile-url') {
    const [platform = 'android'] = argv;
    if (platform !== 'android' && platform !== 'ios') {
      throw new Error('Unknown mobile platform. Use android or ios.');
    }

    process.stdout.write(getMobileApiUrl(platform));
    return;
  }

  if (command === 'reset') {
    await resetBackendState();
    log('Backend test state reset complete.');
    return;
  }

  if (command === 'smoke') {
    await smoke({ withWeb: true, requireEmulator: true });
    cleanupAndExit(0);
    return;
  }

  if (command !== 'up') {
    throw new Error(
      `Unknown command "${command}". Use up, reset, smoke, or mobile-url.`,
    );
  }

  await ensureBackendDatabaseReady();
  await startBackend();
  await resetBackendState();

  if (options.withWeb) {
    await startWeb();
  }

  if (options.requireEmulator) {
    const device = assertAndroidConnectivity();
    log(`Android emulator connectivity OK via ${device} -> ${androidApiUrl}`);
  }

  log(`Backend ready at ${publicApiUrl}`);
  if (options.withWeb) {
    log(`Web ready at http://localhost:${webPort}`);
  }
  log(
    `Mobile API URLs: android=${getMobileApiUrl('android')} ios=${getMobileApiUrl('ios')}`,
  );
  log('Press Ctrl+C to stop the stack.');

  await new Promise(() => {});
}

main().catch((error) => {
  console.error(error);
  cleanupAndExit(1);
});
