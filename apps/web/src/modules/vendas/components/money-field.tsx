'use client';

import { type Control, Controller, type FieldValues, type Path } from 'react-hook-form';
import { NumericFormat } from 'react-number-format';
import { FormErrorMessage } from '@/components/ui/form-error-message';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type MoneyFieldProps<T extends FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  label: string;
  id: string;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
};

/**
 * Controlled BRL money input (reais). Stores the data value (`floatValue`) in
 * the form — not the formatted string — so the Zod schema validates a
 * `z.number()`. The data layer converts reais → cents at the action boundary.
 */
export function MoneyField<T extends FieldValues>({
  control,
  name,
  label,
  id,
  error,
  disabled,
  placeholder = 'R$ 0,00',
}: MoneyFieldProps<T>) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <NumericFormat
            id={id}
            getInputRef={field.ref}
            customInput={Input}
            thousandSeparator="."
            decimalSeparator=","
            decimalScale={2}
            fixedDecimalScale
            allowNegative={false}
            prefix="R$ "
            placeholder={placeholder}
            disabled={disabled}
            value={field.value ?? ''}
            onValueChange={(values) => field.onChange(values.floatValue ?? 0)}
            onBlur={field.onBlur}
            aria-invalid={!!error}
          />
        )}
      />
      {error ? <FormErrorMessage className="mt-1.5">{error}</FormErrorMessage> : null}
    </div>
  );
}
