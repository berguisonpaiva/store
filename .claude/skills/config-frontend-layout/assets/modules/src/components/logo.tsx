import Image from 'next/image';

import { cn } from '@/lib/utils';

const APP_NAME = 'App';

type LogoProps = {
  className?: string;
  /** Classes Tailwind para o box do logo (largura/altura). Padrão: 40×40px dentro da coluna de 60px. */
  boxClassName?: string;
};

export default function Logo({ className, boxClassName }: LogoProps) {
  return (
    <div className={cn('relative size-10 shrink-0 overflow-hidden', boxClassName)}>
      <Image
        src="/logo.png"
        alt={APP_NAME}
        fill
        className={cn('object-contain object-center', className)}
        sizes="40px"
        priority
      />
    </div>
  );
}
