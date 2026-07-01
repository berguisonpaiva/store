'use client';

import { useMemo, useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { parseAsBoolean, parseAsString, useQueryState } from 'nuqs';
import type { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import { Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Combobox } from '@/components/ui/combobox';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { DataTable } from '@/components/ui/data-table';
import { EmptyListState } from '@/components/ui/empty-list-state';
import { FormErrorMessage } from '@/components/ui/form-error-message';
import { PageSectionHeader } from '@/components/ui/page-section-header';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  createCategory,
  setCategoryActive,
  updateCategory,
} from '../data/category.actions';
import {
  CATEGORY_NAME_FIELD_CODE,
  messageForCode,
} from '../data/error-messages';
import {
  CATEGORY_NAME_RULES,
  type CategoryFormValues,
} from '../schemas/category.schema';
import type { CategoryDTO } from '../data/types';

type CategoriesManagerProps = {
  categories: CategoryDTO[];
};

const STATUS_OPTIONS = [
  { label: 'Todos os status', value: 'all' },
  { label: 'Ativas', value: 'true' },
  { label: 'Inativas', value: 'false' },
];

export function CategoriesManager({ categories }: CategoriesManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<CategoryDTO | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<CategoryDTO | null>(
    null,
  );

  const [search, setSearch] = useQueryState(
    'name',
    parseAsString.withDefault(''),
  );
  const [active, setActive] = useQueryState(
    'active',
    parseAsBoolean.withOptions({ shallow: false }),
  );

  const createForm = useForm<CategoryFormValues>({
    defaultValues: { name: '' },
  });
  const editForm = useForm<CategoryFormValues>({ defaultValues: { name: '' } });

  const statusValue = active === null ? 'all' : String(active);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return categories;
    return categories.filter((c) => c.name.toLowerCase().includes(term));
  }, [categories, search]);

  const onCreate = createForm.handleSubmit(async (values) => {
    const result = await createCategory({ name: values.name.trim() });
    if (result.ok) {
      toast.success('Categoria criada.');
      createForm.reset({ name: '' });
      setCreateOpen(false);
      router.refresh();
      return;
    }
    if (result.code === CATEGORY_NAME_FIELD_CODE) {
      createForm.setError('name', { message: messageForCode(result.code) });
    } else {
      toast.error(messageForCode(result.code));
    }
  });

  function openEdit(category: CategoryDTO) {
    editForm.reset({ name: category.name });
    setEditTarget(category);
  }

  const onEdit = editForm.handleSubmit(async (values) => {
    if (!editTarget) return;
    const result = await updateCategory(editTarget.id, {
      name: values.name.trim(),
    });
    if (result.ok) {
      toast.success('Categoria atualizada.');
      setEditTarget(null);
      router.refresh();
      return;
    }
    if (result.code === CATEGORY_NAME_FIELD_CODE) {
      editForm.setError('name', { message: messageForCode(result.code) });
    } else {
      toast.error(messageForCode(result.code));
    }
  });

  function reactivate(category: CategoryDTO) {
    startTransition(async () => {
      const result = await setCategoryActive(category.id, true);
      if (result.ok) {
        toast.success('Categoria ativada.');
        router.refresh();
      } else {
        toast.error(messageForCode(result.code));
      }
    });
  }

  function confirmDeactivate() {
    const category = deactivateTarget;
    if (!category) return;
    startTransition(async () => {
      const result = await setCategoryActive(category.id, false);
      if (result.ok) {
        toast.success('Categoria desativada.');
        setDeactivateTarget(null);
        router.refresh();
      } else {
        toast.error(messageForCode(result.code));
      }
    });
  }

  const columns = useMemo<ColumnDef<CategoryDTO>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Nome',
        cell: ({ row }) => (
          <span className="font-medium">{row.original.name}</span>
        ),
      },
      {
        accessorKey: 'active',
        header: 'Status',
        cell: ({ row }) => (
          <Badge variant={row.original.active ? 'default' : 'secondary'}>
            {row.original.active ? 'Ativa' : 'Inativa'}
          </Badge>
        ),
      },
      {
        id: 'actions',
        header: 'Ações',
        enableSorting: false,
        meta: { headClassName: 'text-right', cellClassName: 'text-right' },
        cell: ({ row }) => {
          const category = row.original;
          return (
            <div className="flex items-center justify-end gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Editar categoria"
                title="Editar"
                onClick={() => openEdit(category)}
              >
                <Pencil className="size-4" />
              </Button>
              {category.active ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Desativar categoria"
                  title="Desativar"
                  disabled={isPending}
                  onClick={() => setDeactivateTarget(category)}
                >
                  <Trash2 className="size-4 text-red-500" />
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Reativar categoria"
                  title="Reativar"
                  disabled={isPending}
                  onClick={() => reactivate(category)}
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
    [isPending],
  );

  return (
    <div className="flex flex-col gap-6">
      <PageSectionHeader
        title="Categorias"
        subtitle="Organize os produtos por categoria."
        aside={
          <Button type="button" onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            Nova categoria
          </Button>
        }
      />

      <Card className="p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            placeholder="Buscar por nome..."
            value={search}
            onChange={(event) => void setSearch(event.target.value || null)}
          />
          <Combobox
            options={STATUS_OPTIONS}
            value={statusValue}
            onChange={(value) =>
              void setActive(value === 'all' ? null : value === 'true')
            }
            placeholder="Status"
          />
        </div>
      </Card>

      <Card className="p-0">
        <DataTable
          columns={columns}
          data={visible}
          empty={
            <EmptyListState
              title="Nenhuma categoria"
              subtitle="Crie a primeira categoria ou ajuste os filtros."
            />
          }
        />
      </Card>

      {/* Create */}
      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) createForm.reset({ name: '' });
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova categoria</DialogTitle>
            <DialogDescription>
              Informe um nome único para a categoria.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={onCreate} className="flex flex-col gap-4" noValidate>
            <div>
              <Label htmlFor="create-category-name">Nome</Label>
              <Input
                id="create-category-name"
                {...createForm.register('name', CATEGORY_NAME_RULES)}
                aria-invalid={!!createForm.formState.errors.name}
                placeholder="Bebidas"
                autoFocus
              />
              {createForm.formState.errors.name && (
                <FormErrorMessage className="mt-1.5">
                  {createForm.formState.errors.name.message}
                </FormErrorMessage>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setCreateOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createForm.formState.isSubmitting}
              >
                <Plus className="size-4" />
                Adicionar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit */}
      <Dialog
        open={!!editTarget}
        onOpenChange={(open) => {
          if (!open) setEditTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar categoria</DialogTitle>
            <DialogDescription>Renomeie a categoria.</DialogDescription>
          </DialogHeader>
          <form onSubmit={onEdit} className="flex flex-col gap-4" noValidate>
            <div>
              <Label htmlFor="edit-category-name">Nome</Label>
              <Input
                id="edit-category-name"
                {...editForm.register('name', CATEGORY_NAME_RULES)}
                aria-invalid={!!editForm.formState.errors.name}
                autoFocus
              />
              {editForm.formState.errors.name && (
                <FormErrorMessage className="mt-1.5">
                  {editForm.formState.errors.name.message}
                </FormErrorMessage>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setEditTarget(null)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={editForm.formState.isSubmitting}>
                Salvar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deactivateTarget}
        onOpenChange={(open) => {
          if (!open) setDeactivateTarget(null);
        }}
        destructive
        title="Desativar categoria"
        description={
          deactivateTarget
            ? `"${deactivateTarget.name}" será desativada. Você pode reativá-la depois.`
            : undefined
        }
        confirmLabel="Desativar"
        isConfirming={isPending}
        onConfirm={confirmDeactivate}
      />
    </div>
  );
}
