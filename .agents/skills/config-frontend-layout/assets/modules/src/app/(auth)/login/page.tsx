import Image from 'next/image';

import { LoginForm } from '@/components/login-form';

const APP_NAME = 'App';

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ reason?: string }> }) {
  const params = await searchParams;
  const inactiveNotice = params.reason === 'inactive';

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="rounded-[2rem] border border-border/60 bg-card px-6 py-8 shadow-[0_18px_60px_rgba(0,0,0,0.12)] md:px-8 md:py-10">
            <div className="space-y-6 text-center">
              <div className="relative mx-auto h-24 w-full max-w-[320px] md:h-28">
                <Image
                  src="/logo-completa.png"
                  alt={APP_NAME}
                  fill
                  sizes="(max-width: 768px) 80vw, 320px"
                  priority
                  className="object-contain object-center"
                />
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">Acesso</p>
                <h1 className="text-3xl font-medium tracking-[-0.04em] text-foreground">{`Entrar no ${APP_NAME}`}</h1>
                <p className="text-sm leading-6 text-muted-foreground">Use suas credenciais para continuar.</p>
              </div>
            </div>

            <LoginForm inactiveNotice={inactiveNotice} />

            <p className="mt-6 text-xs leading-6 text-muted-foreground">Acesso protegido por autenticação segura.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
