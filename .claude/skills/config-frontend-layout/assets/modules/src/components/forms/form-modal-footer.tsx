'use client';

import * as React from 'react';

import { DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

import { formModalFooterClassName } from './form-tokens';

type FormModalFooterProps = React.ComponentProps<typeof DialogFooter>;

function FormModalFooter({ className, ...props }: FormModalFooterProps) {
  return <DialogFooter className={cn(formModalFooterClassName, className)} data-slot="form-modal-footer" {...props} />;
}

export { FormModalFooter };
export type { FormModalFooterProps };
