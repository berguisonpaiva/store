import { randomUUID } from 'node:crypto';
import * as bcrypt from 'bcrypt';
import type { PrismaClient } from '@prisma/client';

export type SeedTask = (prisma: PrismaClient) => Promise<void>;

/// Creates an initial active ADMIN user so the API is usable on first run.
/// Idempotent: if the email already exists, ensures it is an active ADMIN.
export const seedAdmin: SeedTask = async (prisma) => {
  const email = (process.env.SEED_ADMIN_EMAIL ?? 'admin@store.local')
    .trim()
    .toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    if (existing.role !== 'ADMIN' || !existing.active) {
      await prisma.user.update({
        where: { id: existing.id },
        data: { role: 'ADMIN', active: true },
      });
      console.log(`[seed] ADMIN reconciled: ${email}`);
      return;
    }
    console.log(`[seed] ADMIN already exists: ${email}`);
    return;
  }

  const hash = await bcrypt.hash(
    process.env.SEED_ADMIN_PASSWORD ?? 'Admin!123',
    10,
  );

  await prisma.user.create({
    data: {
      id: randomUUID(),
      name: process.env.SEED_ADMIN_NAME ?? 'Admin Store',
      email,
      role: 'ADMIN',
      active: true,
      password: { create: { hash } },
    },
  });

  console.log(`[seed] created ADMIN: ${email}`);
};

const seedTasks: SeedTask[] = [seedAdmin];

export async function runSeedTasks(prisma: PrismaClient): Promise<void> {
  for (const task of seedTasks) {
    await task(prisma);
  }
}
