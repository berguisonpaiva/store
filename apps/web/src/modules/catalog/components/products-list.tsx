'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  parseAsBoolean,
  parseAsInteger,
  parseAsString,
  useQueryState,
} from 'nuqs';
import type { ColumnDef } from '@tanstack/react-table';
import { Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Combobox } from '@/components/ui/combobox';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { DataTable } from '@/components/ui/data-table';
import { EmptyListState } from '@/components/ui/empty-list-state';
import { PageSectionHeader } from '@/components/ui/page-section-header';
import { PaginationControls } from '@/components/ui/pagination-controls';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ProductForm } from './product-form';
import { setProductActive } from '../data/product.actions';
import { messageForCode } from '../data/error-messages';
import type {
  CategoryDTO,
  PaginationMetaDTO,
  ProductListItemDTO,
} from '../data/types';

type ProductsListProps = {
  products: ProductListItemDTO[];
  meta: PaginationMetaDTO;
  categories: CategoryDTO[];
};

const STATUS_OPTIONS = [
  { label: 'Todos os status', value: 'all' },
  { label: 'Ativos', value: 'true' },
  { label: 'Inativos', value: 'false' },
];

export function ProductsList({ products, meta, categories }: ProductsListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [createOpen, setCreateOpen] = useState(false);
  const [deactivateTarget, setDeactivateTarget] =
    useState<ProductListItemDTO | null>(null);

  const [name, setName] = useQueryState(
    'name',
    parseAsString.withDefault('').withOptions({ shallow: false, throttleMs: 400 }),
  );
  const [categoryId, setCategoryId] = useQueryState(
    'categoryId',
    parseAsString.withDefault('').withOptions({ shallow: false }),
  );
  const [active, setActive] = useQueryState(
    'active',
    parseAsBoolean.withOptions({ shallow: false }),
  );
  const [, setPage] = useQueryState(
    'page',
    parseAsInteger.withDefault(1).withOptions({ shallow: false }),
  );

  const categoryNameById = useMemo(() => {
    const map = new Map(categories.map((c) => [c.id, c.name]));
    return (id: string | null) => (id ? (map.get(id) ?? '—') : '—');
  }, [categories]);

  const categoryOptions = [
    { label: 'Todas as categorias', value: 'all' },
    ...categories.map((c) => ({ label: c.name, value: c.id })),
  ];

  const statusValue = active === null ? 'all' : String(active);

  function reactivate(product: ProductListItemDTO) {
    startTransition(async () => {
      const result = await setProductActive(product.id, true);
      if (result.ok) {
        toast.success('Produto ativado.');
        router.refresh();
      } else {
        toast.error(messageForCode(result.code));
      }
    });
  }

  function confirmDeactivate() {
    const product = deactivateTarget;
    if (!product) return;
    startTransition(async () => {
      const result = await setProductActive(product.id, false);
      if (result.ok) {
        toast.success('Produto desativado.');
        setDeactivateTarget(null);
        router.refresh();
      } else {
        toast.error(messageForCode(result.code));
      }
    });
  }

  const columns = useMemo<ColumnDef<ProductListItemDTO>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Nome',
        cell: ({ row }) => (
          <span className="font-medium">{row.original.name}</span>
        ),
      },
      {
        id: 'category',
        header: 'Categoria',
        accessorFn: (row) => categoryNameById(row.categoryId),
        cell: ({ getValue }) => getValue() as string,
      },
      {
        accessorKey: 'variationCount',
        header: 'Variações',
      },
      {
        accessorKey: 'active',
        header: 'Status',
        cell: ({ row }) => (
          <Badge variant={row.original.active ? 'default' : 'secondary'}>
            {row.original.active ? 'Ativo' : 'Inativo'}
          </Badge>
        ),
      },
      {
        id: 'actions',
        header: 'Ações',
        enableSorting: false,
        meta: { headClassName: 'text-right', cellClassName: 'text-right' },
        cell: ({ row }) => {
          const product = row.original;
          return (
            <div className="flex items-center justify-end gap-1">
              <Button
                asChild
                variant="ghost"
                size="icon"
                aria-label="Editar produto"
                title="Editar"
              >
                <Link href={`/products/${product.id}`}>
                  <Pencil className="size-4" />
                </Link>
              </Button>
              {product.active ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Desativar produto"
                  title="Desativar"
                  disabled={isPending}
                  onClick={() => setDeactivateTarget(product)}
                >
                  <Trash2 className="size-4 text-red-500" />
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Reativar produto"
                  title="Reativar"
                  disabled={isPending}
                  onClick={() => reactivate(product)}
                >
                  <RotateCcw className="size-4" />
                </Button>
              )}
            </div>
          );
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [categoryNameById, isPending],
  );

  return (
    <div className="flex flex-col gap-6">
      <PageSectionHeader
        title="Produtos"
        subtitle="Gerencie produtos, variações e disponibilidade."
        aside={
          <Button type="button" onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            Novo produto
          </Button>
        }
      />

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[88vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo produto</DialogTitle>
            <DialogDescription>
              Defina os dados do produto e ao menos uma variação.
            </DialogDescription>
          </DialogHeader>
          <ProductForm
            categories={categories}
            embedded
            onCancel={() => setCreateOpen(false)}
            onSuccess={() => {
              setCreateOpen(false);
              router.refresh();
            }}
          />
        </DialogContent>
      </Dialog>

      <Card className="p-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <Input
            placeholder="Buscar por nome..."
            value={name}
            onChange={(event) => {
              void setName(event.target.value || null);
              void setPage(1);
            }}
          />
          <Combobox
            options={categoryOptions}
            value={categoryId || 'all'}
            onChange={(value) => {
              void setCategoryId(value === 'all' ? null : value);
              void setPage(1);
            }}
            placeholder="Categoria"
          />
          <Combobox
            options={STATUS_OPTIONS}
            value={statusValue}
            onChange={(value) => {
              void setActive(value === 'all' ? null : value === 'true');
              void setPage(1);
            }}
            placeholder="Status"
          />
        </div>
      </Card>

      <Card className="p-0">
        <DataTable
          columns={columns}
          data={products}
          empty={
            <EmptyListState
              title="Nenhum produto encontrado"
              subtitle="Ajuste os filtros ou crie um novo produto."
            />
          }
        />
      </Card>

      <PaginationControls
        page={meta.page}
        totalPages={meta.totalPages}
        totalItems={meta.total}
        totalLabel="produtos"
        onPageChange={(next) => void setPage(next)}
        disabled={isPending}
      />

      <ConfirmDialog
        open={!!deactivateTarget}
        onOpenChange={(open) => {
          if (!open) setDeactivateTarget(null);
        }}
        destructive
        title="Desativar produto"
        description={
          deactivateTarget
            ? `"${deactivateTarget.name}" deixará de aparecer no PDV. Você pode reativá-lo depois.`
            : undefined
        }
        confirmLabel="Desativar"
        isConfirming={isPending}
        onConfirm={confirmDeactivate}
      />
    </div>
  );
}
