'use server';

import { AuthError } from 'next-auth';
import { signIn } from '@/lib/auth';

export type LoginActionResult = { error?: string };

/**
 * Login via Server Action wrapping NextAuth `signIn('credentials')`.
 *
 * On success `signIn` throws a redirect to `/dashboard` (re-thrown here so the
 * navigation propagates). Invalid credentials surface as a generic error for
 * the caller to show as a toast — no user enumeration.
 */
export async function loginAction(input: {
  email: string;
  password: string;
}): Promise<LoginActionResult> {
  try {
    await signIn('credentials', {
      email: input.email,
      password: input.password,
      redirectTo: '/dashboard',
    });
    return {};
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: 'INVALID_CREDENTIALS' };
    }
    throw error;
  }
}
