import { Request } from 'express';
import { AuthenticatedUser } from '@repo/shared';

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}
