'use client';

import Link from 'next/link';
import type { ComponentProps } from 'react';

import { Button } from '@/components/ui/button';

export type ButtonLinkProps = Omit<ComponentProps<typeof Button>, 'render' | 'nativeButton'> & {
  href: string;
};

export function ButtonLink({ href, ...props }: ButtonLinkProps) {
  return <Button render={<Link href={href} />} nativeButton={false} {...props} />;
}
