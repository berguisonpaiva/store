import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth, signOut } from '@/lib/auth';
import { ForceChangePasswordForm } from './_components/force-change-password-form';

/**
 * Tela dedicada para o usuário que foi vítima de um reset administrativo.
 * Bloqueia navegação para qualquer outra rota (gate em `src/proxy.ts`)
 * enquanto `session.user.mustChangePassword === true`. Após sucesso da
 * troca, o backend zera a flag; o próximo refresh do JWT propaga a
 * mudança e o gate libera o usuário.
 */
export default async function TrocarSenhaObrigatoriaPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  // Se o usuário já não precisa mais trocar (ex.: navegou pelo link
  // depois de já ter trocado em outra aba), manda direto para a home.
  if (!session.user.mustChangePassword) {
    redirect('/home');
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center px-6 py-12">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Defina uma nova senha</h1>
        <p className="text-sm text-muted-foreground">
          Sua senha foi redefinida por um administrador. Por segurança, você precisa definir uma nova senha antes de
          continuar usando a plataforma.
        </p>
      </div>

      <div className="mt-8">
        <ForceChangePasswordForm userEmail={session.user.email ?? ''} />
      </div>

      <form
        action={async () => {
          'use server';
          await signOut({ redirectTo: '/login' });
        }}
        className="mt-6 text-center"
      >
        <button type="submit" className="text-sm text-muted-foreground underline-offset-4 hover:underline">
          Sair e voltar para o login
        </button>
      </form>

      <p className="mt-8 text-center text-xs text-muted-foreground">
        Problemas? Contate seu administrador.{' '}
        <Link href="/login" className="underline underline-offset-4">
          Voltar ao login
        </Link>
      </p>
    </main>
  );
}
