'use client';

import * as React from 'react';

import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

import { formTabsListClassName, formTabsTriggerClassName } from './form-tokens';

type FormTabsListProps = React.ComponentProps<typeof TabsList>;

function FormTabsList({ className, ...props }: FormTabsListProps) {
  return <TabsList variant="line" className={cn(formTabsListClassName, className)} {...props} />;
}

type FormTabsTriggerProps = React.ComponentProps<typeof TabsTrigger>;

function FormTabsTrigger({ className, ...props }: FormTabsTriggerProps) {
  return <TabsTrigger className={cn(formTabsTriggerClassName, className)} {...props} />;
}

export { FormTabsList, FormTabsTrigger };
