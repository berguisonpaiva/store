import { Client } from 'pg';
import type { PrismaClient } from '@prisma/client';

type TableRow = {
  tablename: string;
};

export function getTestDatabaseName(
  databaseUrl = process.env.DATABASE_URL,
): string {
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required for e2e tests.');
  }

  const url = new URL(databaseUrl);
  const databaseName = decodeURIComponent(url.pathname.replace(/^\//, ''));

  if (!databaseName) {
    throw new Error(
      `DATABASE_URL must include a database name: ${databaseUrl}`,
    );
  }

  return databaseName;
}

export function assertTestDatabaseUrl(
  databaseUrl = process.env.DATABASE_URL,
): string {
  const databaseName = getTestDatabaseName(databaseUrl);

  if (!databaseName.endsWith('_test')) {
    throw new Error(
      `Refusing to run e2e against "${databaseName}". The database name must end with "_test".`,
    );
  }

  return databaseName;
}

export async function ensureTestDatabaseExists(
  databaseUrl = process.env.DATABASE_URL,
): Promise<string> {
  const databaseName = assertTestDatabaseUrl(databaseUrl);
  const adminUrl = new URL(databaseUrl!);
  adminUrl.pathname = '/postgres';
  adminUrl.search = '';

  const client = new Client({ connectionString: adminUrl.toString() });

  try {
    await client.connect();
    const result = await client.query<{ exists: boolean }>(
      'SELECT EXISTS(SELECT 1 FROM pg_database WHERE datname = $1) AS "exists"',
      [databaseName],
    );

    if (!result.rows[0]?.exists) {
      const escapedName = databaseName.replace(/"/g, '""');
      await client.query(`CREATE DATABASE "${escapedName}"`);
    }
  } finally {
    await client.end();
  }

  return databaseName;
}

export async function truncateAll(
  prisma: PrismaClient,
  databaseUrl = process.env.DATABASE_URL,
): Promise<void> {
  assertTestDatabaseUrl(databaseUrl);

  const tables = await prisma.$queryRawUnsafe<TableRow[]>(`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename <> '_prisma_migrations'
  `);

  if (tables.length === 0) {
    return;
  }

  const tableList = tables
    .map(({ tablename }) => `"public"."${tablename.replace(/"/g, '""')}"`)
    .join(', ');

  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE ${tableList} RESTART IDENTITY CASCADE;`,
  );
}
