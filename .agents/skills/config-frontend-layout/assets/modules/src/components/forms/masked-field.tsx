'use client';

import { FormDescription, FormField, FormItem, FormLabel, FormMessage, useFormField } from '@/components/ui/form';
import { fieldInputClasses } from '@/lib/field-classes';
import { cn } from '@/lib/utils';
import { IMaskInput } from 'react-imask';
import { useFormContext, type ControllerRenderProps, type FieldPath, type FieldValues } from 'react-hook-form';

type RhfField<TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>> = ControllerRenderProps<
  TFieldValues,
  TName
>;

export type MaskedFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName;
  label: string;
  mask: string;
  description?: string;
  placeholder?: string;
  disabled?: boolean;
  hasError?: boolean;
  className?: string;
  inputClassName?: string;
};

type MaskedFieldInputProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  field: RhfField<TFieldValues, TName>;
  mask: string;
  hasError: boolean;
  inputClassName?: string;
  placeholder?: string;
  disabled?: boolean;
};

function MaskedFieldInput<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({ field, mask, hasError, inputClassName, placeholder, disabled }: MaskedFieldInputProps<TFieldValues, TName>) {
  const { formItemId, formDescriptionId, formMessageId, error } = useFormField();

  return (
    <IMaskInput
      mask={mask}
      name={field.name}
      inputRef={field.ref}
      id={formItemId}
      aria-describedby={!error ? `${formDescriptionId}` : `${formDescriptionId} ${formMessageId}`}
      aria-invalid={!!error}
      value={String(field.value ?? '')}
      unmask={false}
      onAccept={(value) => field.onChange(value)}
      onBlur={field.onBlur}
      disabled={disabled}
      placeholder={placeholder}
      className={cn(fieldInputClasses(hasError), inputClassName)}
    />
  );
}

export function MaskedField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  name,
  label,
  mask,
  description,
  placeholder,
  disabled,
  hasError: hasErrorProp,
  className,
  inputClassName,
}: MaskedFieldProps<TFieldValues, TName>) {
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
          <MaskedFieldInput<TFieldValues, TName>
            field={field}
            mask={mask}
            hasError={hasError}
            inputClassName={inputClassName}
            placeholder={placeholder}
            disabled={disabled}
          />
          {description ? <FormDescription>{description}</FormDescription> : null}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
