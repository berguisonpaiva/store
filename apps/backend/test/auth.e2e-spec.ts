import request from 'supertest';
import { createTestApp } from './utils/create-test-app';
import { createOperador, loginAsAdmin, withAuth } from './utils/auth';
import { expectApiError } from './utils/assert-api-error';
import { useIsolatedTestApp } from './utils/factories';

describe('auth e2e', () => {
  const appPromise = createTestApp();
  useIsolatedTestApp(appPromise);

  afterAll(async () => {
    const app = await appPromise;
    await app.close();
  });

  it('covers RT01 login, /auth/me and refresh scenarios', async () => {
    const app = await appPromise;

    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: process.env.SEED_ADMIN_EMAIL ?? 'admin@store.local',
        password: process.env.SEED_ADMIN_PASSWORD ?? 'Admin!123',
      })
      .expect(200);

    expect(loginResponse.body).toMatchObject({
      accessToken: expect.any(String),
      refreshToken: expect.any(String),
      user: {
        id: expect.any(String),
        name: expect.any(String),
        email: process.env.SEED_ADMIN_EMAIL ?? 'admin@store.local',
        role: 'ADMIN',
      },
    });

    const wrongPassword = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: process.env.SEED_ADMIN_EMAIL ?? 'admin@store.local',
        password: 'senha-incorreta',
      })
      .expect(401);

    expectApiError(wrongPassword.body, {
      status: 401,
      code: 'INVALID_CREDENTIALS',
    });

    const unknownEmail = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'desconhecido@store.local',
        password: 'Admin!123',
      })
      .expect(401);

    expectApiError(unknownEmail.body, {
      status: 401,
      code: 'INVALID_CREDENTIALS',
    });

    const adminAuth = await loginAsAdmin(app);
    const operador = await createOperador(app, adminAuth, {
      name: 'Operador Teste',
      email: 'operador.teste@store.local',
    });

    await withAuth(
      request(app.getHttpServer()).patch(
        `/api/users/${operador.createdUser.id}/deactivate`,
      ),
      adminAuth,
    ).expect(200);

    const inactiveLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send(operador.credentials)
      .expect(401);

    expectApiError(inactiveLogin.body, {
      status: 401,
      code: 'USER_INACTIVE',
    });

    const me = await withAuth(
      request(app.getHttpServer()).get('/api/auth/me'),
      adminAuth,
    ).expect(200);

    expect(me.body).toMatchObject({
      id: expect.any(String),
      name: expect.any(String),
      email: process.env.SEED_ADMIN_EMAIL ?? 'admin@store.local',
      role: 'ADMIN',
      active: true,
    });

    await request(app.getHttpServer()).get('/api/auth/me').expect(401);

    const invalidMe = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', 'Bearer token-invalido')
      .expect(401);

    expect(invalidMe.body.statusCode).toBe(401);

    const refresh = await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .send({ refreshToken: adminAuth.refreshToken })
      .expect(200);

    expect(refresh.body).toMatchObject({
      accessToken: expect.any(String),
    });
    expect(refresh.body.accessToken).not.toHaveLength(0);

    const invalidRefresh = await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .send({ refreshToken: 'refresh-token-invalido' })
      .expect(401);

    expectApiError(invalidRefresh.body, {
      status: 401,
      code: 'INVALID_TOKEN',
    });
  });
});
