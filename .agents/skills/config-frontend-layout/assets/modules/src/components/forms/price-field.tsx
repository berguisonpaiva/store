'use client';

import type { FieldPath, FieldValues } from 'react-hook-form';

import { NumberField, type NumberFieldProps } from './number-field';

export type PriceFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = Omit<
  NumberFieldProps<TFieldValues, TName>,
  | 'label'
  | 'placeholder'
  | 'decimalScale'
  | 'fixedDecimalScale'
  | 'decimalSeparator'
  | 'thousandSeparator'
  | 'allowNegative'
> & {
  label?: string;
  placeholder?: string;
};

export function PriceField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({ label = 'Preço de venda', placeholder = '0,00', ...props }: PriceFieldProps<TFieldValues, TName>) {
  return (
    <NumberField<TFieldValues, TName>
      label={label}
      placeholder={placeholder}
      decimalScale={2}
      fixedDecimalScale
      decimalSeparator=","
      thousandSeparator="."
      allowNegative={false}
      {...props}
    />
  );
}
