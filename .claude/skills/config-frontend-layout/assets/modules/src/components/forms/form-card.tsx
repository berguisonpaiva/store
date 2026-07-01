'use client';

import * as React from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

import {
  formCardContentClassName,
  formCardDescriptionClassName,
  formCardHeaderClassName,
  formCardSurfaceClassName,
  formCardTitleClassName,
} from './form-tokens';

function FormCard({ className, ...props }: React.ComponentProps<typeof Card>) {
  return <Card className={cn(formCardSurfaceClassName, 'gap-0 py-0', className)} {...props} />;
}

function FormCardHeader({ className, ...props }: React.ComponentProps<typeof CardHeader>) {
  return <CardHeader className={cn(formCardHeaderClassName, className)} {...props} />;
}

function FormCardTitle({ className, ...props }: React.ComponentProps<typeof CardTitle>) {
  return <CardTitle className={cn(formCardTitleClassName, className)} {...props} />;
}

function FormCardDescription({ className, ...props }: React.ComponentProps<typeof CardDescription>) {
  return <CardDescription className={cn(formCardDescriptionClassName, className)} {...props} />;
}

function FormCardContent({ className, ...props }: React.ComponentProps<typeof CardContent>) {
  return <CardContent className={cn(formCardContentClassName, className)} {...props} />;
}

export { FormCard, FormCardContent, FormCardDescription, FormCardHeader, FormCardTitle };
