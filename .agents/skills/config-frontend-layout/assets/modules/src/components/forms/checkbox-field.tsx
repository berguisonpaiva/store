'use client';

import { Checkbox } from '@headlessui/react';
import clsx from 'clsx';
import { CheckIcon } from 'lucide-react';

import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useFormContext, type FieldPath, type FieldValues } from 'react-hook-form';

export type CheckboxFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName;
  label: string;
  description?: string;
  disabled?: boolean;
  hasError?: boolean;
  className?: string;
  onCheckedChange?: (checked: boolean) => void;
};

export function CheckboxField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  name,
  label,
  description,
  disabled,
  hasError: hasErrorProp,
  className,
  onCheckedChange,
}: CheckboxFieldProps<TFieldValues, TName>) {
  const { control, formState, getFieldState } = useFormContext<TFieldValues>();
  const fieldError = getFieldState(name, formState).error;
  const hasError = hasErrorProp ?? !!fieldError;

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <div className="flex flex-row items-start gap-3 space-y-0">
            <FormControl>
              <Checkbox
                checked={Boolean(field.value)}
                onChange={(checked) => {
                  field.onChange(checked);
                  onCheckedChange?.(checked);
                }}
                disabled={disabled}
                name={field.name}
                onBlur={field.onBlur}
                ref={field.ref}
                className={clsx(
                  'group flex size-4 shrink-0 items-center justify-center rounded-[4px] border transition-colors',
                  'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
                  'data-checked:border-primary data-checked:bg-primary data-checked:text-primary-foreground',
                  hasError ? 'border-destructive' : 'border-input',
                  disabled && 'cursor-not-allowed opacity-50',
                )}
              >
                <CheckIcon className="size-3.5 text-primary-foreground opacity-0 group-data-checked:opacity-100" />
              </Checkbox>
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel className="font-normal">{label}</FormLabel>
              {description ? <FormDescription>{description}</FormDescription> : null}
            </div>
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
