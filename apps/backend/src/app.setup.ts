import fastifyCors from '@fastify/cors';
import fastifyMultipart from '@fastify/multipart';
import { RequestMethod, ValidationPipe } from '@nestjs/common';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { loadEnv } from './core/config/env.config';
import { ApiExceptionFilter } from './shared/errors/api-exception.filter';

const MB = 1024 * 1024;

export async function configureApp(
  app: NestFastifyApplication,
  options: {
    includeDocs?: boolean;
  } = {},
): Promise<void> {
  const env = loadEnv();
  const includeDocs = options.includeDocs ?? true;

  await app.register(fastifyCors, {
    origin: env.corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  await app.register(fastifyMultipart, {
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

  if (includeDocs) {
    const { setupDocs } = await import('./core/docs/setup-docs.js');
    setupDocs(app);
  }

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new ApiExceptionFilter());
}
