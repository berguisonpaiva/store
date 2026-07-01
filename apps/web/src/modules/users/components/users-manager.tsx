'use client';

import { useMemo, useState, useTransition } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import {
  parseAsBoolean,
  parseAsInteger,
  parseAsStringLiteral,
  useQueryState,
} from 'nuqs';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { PaginationControls } from '@/components/ui/pagination-controls';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  createUser,
  setUserActive,
  updateUser,
} from '../data/users.actions';
import { EMAIL_FIELD_CODE, NAME_FIELD_CODES, messageForCode } from '../data/error-messages';
import {
  ROLE_OPTIONS,
  createUserSchema,
  createUserDefaults,
  editUserSchema,
  editUserDefaults,
  type CreateUserFormValues,
  type EditUserFormValues,
} from '../schemas/user.schema';
import type { PaginationMetaDTO, UserDTO, UserRole } from '../data/types';

type UsersManagerProps = {
  users: UserDTO[];
  meta: PaginationMetaDTO;
};

const ROLE_FILTER_OPTIONS = [
  { label: 'Todos os perfis', value: 'all' },
  ...ROLE_OPTIONS.map((option) => ({ label: option.label, value: option.value })),
];

const STATUS_OPTIONS = [
  { label: 'Todos os status', value: 'all' },
  { label: 'Ativos', value: 'true' },
  { label: 'Inativos', value: 'false' },
];

const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Administrador',
  OPERADOR: 'Operador',
};

const ROLE_VALUES = ['ADMIN', 'OPERADOR'] as const;

export function UsersManager({ users, meta }: UsersManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<UserDTO | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<UserDTO | null>(null);

  const [role, setRole] = useQueryState(
    'role',
    parseAsStringLiteral(ROLE_VALUES).withOptions({ shallow: false }),
  );
  const [active, setActive] = useQueryState(
    'active',
    parseAsBoolean.withOptions({ shallow: false }),
  );
  const [, setPage] = useQueryState(
    'page',
    parseAsInteger.withDefault(1).withOptions({ shallow: false }),
  );

  const createForm = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: createUserDefaults(),
  });
  const editForm = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserSchema),
    defaultValues: editUserDefaults(),
  });

  const roleValue = role ?? 'all';
  const statusValue = active === null ? 'all' : String(active);

  const onCreate = createForm.handleSubmit(async (values) => {
    const result = await createUser({
      name: values.name.trim(),
      email: values.email.trim(),
      password: values.password,
      role: values.role,
    });
    if (result.ok) {
      toast.success('Usuário criado.');
      createForm.reset(createUserDefaults());
      setCreateOpen(false);
      router.refresh();
      return;
    }
    if (result.code === EMAIL_FIELD_CODE) {
      createForm.setError('email', { message: messageForCode(result.code) });
    } else if (NAME_FIELD_CODES.includes(result.code as (typeof NAME_FIELD_CODES)[number])) {
      createForm.setError('name', { message: messageForCode(result.code) });
    } else {
      toast.error(messageForCode(result.code));
    }
  });

  function openEdit(user: UserDTO) {
    editForm.reset(editUserDefaults(user));
    setEditTarget(user);
  }

  const onEdit = editForm.handleSubmit(async (values) => {
    if (!editTarget) return;
    const result = await updateUser(editTarget.id, {
      name: values.name.trim(),
      email: values.email.trim(),
      role: values.role,
    });
    if (result.ok) {
      toast.success('Usuário atualizado.');
      setEditTarget(null);
      router.refresh();
      return;
    }
    if (result.code === EMAIL_FIELD_CODE) {
      editForm.setError('email', { message: messageForCode(result.code) });
    } else if (NAME_FIELD_CODES.includes(result.code as (typeof NAME_FIELD_CODES)[number])) {
      editForm.setError('name', { message: messageForCode(result.code) });
    } else {
      toast.error(messageForCode(result.code));
    }
  });

  function reactivate(user: UserDTO) {
    startTransition(async () => {
      const result = await setUserActive(user.id, true);
      if (result.ok) {
        toast.success('Usuário ativado.');
        router.refresh();
      } else {
        toast.error(messageForCode(result.code));
      }
    });
  }

  function confirmDeactivate() {
    const user = deactivateTarget;
    if (!user) return;
    startTransition(async () => {
      const result = await setUserActive(user.id, false);
      if (result.ok) {
        toast.success('Usuário desativado.');
        setDeactivateTarget(null);
        router.refresh();
      } else {
        // CANNOT_DEACTIVATE_SELF (422) and any other failure surface as a toast;
        // the user stays active (RN05).
        setDeactivateTarget(null);
        toast.error(messageForCode(result.code));
      }
    });
  }

  const columns = useMemo<ColumnDef<UserDTO>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Nome',
        cell: ({ row }) => (
          <span className="font-medium">{row.original.name}</span>
        ),
      },
      {
        accessorKey: 'email',
        header: 'Email',
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.email}</span>
        ),
      },
      {
        accessorKey: 'role',
        header: 'Perfil',
        cell: ({ row }) => ROLE_LABELS[row.original.role],
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
          const user = row.original;
          return (
            <div className="flex items-center justify-end gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Editar usuário"
                title="Editar"
                onClick={() => openEdit(user)}
              >
                <Pencil className="size-4" />
              </Button>
              {user.active ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Desativar usuário"
                  title="Desativar"
                  disabled={isPending}
                  onClick={() => setDeactivateTarget(user)}
                >
                  <Trash2 className="size-4 text-red-500" />
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Reativar usuário"
                  title="Reativar"
                  disabled={isPending}
                  onClick={() => reactivate(user)}
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
        title="Usuários"
        subtitle="Gerencie os usuários que acessam o sistema."
        aside={
          <Button type="button" onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            Novo usuário
          </Button>
        }
      />

      <Card className="p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Combobox
            options={ROLE_FILTER_OPTIONS}
            value={roleValue}
            onChange={(value) => {
              void setRole(value === 'all' ? null : (value as UserRole));
              void setPage(1);
            }}
            placeholder="Perfil"
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
          data={users}
          empty={
            <EmptyListState
              title="Nenhum usuário encontrado"
              subtitle="Ajuste os filtros ou crie um novo usuário."
            />
          }
        />
      </Card>

      <PaginationControls
        page={meta.page}
        totalPages={meta.totalPages}
        totalItems={meta.total}
        totalLabel="usuários"
        onPageChange={(next) => void setPage(next)}
        disabled={isPending}
      />

      {/* Create */}
      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) createForm.reset(createUserDefaults());
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo usuário</DialogTitle>
            <DialogDescription>
              Informe os dados de acesso e o perfil do usuário.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={onCreate} className="flex flex-col gap-4" noValidate>
            <div>
              <Label htmlFor="create-user-name">Nome</Label>
              <Input
                id="create-user-name"
                placeholder="Nome e sobrenome"
                {...createForm.register('name')}
                aria-invalid={!!createForm.formState.errors.name}
                autoFocus
              />
              {createForm.formState.errors.name && (
                <FormErrorMessage className="mt-1.5">
                  {createForm.formState.errors.name.message}
                </FormErrorMessage>
              )}
            </div>
            <div>
              <Label htmlFor="create-user-email">Email</Label>
              <Input
                id="create-user-email"
                type="email"
                {...createForm.register('email')}
                aria-invalid={!!createForm.formState.errors.email}
                placeholder="voce@empresa.com"
              />
              {createForm.formState.errors.email && (
                <FormErrorMessage className="mt-1.5">
                  {createForm.formState.errors.email.message}
                </FormErrorMessage>
              )}
            </div>
            <div>
              <Label htmlFor="create-user-password">Senha</Label>
              <Input
                id="create-user-password"
                type="password"
                autoComplete="new-password"
                {...createForm.register('password')}
                aria-invalid={!!createForm.formState.errors.password}
                placeholder="••••••••"
              />
              {createForm.formState.errors.password && (
                <FormErrorMessage className="mt-1.5">
                  {createForm.formState.errors.password.message}
                </FormErrorMessage>
              )}
            </div>
            <div>
              <Label>Perfil</Label>
              <Controller
                control={createForm.control}
                name="role"
                render={({ field }) => (
                  <Combobox
                    options={ROLE_OPTIONS.map((option) => ({
                      label: option.label,
                      value: option.value,
                    }))}
                    value={field.value}
                    onChange={(value) => field.onChange(value as UserRole)}
                    placeholder="Selecione o perfil"
                  />
                )}
              />
              {createForm.formState.errors.role && (
                <FormErrorMessage className="mt-1.5">
                  {createForm.formState.errors.role.message}
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
              <Button type="submit" disabled={createForm.formState.isSubmitting}>
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
            <DialogTitle>Editar usuário</DialogTitle>
            <DialogDescription>
              Atualize os dados e o perfil do usuário.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={onEdit} className="flex flex-col gap-4" noValidate>
            <div>
              <Label htmlFor="edit-user-name">Nome</Label>
              <Input
                id="edit-user-name"
                {...editForm.register('name')}
                aria-invalid={!!editForm.formState.errors.name}
                autoFocus
              />
              {editForm.formState.errors.name && (
                <FormErrorMessage className="mt-1.5">
                  {editForm.formState.errors.name.message}
                </FormErrorMessage>
              )}
            </div>
            <div>
              <Label htmlFor="edit-user-email">Email</Label>
              <Input
                id="edit-user-email"
                type="email"
                {...editForm.register('email')}
                aria-invalid={!!editForm.formState.errors.email}
              />
              {editForm.formState.errors.email && (
                <FormErrorMessage className="mt-1.5">
                  {editForm.formState.errors.email.message}
                </FormErrorMessage>
              )}
            </div>
            <div>
              <Label>Perfil</Label>
              <Controller
                control={editForm.control}
                name="role"
                render={({ field }) => (
                  <Combobox
                    options={ROLE_OPTIONS.map((option) => ({
                      label: option.label,
                      value: option.value,
                    }))}
                    value={field.value}
                    onChange={(value) => field.onChange(value as UserRole)}
                    placeholder="Selecione o perfil"
                  />
                )}
              />
              {editForm.formState.errors.role && (
                <FormErrorMessage className="mt-1.5">
                  {editForm.formState.errors.role.message}
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
        title="Desativar usuário"
        description={
          deactivateTarget
            ? `"${deactivateTarget.name}" perderá o acesso ao sistema. Você pode reativá-lo depois.`
            : undefined
        }
        confirmLabel="Desativar"
        isConfirming={isPending}
        onConfirm={confirmDeactivate}
      />
    </div>
  );
}
