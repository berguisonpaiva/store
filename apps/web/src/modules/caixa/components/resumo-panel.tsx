import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatBRL } from '../data/format';
import type { ResumoSessaoDTO } from '../data/types';

type ResumoPanelProps = {
  resumo: ResumoSessaoDTO;
};

const ROWS: { key: keyof ResumoSessaoDTO; label: string }[] = [
  { key: 'abertura', label: 'Abertura' },
  { key: 'suprimentos', label: 'Suprimentos' },
  { key: 'vendasDinheiro', label: 'Vendas em dinheiro' },
  { key: 'sangrias', label: 'Sangrias' },
];

export function ResumoPanel({ resumo }: ResumoPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Resumo da sessão</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="divide-y divide-border">
          {ROWS.map((row) => (
            <div key={row.key} className="flex items-center justify-between py-2.5 text-sm">
              <dt className="text-muted-foreground">{row.label}</dt>
              <dd className="font-medium tabular-nums">
                {formatBRL(resumo[row.key] ?? 0)}
              </dd>
            </div>
          ))}
          <div className="flex items-center justify-between py-3">
            <dt className="font-semibold">Esperado em caixa</dt>
            <dd className="text-base font-bold tabular-nums">
              {formatBRL(resumo.esperado)}
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
