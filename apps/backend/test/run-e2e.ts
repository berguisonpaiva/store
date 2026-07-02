import { spawnSync } from 'node:child_process';
import path from 'node:path';
import dotenv from 'dotenv';
import { ensureTestDatabaseExists } from './utils/db';

const cwd = process.cwd();
const envFile = path.resolve(cwd, '.env.test');

dotenv.config({ path: envFile });

process.env.DOTENV_CONFIG_PATH = envFile;
process.env.NODE_ENV = 'test';

function normalizeArgs(args: string[]): string[] {
  const normalized: string[] = [];

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '--testPathPattern') {
      normalized.push('--testPathPatterns', args[index + 1] ?? '');
      index += 1;
      continue;
    }

    if (arg.startsWith('--testPathPattern=')) {
      normalized.push(arg.replace('--testPathPattern=', '--testPathPatterns='));
      continue;
    }

    normalized.push(arg);
  }

  return normalized;
}

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
  runStep(path.resolve(cwd, 'node_modules/.bin/jest'), [
    '--config',
    './test/jest-e2e.json',
    ...normalizeArgs(process.argv.slice(2)),
  ]);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
