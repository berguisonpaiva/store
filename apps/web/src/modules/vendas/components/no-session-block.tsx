import Link from 'next/link';
import { LockOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PageSectionHeader } from '@/components/ui/page-section-header';

/**
 * Blocking state for the PDV screen when the operator has no open cash session
 * (`NO_OPEN_CASH_SESSION`). Selling is impossible until a cash drawer is open,
 * so the screen guides the operator to `/caixa`.
 */
export function NoSessionBlock() {
  return (
    <div className="flex flex-col gap-6">
      <PageSectionHeader
        title="Venda (PDV)"
        subtitle="Para vender é preciso ter um caixa aberto."
      />
      <Card>
        <CardContent className="flex flex-col items-start gap-4 pt-6">
          <p className="text-sm text-muted-foreground">
            Você não tem um caixa aberto. Abra um caixa para iniciar uma venda.
          </p>
          <Button asChild>
            <Link href="/caixa">
              <LockOpen className="size-4" />
              Abrir caixa
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
