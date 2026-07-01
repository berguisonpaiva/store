import type { ReactNode } from 'react';
import { PublicShell } from './public-shell';

/**
 * Layout do grupo (public) — Server Component.
 *
 * Sem `"use client"`: a lógica que depende do cliente (usePathname) mora na
 * casca PublicShell, importada aqui. O `children` é repassado como slot, então
 * páginas server aninhadas continuam server.
 */
export default function PublicGroupLayout({ children }: { children: ReactNode }) {
  return <PublicShell>{children}</PublicShell>;
}
