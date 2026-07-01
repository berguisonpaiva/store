'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';

import { formFieldTwoColGridClassName } from './form-tokens';

type FormFieldGridProps = React.ComponentProps<'div'>;

function FormFieldGrid({ className, ...props }: FormFieldGridProps) {
  return <div className={cn(formFieldTwoColGridClassName, className)} data-slot="form-field-grid" {...props} />;
}

export { FormFieldGrid };
export type { FormFieldGridProps };
