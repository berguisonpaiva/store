import request from 'supertest';
import { createTestApp } from './utils/create-test-app';
import { loginAsAdmin, withAuth } from './utils/auth';
import { useIsolatedTestApp } from './utils/factories';

describe('smoke e2e', () => {
  const appPromise = createTestApp();
  useIsolatedTestApp(appPromise);

  afterAll(async () => {
    const app = await appPromise;
    await app.close();
  });

  it('boots the real app and authenticates the seeded admin', async () => {
    const app = await appPromise;
    const auth = await loginAsAdmin(app);

    const me = await withAuth(
      request(app.getHttpServer()).get('/api/auth/me'),
      auth,
    ).expect(200);

    expect(me.body).toMatchObject({
      email: 'admin@store.local',
      role: 'ADMIN',
      active: true,
    });
  });
});
