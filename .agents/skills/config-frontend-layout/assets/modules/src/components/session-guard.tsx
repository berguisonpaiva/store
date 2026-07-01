'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function SessionGuard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status !== 'authenticated') return;
    if (session?.error === 'RefreshTokenExpired') {
      router.replace('/login');
    }
  }, [session?.error, status, router]);

  return null;
}
