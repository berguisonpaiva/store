'use client';

import { FormDescription, FormField, FormItem, FormLabel, FormMessage, useFormField } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { fieldInputClasses } from '@/lib/field-classes';
import { cn } from '@/lib/utils';
import { type NumericFormatProps, NumericFormat } from 'react-number-format';
import { useFormContext, type ControllerRenderProps, type FieldPath, type FieldValues } from 'react-hook-form';

type RhfField<TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>> = ControllerRenderProps<
  TFieldValues,
  TName
>;

export type NumberFieldProps<
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
  inputClassName?: string;
  prefix?: string;
  suffix?: string;
  decimalScale?: number;
  thousandSeparator?: string | boolean;
  fixedDecimalScale?: boolean;
  allowNegative?: boolean;
  decimalSeparator?: string;
} & Omit<
  NumericFormatProps,
  | 'name'
  | 'customInput'
  | 'value'
  | 'defaultValue'
  | 'onValueChange'
  | 'onChange'
  | 'type'
  | 'id'
  | 'aria-describedby'
  | 'aria-invalid'
  | 'getInputRef'
>;

type NumberFieldInputProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  field: RhfField<TFieldValues, TName>;
  hasError: boolean;
  inputClassName?: string;
  placeholder?: string;
  disabled?: boolean;
  prefix?: string;
  suffix?: string;
  decimalScale?: number;
  thousandSeparator?: string | boolean;
  fixedDecimalScale?: boolean;
  allowNegative?: boolean;
  decimalSeparator?: string;
} & Omit<
  NumericFormatProps,
  | 'name'
  | 'customInput'
  | 'value'
  | 'defaultValue'
  | 'onValueChange'
  | 'onChange'
  | 'type'
  | 'id'
  | 'aria-describedby'
  | 'aria-invalid'
  | 'getInputRef'
>;

function NumberFieldInput<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  field,
  hasError,
  inputClassName,
  placeholder,
  disabled,
  prefix,
  suffix,
  decimalScale,
  thousandSeparator,
  fixedDecimalScale,
  allowNegative,
  decimalSeparator,
  ...numericRest
}: NumberFieldInputProps<TFieldValues, TName>) {
  const { formItemId, formDescriptionId, formMessageId, error } = useFormField();

  return (
    <NumericFormat
      {...numericRest}
      customInput={Input}
      name={field.name}
      getInputRef={field.ref}
      id={formItemId}
      aria-describedby={!error ? `${formDescriptionId}` : `${formDescriptionId} ${formMessageId}`}
      aria-invalid={!!error}
      value={field.value ?? ''}
      onValueChange={(values) => {
        field.onChange(values.floatValue);
      }}
      onBlur={field.onBlur}
      disabled={disabled}
      placeholder={placeholder}
      prefix={prefix}
      suffix={suffix}
      decimalScale={decimalScale}
      thousandSeparator={thousandSeparator}
      fixedDecimalScale={fixedDecimalScale}
      allowNegative={allowNegative}
      decimalSeparator={decimalSeparator}
      className={cn(fieldInputClasses(hasError), inputClassName)}
    />
  );
}

export function NumberField<
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
  inputClassName,
  prefix,
  suffix,
  decimalScale,
  thousandSeparator,
  fixedDecimalScale,
  allowNegative,
  decimalSeparator,
  ...numericRest
}: NumberFieldProps<TFieldValues, TName>) {
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
          <NumberFieldInput<TFieldValues, TName>
            field={field}
            hasError={hasError}
            inputClassName={inputClassName}
            placeholder={placeholder}
            disabled={disabled}
            prefix={prefix}
            suffix={suffix}
            decimalScale={decimalScale}
            thousandSeparator={thousandSeparator}
            fixedDecimalScale={fixedDecimalScale}
            allowNegative={allowNegative}
            decimalSeparator={decimalSeparator}
            {...numericRest}
          />
          {description ? <FormDescription>{description}</FormDescription> : null}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
