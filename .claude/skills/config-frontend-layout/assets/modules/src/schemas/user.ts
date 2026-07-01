import { z } from 'zod';

export type UserListRole = {
  id: string;
  name: string;
};

export type UserListPermissionAlias = {
  alias: string;
};

export type UserStatus = 'ACTIVE' | 'INACTIVE';

export type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  roles: UserListRole[];
  permissions: UserListPermissionAlias[];
  avatarUrl: string;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
};

export type UserDetailRole = {
  id: string;
  name: string;
};

export type UserDetailPermissionCriticality = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type UserDetailPermission = {
  name: string;
  alias: string;
  criticality: UserDetailPermissionCriticality;
};

export type UserDetailModule = {
  id: string;
  name: string;
  domain: string;
};

export type UserDetail = {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  roles: UserDetailRole[];
  permissions: UserDetailPermission[];
  modules: UserDetailModule[];
  status?: UserStatus;
};

/** Valor do select quando nenhum perfil é escolhido */
export const USER_FORM_NO_ROLE_VALUE = '__no_role__' as const;

export const userCreateFormSchema = z
  .object({
    name: z.string().min(1, 'Informe o nome'),
    email: z.string().email('E-mail inválido'),
    password: z
      .string()
      .min(8, 'Senha deve ter pelo menos 8 caracteres')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/,
        'Senha deve conter maiúscula, minúscula, número e símbolo',
      ),
    confirmPassword: z.string().min(1, 'Confirme a senha'),
    roleId: z.union([z.literal(USER_FORM_NO_ROLE_VALUE), z.string().uuid()]),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  });

export type UserCreateFormValues = z.infer<typeof userCreateFormSchema>;

export const userUpdateFormSchema = z.object({
  name: z.string().min(1, 'Informe o nome'),
  roleIds: z.array(z.string().uuid()).default([]),
});

export type UserUpdateFormValues = z.infer<typeof userUpdateFormSchema>;
