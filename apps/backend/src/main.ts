import 'dotenv/config';
import fastifyCors from '@fastify/cors';
import fastifyMultipart from '@fastify/multipart';
import { RequestMethod, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  type NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { loadEnv } from './core/config/env.config';
import { setupDocs } from './core/docs/setup-docs';
import { ApiExceptionFilter } from './shared/errors/api-exception.filter';

const MB = 1024 * 1024;

async function bootstrap() {
  const env = loadEnv();

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ trustProxy: true }),
  );

  await app.register(fastifyCors as any, {
    origin: env.corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  await app.register(fastifyMultipart as any, {
    limits: {
      fieldNameSize: 100,
      fieldSize: 1 * MB,
      fields: 10,
      fileSize: 5 * MB,
      files: 20,
    },
  });

  app.setGlobalPrefix('api', {
    exclude: [
      { path: 'docs', method: RequestMethod.ALL },
      { path: 'docs-json', method: RequestMethod.ALL },
      { path: 'swagger', method: RequestMethod.ALL },
    ],
  });

  setupDocs(app);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new ApiExceptionFilter());
  await app.listen(env.port, '0.0.0.0');

  console.log(`Server running on: http://localhost:${env.port}`);
  console.log(`Scalar:  http://localhost:${env.port}/docs`);
  console.log(`Swagger: http://localhost:${env.port}/swagger`);
}

bootstrap();
