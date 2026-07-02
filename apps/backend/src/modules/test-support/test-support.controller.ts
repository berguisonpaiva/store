import { Controller, Get, HttpCode, Post } from '@nestjs/common';
import { PrismaService } from '../../db/prisma.service';
import {
  assertTestDatabaseUrl,
  getTestDatabaseName,
} from '../../testing/test-database';
import { resetTestState } from '../../testing/reset-test-state';

@Controller('test')
export class TestSupportController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('health')
  @HttpCode(200)
  async health() {
    const databaseName = getTestDatabaseName();
    assertTestDatabaseUrl();

    await this.prisma.client.$queryRawUnsafe('SELECT 1');

    return {
      ok: true,
      databaseName,
    };
  }

  @Post('reset')
  @HttpCode(200)
  async reset() {
    await resetTestState(this.prisma.client);

    return {
      ok: true,
      databaseName: getTestDatabaseName(),
    };
  }
}
