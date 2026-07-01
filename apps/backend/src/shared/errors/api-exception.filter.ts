import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ValidationError } from '@repo/shared';
import { ApiErrorResponse } from './api-error-response.type';

/// Minimal structural types for the Fastify reply/request (avoids a direct
/// `fastify` dependency — it is only transitively available via
/// `@nestjs/platform-fastify`).
interface HttpReply {
  status(code: number): { send(body: unknown): void };
}
interface HttpRequest {
  url: string;
}

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<HttpReply>();
    const request = ctx.getRequest<HttpRequest>();

    const body = this._buildBody(exception, request.url);
    // Fastify reply: `.status()` aliases `.code()`, and the body is sent with
    // `.send()` (not Express's `.json()`).
    response.status(body.statusCode).send(body);
  }

  private _buildBody(exception: unknown, path: string): ApiErrorResponse {
    const timestamp = new Date().toISOString();

    if (exception instanceof ValidationError) {
      return {
        statusCode: exception.status ?? HttpStatus.BAD_REQUEST,
        error: 'Validation Error',
        message: [exception.codes],
        details: exception.messages,
        path,
        timestamp,
      };
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const payload = exception.getResponse();
      const raw =
        typeof payload === 'string'
          ? payload
          : ((payload as any).message ?? exception.message);
      const message: string[] = Array.isArray(raw) ? raw : [raw];

      return {
        statusCode: status,
        error: exception.name,
        message,
        path,
        timestamp,
      };
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'Internal Error',
      message: ['An unexpected error occurred. Please try again later.'],
      path,
      timestamp,
    };
  }
}
