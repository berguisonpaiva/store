import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatBRL, formatDateTime, movementLabel } from '../data/format';
import type { MovimentacaoDTO } from '../data/types';

type MovimentacoesListProps = {
  movimentacoes: MovimentacaoDTO[];
};

export function MovimentacoesList({ movimentacoes }: MovimentacoesListProps) {
  return (
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
                  <TableCell className="font-medium">{movementLabel(mov.tipo)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatBRL(mov.valor)}</TableCell>
                  <TableCell className="text-muted-foreground">{mov.observacao ?? '—'}</TableCell>
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
  );
}
