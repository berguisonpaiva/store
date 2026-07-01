import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@repo/auth';

export const PAPEIS_KEY = 'papeis';

/// Restricts a route to the given staff roles. Used together with `RolesGuard`.
export const Papeis = (...roles: UserRole[]) => SetMetadata(PAPEIS_KEY, roles);
