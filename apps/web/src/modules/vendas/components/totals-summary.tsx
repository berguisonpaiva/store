import { formatBRL } from '../data/format';

type TotalsSummaryProps = {
  subtotal: number; // reais
  desconto: number; // reais
  total: number; // reais
};

/** Live subtotal / desconto / total, recomputed on every change (`total = subtotal − desconto`). */
export function TotalsSummary({ subtotal, desconto, total }: TotalsSummaryProps) {
  return (
    <dl className="divide-y divide-border">
      <div className="flex items-center justify-between py-2.5 text-sm">
        <dt className="text-muted-foreground">Subtotal</dt>
        <dd className="font-medium tabular-nums">{formatBRL(subtotal)}</dd>
      </div>
      <div className="flex items-center justify-between py-2.5 text-sm">
        <dt className="text-muted-foreground">Desconto</dt>
        <dd className="font-medium tabular-nums text-red-500">
          {desconto > 0 ? `− ${formatBRL(desconto)}` : formatBRL(0)}
        </dd>
      </div>
      <div className="flex items-center justify-between py-3">
        <dt className="font-semibold">Total</dt>
        <dd className="text-base font-bold tabular-nums">{formatBRL(total)}</dd>
      </div>
    </dl>
  );
}
