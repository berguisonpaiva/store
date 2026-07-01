import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import * as bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

type SeedTask = (prisma: PrismaClient) => Promise<void>;

/// Creates an initial active MASTER user so the API is usable on first run.
/// Idempotent: skips if the email already exists.
const seedMaster: SeedTask = async (prisma) => {
  const email = (process.env.SEED_MASTER_EMAIL ?? 'master@store.local')
    .trim()
    .toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`[seed] MASTER already exists: ${email}`);
    return;
  }

  const hash = await bcrypt.hash(
    process.env.SEED_MASTER_PASSWORD ?? 'Master!123',
    10,
  );

  await prisma.user.create({
    data: {
      id: randomUUID(),
      name: process.env.SEED_MASTER_NAME ?? 'Master Admin',
      email,
      role: 'MASTER',
      active: true,
      password: { create: { hash } },
    },
  });

  console.log(`[seed] created MASTER: ${email}`);
};

const seedTasks: SeedTask[] = [seedMaster];

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL ?? '',
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required to run prisma/seed/main.ts');
  }

  for (const task of seedTasks) {
    await task(prisma);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
