'use server';

import { revalidatePath } from 'next/cache';

import { auth, unstable_update } from '@/lib/auth';
import { createServerClient } from '@/http/server';
import { changePasswordSchema, updateProfileAvatarSchema, updateProfileNameSchema } from '@/schemas/profile';

export type ProfileNameState = {
  error?: string;
  success?: string;
};

export type ProfileAvatarState = {
  error?: string;
  success?: string;
};

export type ChangePasswordState = {
  error?: string;
  success?: string;
};

function inactiveMessage() {
  return 'Conta inativa. Não é possível alterar dados.';
}

export async function updateProfileNameAction(_prev: ProfileNameState, formData: FormData): Promise<ProfileNameState> {
  const session = await auth();
  if (!session?.user) {
    return { error: 'Sessão inválida. Faça login novamente.' };
  }
  if (session.status === 'INACTIVE') {
    return { error: inactiveMessage() };
  }

  const parsed = updateProfileNameSchema.safeParse({
    name: formData.get('name'),
  });
  if (!parsed.success) {
    const first = parsed.error.flatten().fieldErrors.name?.[0];
    return { error: first ?? 'Nome inválido' };
  }

  const client = await createServerClient();
  const res = await client.patch<unknown>('/api/auth/profile', {
    name: parsed.data.name,
  });
  if (res.error) {
    return { error: res.error };
  }

  await unstable_update({ user: { name: parsed.data.name } });
  revalidatePath('/perfil');
  revalidatePath('/home');
  return { success: 'Nome atualizado com sucesso.' };
}

export async function updateProfileAvatarAction(
  _prev: ProfileAvatarState,
  formData: FormData,
): Promise<ProfileAvatarState> {
  const session = await auth();
  if (!session?.user) {
    return { error: 'Sessão inválida. Faça login novamente.' };
  }
  if (session.status === 'INACTIVE') {
    return { error: inactiveMessage() };
  }

  const raw = formData.get('avatarUrl');
  const parsed = updateProfileAvatarSchema.safeParse({
    avatarUrl: typeof raw === 'string' ? raw : '',
  });
  if (!parsed.success) {
    const first = parsed.error.flatten().fieldErrors.avatarUrl?.[0];
    return { error: first ?? 'URL inválida' };
  }

  const nextAvatar = parsed.data.avatarUrl ? parsed.data.avatarUrl : null;

  const client = await createServerClient();
  const res = await client.patch<unknown>('/api/auth/profile', {
    name: session.user.name ?? '',
    avatarUrl: nextAvatar,
  });
  if (res.error) {
    return { error: res.error };
  }

  await unstable_update({ user: { image: nextAvatar ?? undefined } });
  revalidatePath('/perfil');
  revalidatePath('/home');
  return { success: 'Avatar atualizado com sucesso.' };
}

export async function changePasswordAction(
  _prev: ChangePasswordState,
  formData: FormData,
): Promise<ChangePasswordState> {
  const session = await auth();
  if (!session?.user) {
    return { error: 'Sessão inválida. Faça login novamente.' };
  }
  if (session.status === 'INACTIVE') {
    return { error: inactiveMessage() };
  }

  const parsed = changePasswordSchema.safeParse({
    oldPassword: formData.get('oldPassword'),
    newPassword: formData.get('newPassword'),
    confirmPassword: formData.get('confirmPassword'),
  });
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    const msg =
      flat.fieldErrors.oldPassword?.[0] ??
      flat.fieldErrors.newPassword?.[0] ??
      flat.fieldErrors.confirmPassword?.[0] ??
      'Dados inválidos';
    return { error: msg };
  }

  const client = await createServerClient();
  const res = await client.post<unknown>('/api/auth/change-password', {
    oldPassword: parsed.data.oldPassword,
    newPassword: parsed.data.newPassword,
    confirmPassword: parsed.data.confirmPassword,
  });
  if (res.error) {
    return { error: res.error };
  }

  revalidatePath('/perfil');
  return { success: 'Senha alterada com sucesso.' };
}
