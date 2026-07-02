import path from 'node:path';
import dotenv from 'dotenv';
import { spawnSync } from 'node:child_process';
import { ensureTestDatabaseExists } from '../src/testing/test-database';

const cwd = process.cwd();
const envFile = path.resolve(cwd, '.env.test');

dotenv.config({ path: envFile });

process.env.DOTENV_CONFIG_PATH = envFile;
process.env.NODE_ENV = 'test';
process.env.ENABLE_TEST_SUPPORT ??= 'true';

function runStep(command: string, args: string[]): void {
  const result = spawnSync(command, args, {
    cwd,
    env: process.env,
    stdio: 'inherit',
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

async function main(): Promise<void> {
  await ensureTestDatabaseExists();

  runStep(path.resolve(cwd, 'node_modules/.bin/prisma'), ['migrate', 'deploy']);
  runStep(path.resolve(cwd, 'node_modules/.bin/prisma'), ['db', 'seed']);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
