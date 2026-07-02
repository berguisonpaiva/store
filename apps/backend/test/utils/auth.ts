import { randomUUID } from 'node:crypto';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import request from 'supertest';

export type AuthSession = {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    name: string;
    email?: string;
    role: string;
    active?: boolean;
  };
};

export type OperadorFixture = {
  createdUser: {
    id: string;
    name: string;
    email: string;
    role: string;
    active: boolean;
  };
  credentials: {
    email: string;
    password: string;
  };
  auth: AuthSession;
};

type AuthLike = string | Pick<AuthSession, 'accessToken'>;
type AuthenticatedRequest = {
  set(name: string, value: string): AuthenticatedRequest;
};

export function withAuth<T extends AuthenticatedRequest>(
  req: T,
  auth: AuthLike,
): T {
  const token = typeof auth === 'string' ? auth : auth.accessToken;
  req.set('Authorization', `Bearer ${token}`);
  return req;
}

export async function loginAsAdmin(
  app: NestFastifyApplication,
): Promise<AuthSession> {
  const response = await request(app.getHttpServer())
    .post('/api/auth/login')
    .send({
      email: process.env.SEED_ADMIN_EMAIL ?? 'admin@store.local',
      password: process.env.SEED_ADMIN_PASSWORD ?? 'Admin!123',
    });

  if (response.status !== 200) {
    throw new Error(
      `Admin login failed with ${response.status}: ${JSON.stringify(response.body)}`,
    );
  }

  return response.body as AuthSession;
}

export async function createOperador(
  app: NestFastifyApplication,
  adminAuth: AuthLike,
  overrides: Partial<{
    name: string;
    email: string;
    password: string;
    active: boolean;
  }> = {},
): Promise<OperadorFixture> {
  const email =
    overrides.email ?? `operador.${randomUUID()}@store.local`.toLowerCase();
  const password = overrides.password ?? 'Operador!123';

  const createResponse = await withAuth(
    request(app.getHttpServer()).post('/api/users'),
    adminAuth,
  )
    .send({
      name: overrides.name ?? 'Operador Teste',
      email,
      password,
      role: 'OPERADOR',
      active: overrides.active ?? true,
    })
    .expect(201);

  const auth = await loginAsOperador(app, { email, password });

  return {
    createdUser: createResponse.body,
    credentials: { email, password },
    auth,
  };
}

export async function loginAsOperador(
  app: NestFastifyApplication,
  credentials: {
    email: string;
    password: string;
  },
): Promise<AuthSession> {
  const response = await request(app.getHttpServer())
    .post('/api/auth/login')
    .send(credentials);

  if (response.status !== 200) {
    throw new Error(
      `Operador login failed with ${response.status}: ${JSON.stringify(response.body)}`,
    );
  }

  return response.body as AuthSession;
}
