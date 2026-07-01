'use server';

import { CredentialsSignin } from 'next-auth';
import { signIn, signOut } from '@/lib/auth';
import { createServerClient } from '@/http/server';
import { loginSchema } from '@/schemas/auth';

function isNextRedirectError(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'digest' in err &&
    typeof (err as { digest: unknown }).digest === 'string' &&
    (err as { digest: string }).digest.startsWith('NEXT_REDIRECT')
  );
}

export type LoginState = {
  error?: string;
  errorAt?: number;
};

export async function loginAction(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    const first = parsed.error.flatten().fieldErrors;
    const msg = first.email?.[0] ?? first.password?.[0] ?? 'Dados inválidos';
    return { error: msg, errorAt: Date.now() };
  }

  try {
    await signIn('credentials', {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: '/home',
    });
  } catch (err) {
    if (isNextRedirectError(err)) throw err;
    if (err instanceof CredentialsSignin) {
      return { error: 'Credenciais inválidas', errorAt: Date.now() };
    }
    return {
      error: 'Não foi possível entrar. Tente novamente.',
      errorAt: Date.now(),
    };
  }

  return {};
}

export async function logoutAction() {
  const client = await createServerClient();
  await client.post<unknown>('/api/auth/logout', {});
  await signOut({ redirectTo: '/login' });
}
