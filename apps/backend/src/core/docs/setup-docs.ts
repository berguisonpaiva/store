import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';

export function setupDocs(app: NestFastifyApplication) {
  const config = new DocumentBuilder()
    .setTitle('API')
    .setDescription('HTTP API documentation')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('swagger', app, document);

  app.use(
    '/docs',
    apiReference({
      content: document,
      withFastify: true,
    }),
  );

  app
    .getHttpAdapter()
    .getInstance()
    .get('/docs-json', (_request, reply) => {
      reply.send(document);
    });
}
