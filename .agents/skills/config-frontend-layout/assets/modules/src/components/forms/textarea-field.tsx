'use client';

import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { fieldInputClasses } from '@/lib/field-classes';
import { cn } from '@/lib/utils';
import { useFormContext, type FieldPath, type FieldValues } from 'react-hook-form';

export type TextareaFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName;
  label: string;
  description?: string;
  placeholder?: string;
  disabled?: boolean;
  hasError?: boolean;
  className?: string;
  textareaClassName?: string;
  rows?: number;
};

export function TextareaField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  name,
  label,
  description,
  placeholder,
  disabled,
  hasError: hasErrorProp,
  className,
  textareaClassName,
  rows = 4,
}: TextareaFieldProps<TFieldValues, TName>) {
  const { control, formState, getFieldState } = useFormContext<TFieldValues>();
  const fieldError = getFieldState(name, formState).error;
  const hasError = hasErrorProp ?? !!fieldError;

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Textarea
              {...field}
              rows={rows}
              placeholder={placeholder}
              disabled={disabled}
              className={cn('min-h-[80px] resize-y', fieldInputClasses(hasError), textareaClassName)}
            />
          </FormControl>
          {description ? <FormDescription>{description}</FormDescription> : null}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
