import type { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

import { buttonVariants } from '@/components/ui/button-variants';
import { cn } from '@/lib/utils';

interface KineticPageProps {
  title: string;
  description: string;
  icon?: ReactNode;
  iconBgColor?: string;
  action?: ReactNode;
  backButton?: string;
  children?: ReactNode;
}

export function KineticPage({
  title,
  description,
  icon,
  iconBgColor = 'bg-secondary',
  action,
  backButton,
  children,
}: KineticPageProps) {
  return (
    <section className="flex w-full flex-col gap-8 px-4 py-5 sm:px-6">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between sm:gap-10">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          {backButton && (
            <Link
              href={backButton}
              className={cn(
                buttonVariants({ variant: 'ghost', size: 'icon-sm' }),
                'shrink-0 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground',
              )}
              aria-label="Voltar"
            >
              <ArrowLeft className="size-4" strokeWidth={2} />
            </Link>
          )}
          {icon && (
            <div className={cn('flex size-10 shrink-0 items-center justify-center rounded-lg', iconBgColor)}>
              {icon}
            </div>
          )}
          <div className="min-w-0 flex-1 space-y-1">
            <h1 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">{title}</h1>
            <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">{description}</p>
          </div>
        </div>
        {action && (
          <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
            {action}
          </div>
        )}
      </header>

      {children && <div className="min-w-0">{children}</div>}
    </section>
  );
}
