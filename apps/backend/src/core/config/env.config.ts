export type AppEnv = {
  port: number;
  corsOrigin: string | boolean;
  enableTestSupport: boolean;
};

export function loadEnv(): AppEnv {
  const port = Number(process.env.PORT ?? process.env.PORT ?? 4000);
  const corsOrigin = process.env.CORS_ORIGIN ?? true;
  const enableTestSupport = process.env.ENABLE_TEST_SUPPORT === 'true';

  return {
    port,
    corsOrigin,
    enableTestSupport,
  };
}
