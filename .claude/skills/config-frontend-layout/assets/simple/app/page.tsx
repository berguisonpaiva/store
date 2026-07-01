import Link from 'next/link';
import { ArrowRight, LayoutDashboard } from 'lucide-react';
import { AppLogo } from '@/components/branding/app-logo';
import { Button } from '@/components/ui/button';

/**
 * Landing page de exemplo (rota raiz `/`).
 *
 * Hero simples com dois caminhos: entrar (autenticação) e acessar o dashboard.
 * Substitua os textos e o CTA pelo conteúdo real do produto.
 */
export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,var(--primary),transparent_45%)] opacity-10" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-8">
        <header className="flex items-center justify-between">
          <AppLogo size="md" priority />
          <Button asChild variant="ghost">
            <Link href="/join">Entrar</Link>
          </Button>
        </header>

        <section className="flex flex-1 flex-col items-center justify-center gap-8 py-16 text-center">
          <span className="rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Bem-vindo
          </span>

          <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
            Construa mais rápido com uma base pronta
          </h1>

          <p className="max-w-2xl text-lg text-muted-foreground">
            Estrutura compartilhada, navegação e telas de exemplo já configuradas. Comece pelo dashboard ou siga para a
            tela de autenticação.
          </p>

          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/dashboard">
                <LayoutDashboard className="size-4" />
                Acessar o dashboard
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/join">
                Ir para autenticação
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </section>
      </div>
    </main>
  );
}
