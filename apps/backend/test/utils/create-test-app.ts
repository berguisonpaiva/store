import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  type NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from '../../src/app.module';
import { configureApp } from '../../src/app.setup';
import { assertTestDatabaseUrl } from './db';

export async function createTestApp(): Promise<NestFastifyApplication> {
  assertTestDatabaseUrl();

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ trustProxy: true }),
  );

  await configureApp(app, { includeDocs: false });
  await app.init();
  await app.getHttpAdapter().getInstance().ready();

  return app;
}
