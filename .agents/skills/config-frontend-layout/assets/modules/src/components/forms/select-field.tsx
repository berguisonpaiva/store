'use client';

import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { fieldInputClasses } from '@/lib/field-classes';
import { cn } from '@/lib/utils';
import { useFormContext, type FieldPath, type FieldValues } from 'react-hook-form';

export type SelectOption = {
  value: string;
  label: string;
};

export type SelectFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName;
  label: string;
  options: SelectOption[];
  description?: string;
  placeholder?: string;
  disabled?: boolean;
  hasError?: boolean;
  className?: string;
  triggerClassName?: string;
};

export function SelectField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  name,
  label,
  options,
  description,
  placeholder = 'Selecione...',
  disabled,
  hasError: hasErrorProp,
  className,
  triggerClassName,
}: SelectFieldProps<TFieldValues, TName>) {
  const { control, formState, getFieldState } = useFormContext<TFieldValues>();
  const fieldError = getFieldState(name, formState).error;
  const hasError = hasErrorProp ?? !!fieldError;

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const selectedOption = options.find((opt) => opt.value === field.value);

        return (
          <FormItem className={className}>
            <FormLabel>{label}</FormLabel>
            <Select value={field.value ?? ''} onValueChange={field.onChange} disabled={disabled}>
              <FormControl>
                <SelectTrigger
                  className={cn('w-full min-w-0', fieldInputClasses(hasError), triggerClassName)}
                  size="default"
                >
                  <SelectValue placeholder={placeholder}>{selectedOption?.label}</SelectValue>
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {options.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {description ? <FormDescription>{description}</FormDescription> : null}
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
