'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';

import { formActionsBarClassName } from './form-tokens';

type FormActionsProps = React.ComponentProps<'div'>;

function FormActions({ className, ...props }: FormActionsProps) {
  return <div className={cn(formActionsBarClassName, className)} data-slot="form-actions" {...props} />;
}

export { FormActions };
export type { FormActionsProps };
