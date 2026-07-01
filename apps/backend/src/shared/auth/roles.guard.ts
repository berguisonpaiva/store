import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@repo/auth';
import { PAPEIS_KEY } from '../decorators/papeis.decorator';
import { AuthenticatedRequest } from '../types/authenticated-request.type';

/// Authorizes a request by staff role. Runs after `JwtGuard` (which populates
/// `request.user`). When no `@Papeis(...)` is declared, the route is allowed.
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<UserRole[] | undefined>(
      PAPEIS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!required || required.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const role = (request.user as { role?: UserRole } | undefined)?.role;

    if (!role || !required.includes(role)) {
      throw new ForbiddenException('OPERATION_NOT_ALLOWED_FOR_ROLE');
    }

    return true;
  }
}
