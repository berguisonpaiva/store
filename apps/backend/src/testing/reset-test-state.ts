import type { PrismaClient } from '@prisma/client';
import { runSeedTasks } from '../../prisma/seed/tasks';
import { truncateAll } from './test-database';

export async function resetTestState(prisma: PrismaClient): Promise<void> {
  await truncateAll(prisma);
  await runSeedTasks(prisma);
}
