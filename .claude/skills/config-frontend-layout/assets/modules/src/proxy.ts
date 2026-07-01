import { auth } from '@/lib/auth';
import { userHasRouteAccess } from '@/lib/navigation-access';
import type { UserAccountStatus } from '@/types/next-auth';
import { NextResponse } from 'next/server';

type SessionWithError = {
  user?: { mustChangePassword?: boolean } & Record<string, unknown>;
  error?: string;
  status?: string;
  modules?: string[];
  permissionAliases?: string[];
};

const FORCE_CHANGE_PASSWORD_ROUTE = '/perfil/trocar-senha-obrigatoria';

const PUBLIC_ROUTES = ['/privacidade'];

export default auth((req) => {
  const path = req.nextUrl.pathname;
  const session = req.auth as SessionWithError | null;

  if (path.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  if (PUBLIC_ROUTES.some((route) => path === route || path.startsWith(`${route}/`))) {
    return NextResponse.next();
  }

  if (
    path.startsWith('/_next') ||
    path.startsWith('/favicon') ||
    /\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$/i.test(path)
  ) {
    return NextResponse.next();
  }

  const sessionError = session?.error;
  if (sessionError === 'RefreshTokenExpired') {
    const login = new URL('/login', req.nextUrl.origin);
    return NextResponse.redirect(login);
  }

  const status = (session as SessionWithError | null)?.status;
  if (session?.user && status === 'INACTIVE' && path !== '/login') {
    const login = new URL('/login', req.nextUrl.origin);
    login.searchParams.set('reason', 'inactive');
    return NextResponse.redirect(login);
  }

  if (path === '/' || path === '/login') {
    if (path === '/login' && session?.user && !sessionError && status !== 'INACTIVE') {
      return NextResponse.redirect(new URL('/home', req.nextUrl));
    }
    return NextResponse.next();
  }

  if (!session?.user) {
    const login = new URL('/login', req.nextUrl.origin);
    login.searchParams.set('callbackUrl', path);
    return NextResponse.redirect(login);
  }

  // Gate de força-troca: usuário-alvo de reset administrativo só pode
  // navegar pela tela dedicada de troca de senha. Qualquer outra rota é
  // redirecionada. Logout (POST /api/auth/*) já é liberado mais acima.
  const mustChangePassword = (session.user as { mustChangePassword?: boolean })?.mustChangePassword ?? false;
  if (mustChangePassword && path !== FORCE_CHANGE_PASSWORD_ROUTE) {
    return NextResponse.redirect(new URL(FORCE_CHANGE_PASSWORD_ROUTE, req.nextUrl.origin));
  }

  const navSession = session as SessionWithError;
  if (
    !userHasRouteAccess(path, {
      status: navSession.status as UserAccountStatus | undefined,
      modules: navSession.modules,
      permissionAliases: navSession.permissionAliases,
    })
  ) {
    return NextResponse.redirect(new URL('/home', req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)'],
};
