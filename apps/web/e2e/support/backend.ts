import { expect, type APIRequestContext } from '@playwright/test';

const backendPort = process.env.E2E_BACKEND_PORT ?? '4012';
const backendUrl = process.env.PLAYWRIGHT_E2E_BACKEND_URL ?? `http://127.0.0.1:${backendPort}`;

type LoginResponse = {
  accessToken: string;
};

type CreateUserResponse = {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'OPERADOR';
  active: boolean;
};

export type OperatorCredentials = {
  email: string;
  password: string;
  name: string;
};

export async function resetBackendState(
  request: APIRequestContext,
): Promise<void> {
  const response = await request.post(`${backendUrl}/api/test/reset`);
  expect(response.ok()).toBeTruthy();
}

export async function loginAsAdminApi(
  request: APIRequestContext,
): Promise<string> {
  const response = await request.post(`${backendUrl}/api/auth/login`, {
    data: {
      email: 'admin@store.local',
      password: 'Admin!123',
    },
  });
  expect(response.ok()).toBeTruthy();

  const payload = (await response.json()) as LoginResponse;
  return payload.accessToken;
}

export async function createOperatorViaApi(
  request: APIRequestContext,
  overrides: Partial<OperatorCredentials> = {},
): Promise<OperatorCredentials> {
  const accessToken = await loginAsAdminApi(request);
  const nonce = Date.now();
  const credentials: OperatorCredentials = {
    name: overrides.name ?? 'Operador Teste',
    email: overrides.email ?? `operador.e2e.${nonce}@store.local`,
    password: overrides.password ?? 'Operador!123',
  };

  const response = await request.post(`${backendUrl}/api/users`, {
    data: {
      name: credentials.name,
      email: credentials.email,
      password: credentials.password,
      role: 'OPERADOR',
    },
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  expect(response.ok()).toBeTruthy();

  await response.json() as CreateUserResponse;
  return credentials;
}
