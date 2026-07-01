export type AppEnv = {
  port: number;
  corsOrigin: string | boolean;
};

export function loadEnv(): AppEnv {
  const port = Number(process.env.PORT ?? process.env.PORT ?? 4000);
  const corsOrigin = process.env.CORS_ORIGIN ?? true;

  return {
    port,
    corsOrigin,
  };
}
