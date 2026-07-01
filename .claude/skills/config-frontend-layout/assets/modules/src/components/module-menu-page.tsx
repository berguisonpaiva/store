import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { KineticPage } from '@/components/kinetic-page';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type ModuleMenuPageProps = {
  title: string;
  description: string;
  summary: string;
  highlights: Array<{
    title: string;
    description: string;
  }>;
  nextStep?: {
    label: string;
    href: string;
  };
};

export function ModuleMenuPage({ title, description, summary, highlights, nextStep }: ModuleMenuPageProps) {
  return (
    <KineticPage title={title} description={description}>
      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-border/60 bg-card">
          <CardContent className="px-5 py-6 md:px-6">
            <div className="space-y-3">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-primary">Area ativa</p>
              <h2 className="max-w-[14ch] text-3xl font-medium tracking-[-0.04em] text-foreground md:text-4xl">
                {title}
              </h2>
              <p className="max-w-[62ch] text-sm leading-7 text-muted-foreground md:text-base">{summary}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card">
          <CardHeader>
            <CardTitle className="text-base">Leitura rapida</CardTitle>
            <CardDescription>Pontos principais para orientar o proximo passo.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {highlights.map((item) => (
              <div key={item.title} className="space-y-1">
                <p className="text-sm font-medium text-foreground">{item.title}</p>
                <p className="text-sm leading-6 text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {nextStep ? (
          <Card className="border-border/60 bg-card xl:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Proximo passo</CardTitle>
              <CardDescription>Atalho rapido para seguir no fluxo mais comum desta area.</CardDescription>
            </CardHeader>
            <CardContent>
              <Link
                href={nextStep.href}
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-95"
              >
                {nextStep.label}
                <ArrowRight className="size-4" />
              </Link>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </KineticPage>
  );
}
