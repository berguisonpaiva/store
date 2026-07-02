import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  type NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { configureApp } from './app.setup';
import { loadEnv } from './core/config/env.config';

async function bootstrap() {
  const env = loadEnv();

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ trustProxy: true }),
  );

  await configureApp(app, { includeDocs: true });
  await app.listen(env.port, '0.0.0.0');

  console.log(`Server running on: http://localhost:${env.port}`);
  console.log(`Scalar:  http://localhost:${env.port}/docs`);
  console.log(`Swagger: http://localhost:${env.port}/swagger`);
}

bootstrap();
