'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PageSectionHeader } from '@/components/ui/page-section-header';
import { abrirVenda } from '../data/vendas.actions';
import { messageForCode } from '../data/error-messages';

/**
 * Entry CTA shown when the operator has an open cash session but no sale in
 * progress. Opening the sale is a mutation, so it runs as a Server Action from
 * the client and then deep-links to the sale via `?venda=<id>`.
 */
export function StartSaleButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function start() {
    startTransition(async () => {
      const result = await abrirVenda();
      if (result.ok) {
        router.replace(`/vendas?venda=${result.data.id}`);
        return;
      }
      toast.error(messageForCode(result.code));
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <PageSectionHeader
        title="Venda (PDV)"
        subtitle="Inicie uma nova venda para começar a bipar produtos."
      />
      <Card>
        <CardContent className="pt-6">
          <Button onClick={start} disabled={isPending}>
            <ShoppingCart className="size-4" />
            Iniciar venda
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
