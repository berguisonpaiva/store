'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { formatBRL } from '../data/format';
import type { VariationOption, VendaItemDTO } from '../data/types';

type ItensListProps = {
  itens: VendaItemDTO[];
  options: VariationOption[];
  readOnly?: boolean;
  /** Variation flagged by INSUFFICIENT_STOCK — its row is highlighted. */
  highlightVariacaoId?: string | null;
  onChangeQuantidade: (item: VendaItemDTO, quantidade: number) => void;
  onRemove: (item: VendaItemDTO) => void;
};

function labelFor(options: VariationOption[], variacaoId: string): string {
  return options.find((o) => o.variacaoId === variacaoId)?.label ?? variacaoId;
}

/** One editable line: quantity (>0), read-only snapshot price, per-line total. */
function ItemRow({
  item,
  options,
  readOnly,
  highlighted,
  onChangeQuantidade,
  onRemove,
}: {
  item: VendaItemDTO;
  options: VariationOption[];
  readOnly?: boolean;
  highlighted: boolean;
  onChangeQuantidade: (item: VendaItemDTO, quantidade: number) => void;
  onRemove: (item: VendaItemDTO) => void;
}) {
  // Re-mounted (keyed on quantidade) whenever the backend quantity changes, so
  // local edit state initializes from the latest value without an effect.
  const [qty, setQty] = useState(String(item.quantidade));

  const invalid = !(Number.isInteger(Number(qty)) && Number(qty) > 0);

  return (
    <TableRow className={cn(highlighted && 'bg-red-500/10')}>
      <TableCell className="font-medium">{labelFor(options, item.variacaoId)}</TableCell>
      <TableCell className="w-24">
        {readOnly ? (
          <span className="tabular-nums">{item.quantidade}</span>
        ) : (
          <Input
            type="number"
            min={1}
            step={1}
            aria-label={`Quantidade de ${labelFor(options, item.variacaoId)}`}
            value={qty}
            aria-invalid={invalid}
            onChange={(e) => setQty(e.target.value)}
            onBlur={() => {
              const n = Number(qty);
              if (Number.isInteger(n) && n > 0 && n !== item.quantidade) {
                onChangeQuantidade(item, n);
              } else {
                setQty(String(item.quantidade));
              }
            }}
            className="w-20"
          />
        )}
      </TableCell>
      <TableCell className="text-right tabular-nums text-muted-foreground">
        {formatBRL(item.precoUnitario)}
      </TableCell>
      <TableCell className="text-right tabular-nums font-medium">
        {formatBRL(item.total)}
      </TableCell>
      <TableCell className="w-12 text-right">
        {readOnly ? null : (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Remover ${labelFor(options, item.variacaoId)}`}
            onClick={() => onRemove(item)}
          >
            <Trash2 className="size-4" />
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
}

export function ItensList({
  itens,
  options,
  readOnly,
  highlightVariacaoId,
  onChangeQuantidade,
  onRemove,
}: ItensListProps) {
  if (itens.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        Nenhum item adicionado. Bipe um produto para começar.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Produto</TableHead>
          <TableHead>Qtd.</TableHead>
          <TableHead className="text-right">Preço unit.</TableHead>
          <TableHead className="text-right">Total</TableHead>
          <TableHead className="sr-only">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {itens.map((item) => (
          <ItemRow
            key={`${item.id}-${item.quantidade}`}
            item={item}
            options={options}
            readOnly={readOnly}
            highlighted={highlightVariacaoId === item.variacaoId}
            onChangeQuantidade={onChangeQuantidade}
            onRemove={onRemove}
          />
        ))}
      </TableBody>
    </Table>
  );
}
