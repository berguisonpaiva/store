import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageSectionHeader } from '@/components/ui/page-section-header';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  formatBRL,
  formatDateTime,
  movementLabel,
  paymentFormLabel,
  saleStatusLabel,
  sessionStatusLabel,
} from '../data/format';
import type {
  MovimentacaoDTO,
  ResumoSessaoDTO,
  SessaoOutDTO,
  VendaOutDTO,
} from '../data/types';

type SessaoDetailProps = {
  sessao: SessaoOutDTO;
  resumo: ResumoSessaoDTO;
  movimentacoes: MovimentacaoDTO[];
  vendas: VendaOutDTO[];
  operatorName: string;
};

/** Read-only ADMIN detail view for a single cash session (RN05). No edit
 *  controls: opening/closing data, sangrias/suprimentos, the automatic resumo
 *  and the linked sales are all display-only (design.md Decision 7). */
export function SessaoDetail({
  sessao,
  resumo,
  movimentacoes,
  vendas,
  operatorName,
}: SessaoDetailProps) {
  const porForma = Object.entries(resumo.totalPorForma ?? {});

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Button
          asChild
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Voltar para a lista de caixas"
          title="Voltar"
        >
          <Link href="/caixas">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <PageSectionHeader
          title="Detalhe da sessão"
          subtitle={`Operador: ${operatorName}`}
          className="flex-1"
        />
        <Badge variant={sessao.status === 'ABERTA' ? 'default' : 'secondary'}>
          {sessionStatusLabel(sessao.status)}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Abertura / fechamento */}
        <Card>
          <CardHeader>
            <CardTitle>Abertura e fechamento</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="divide-y divide-border">
              <DetailRow label="Valor de abertura" value={formatBRL(sessao.valorAbertura)} />
              <DetailRow label="Aberta em" value={formatDateTime(sessao.abertaEm)} />
              <DetailRow
                label="Valor de fechamento"
                value={
                  sessao.valorFechamento === null
                    ? '—'
                    : formatBRL(sessao.valorFechamento)
                }
              />
              <DetailRow label="Fechada em" value={formatDateTime(sessao.fechadaEm)} />
            </dl>
          </CardContent>
        </Card>

        {/* Resumo automático (RN05) */}
        <Card>
          <CardHeader>
            <CardTitle>Resumo automático</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="divide-y divide-border">
              <DetailRow label="Total de vendas" value={formatBRL(resumo.totalVendas)} />
              <DetailRow label="Qtd. de vendas" value={String(resumo.qtdVendas)} />
              <DetailRow label="Suprimentos" value={formatBRL(resumo.suprimentos)} />
              <DetailRow label="Sangrias" value={formatBRL(resumo.sangrias)} />
              <DetailRow label="Vendas em dinheiro" value={formatBRL(resumo.vendasDinheiro)} />
              <div className="flex items-center justify-between py-3">
                <dt className="font-semibold">Saldo esperado</dt>
                <dd className="text-base font-bold tabular-nums">
                  {formatBRL(resumo.esperado)}
                </dd>
              </div>
              {sessao.status === 'FECHADA' && resumo.contado !== null ? (
                <>
                  <DetailRow label="Contado" value={formatBRL(resumo.contado)} />
                  <DetailRow
                    label="Divergência"
                    value={
                      resumo.divergencia === null
                        ? '—'
                        : formatBRL(resumo.divergencia)
                    }
                  />
                </>
              ) : null}
            </dl>
          </CardContent>
        </Card>
      </div>

      {/* Total por forma de pagamento (RN05) */}
      <Card>
        <CardHeader>
          <CardTitle>Total por forma de pagamento</CardTitle>
        </CardHeader>
        <CardContent>
          {porForma.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nenhum pagamento registrado nesta sessão.
            </p>
          ) : (
            <dl className="divide-y divide-border">
              {porForma.map(([forma, valor]) => (
                <DetailRow
                  key={forma}
                  label={paymentFormLabel(forma)}
                  value={formatBRL(valor)}
                />
              ))}
            </dl>
          )}
        </CardContent>
      </Card>

      {/* Movimentações (sangrias/suprimentos e demais) */}
      <Card>
        <CardHeader>
          <CardTitle>Movimentações</CardTitle>
        </CardHeader>
        <CardContent>
          {movimentacoes.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nenhuma movimentação registrada nesta sessão.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Observação</TableHead>
                  <TableHead className="text-right">Data/hora</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movimentacoes.map((mov) => (
                  <TableRow key={mov.id}>
                    <TableCell className="font-medium">
                      {movementLabel(mov.tipo)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatBRL(mov.valor)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {mov.observacao ?? '—'}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {formatDateTime(mov.criadaEm)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Vendas vinculadas */}
      <Card>
        <CardHeader>
          <CardTitle>Vendas vinculadas</CardTitle>
        </CardHeader>
        <CardContent>
          {vendas.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nenhuma venda vinculada a esta sessão.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Itens</TableHead>
                  <TableHead className="text-right">Desconto</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Concluída em</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendas.map((venda) => (
                  <TableRow key={venda.id}>
                    <TableCell className="font-medium tabular-nums">
                      {venda.numero ?? '—'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          venda.status === 'CONCLUIDA'
                            ? 'default'
                            : venda.status === 'CANCELADA'
                              ? 'outline'
                              : 'secondary'
                        }
                      >
                        {saleStatusLabel(venda.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {venda.itens.length}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatBRL(venda.desconto)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatBRL(venda.total)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {formatDateTime(venda.concluidaEm)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium tabular-nums">{value}</dd>
    </div>
  );
}
