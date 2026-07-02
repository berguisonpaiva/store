import request from 'supertest';
import { createTestApp } from './utils/create-test-app';
import { createOperador, loginAsAdmin, withAuth } from './utils/auth';
import { expectApiError } from './utils/assert-api-error';
import { useIsolatedTestApp } from './utils/factories';

describe('users e2e', () => {
  const appPromise = createTestApp();
  useIsolatedTestApp(appPromise);

  afterAll(async () => {
    const app = await appPromise;
    await app.close();
  });

  it('covers RT02 user creation, validation, lifecycle and pagination', async () => {
    const app = await appPromise;
    const adminAuth = await loginAsAdmin(app);

    const created = await withAuth(
      request(app.getHttpServer()).post('/api/users'),
      adminAuth,
    )
      .send({
        name: 'Operador Um',
        email: 'operador.um@store.local',
        password: 'Operador!123',
        role: 'OPERADOR',
        active: true,
      })
      .expect(201);

    expect(created.body).toMatchObject({
      id: expect.any(String),
      name: 'Operador Um',
      email: 'operador.um@store.local',
      role: 'OPERADOR',
      active: true,
    });

    const duplicateEmail = await withAuth(
      request(app.getHttpServer()).post('/api/users'),
      adminAuth,
    )
      .send({
        name: 'Operador Dois',
        email: 'operador.um@store.local',
        password: 'Operador!123',
        role: 'OPERADOR',
        active: true,
      })
      .expect(409);

    expectApiError(duplicateEmail.body, {
      status: 409,
      code: 'EMAIL_ALREADY_IN_USE',
    });

    const invalidRole = await withAuth(
      request(app.getHttpServer()).post('/api/users'),
      adminAuth,
    )
      .send({
        name: 'Operador Invalido',
        email: 'operador.invalido@store.local',
        password: 'Operador!123',
        role: 'GERENTE',
        active: true,
      })
      .expect(400);

    expectApiError(invalidRole.body, {
      status: 400,
      code: 'INVALID_ROLE',
    });

    const invalidValueObject = await withAuth(
      request(app.getHttpServer()).post('/api/users'),
      adminAuth,
    )
      .send({
        name: 'Nome',
        email: 'email-invalido',
        password: '123',
        role: 'OPERADOR',
        active: true,
      })
      .expect(400);

    expect(invalidValueObject.body.statusCode).toBe(400);

    const notFoundUpdate = await withAuth(
      request(app.getHttpServer()).patch(
        '/api/users/11111111-1111-1111-1111-111111111111',
      ),
      adminAuth,
    )
      .send({ name: 'Nao Existe' })
      .expect(404);

    expectApiError(notFoundUpdate.body, {
      status: 404,
      code: 'USER_NOT_FOUND',
    });

    const operador = await createOperador(app, adminAuth, {
      name: 'Operador Ciclo',
      email: 'operador.ciclo@store.local',
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

    await withAuth(
      request(app.getHttpServer()).patch(
        `/api/users/${operador.createdUser.id}/activate`,
      ),
      adminAuth,
    ).expect(200);

    const reactivatedLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send(operador.credentials)
      .expect(200);

    expect(reactivatedLogin.body.accessToken).toEqual(expect.any(String));

    const cannotDeactivateSelf = await withAuth(
      request(app.getHttpServer()).patch(
        `/api/users/${adminAuth.user.id}/deactivate`,
      ),
      adminAuth,
    ).expect(400);

    expectApiError(cannotDeactivateSelf.body, {
      status: 400,
      code: 'CANNOT_DEACTIVATE_SELF',
    });

    const list = await withAuth(
      request(app.getHttpServer()).get('/api/users?page=1&pageSize=10'),
      adminAuth,
    ).expect(200);

    expect(list.body).toMatchObject({
      data: expect.any(Array),
      meta: {
        page: 1,
        pageSize: 10,
        total: expect.any(Number),
        totalPages: expect.any(Number),
      },
    });
    expect(list.body.data.length).toBeGreaterThan(0);
  });
});
