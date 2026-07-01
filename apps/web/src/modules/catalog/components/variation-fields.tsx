'use client';

import {
  useFieldArray,
  type Control,
  type UseFormRegister,
  type FieldErrors,
} from 'react-hook-form';
import { Plus, Power, PowerOff, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { FormErrorMessage } from '@/components/ui/form-error-message';
import {
  SKU_RULES,
  validateMinStock,
  validatePrice,
  type ProductFormValues,
} from '../schemas/product.schema';

type VariationFieldsProps = {
  index: number;
  control: Control<ProductFormValues>;
  register: UseFormRegister<ProductFormValues>;
  errors: FieldErrors<ProductFormValues>;
  isExisting: boolean;
  active: boolean;
  canRemove: boolean;
  onRemove: () => void;
  onToggleActive?: () => void;
  disabled?: boolean;
};

/**
 * One variation row of the product form. Owns a nested `attributes` field array
 * (repeatable key/value). SKU/price/minStock are validated inline; uniqueness is
 * decided by the backend and surfaced here when a per-variation save fails.
 */
export function VariationFields({
  index,
  control,
  register,
  errors,
  isExisting,
  active,
  canRemove,
  onRemove,
  onToggleActive,
  disabled,
}: VariationFieldsProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `variations.${index}.attributes`,
  });

  const variationErrors = errors.variations?.[index];

  return (
    <Card className="gap-4 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">Variação {index + 1}</span>
          {isExisting ? (
            <Badge variant={active ? 'default' : 'secondary'}>
              {active ? 'Ativa' : 'Inativa'}
            </Badge>
          ) : (
            <Badge variant="outline">Nova</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isExisting && onToggleActive ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled}
              onClick={onToggleActive}
            >
              {active ? (
                <PowerOff className="size-4" />
              ) : (
                <Power className="size-4" />
              )}
              {active ? 'Desativar' : 'Ativar'}
            </Button>
          ) : null}
          {canRemove && !isExisting ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled}
              onClick={onRemove}
              aria-label="Remover variação"
            >
              <Trash2 className="size-4" />
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label>SKU</Label>
          <Input
            {...register(`variations.${index}.sku`, SKU_RULES)}
            aria-invalid={!!variationErrors?.sku}
            placeholder="COCA-350"
          />
          {variationErrors?.sku && (
            <FormErrorMessage className="mt-1.5">
              {variationErrors.sku.message}
            </FormErrorMessage>
          )}
        </div>
        <div>
          <Label>Código de barras (opcional)</Label>
          <Input
            {...register(`variations.${index}.barcode`)}
            aria-invalid={!!variationErrors?.barcode}
            placeholder="7894900011517"
          />
          {variationErrors?.barcode && (
            <FormErrorMessage className="mt-1.5">
              {variationErrors.barcode.message}
            </FormErrorMessage>
          )}
        </div>
        <div>
          <Label>Preço (R$)</Label>
          <Input
            {...register(`variations.${index}.price`, {
              validate: validatePrice,
            })}
            inputMode="decimal"
            aria-invalid={!!variationErrors?.price}
            placeholder="5.90"
          />
          {variationErrors?.price && (
            <FormErrorMessage className="mt-1.5">
              {variationErrors.price.message}
            </FormErrorMessage>
          )}
        </div>
        <div>
          <Label>Estoque mínimo</Label>
          <Input
            {...register(`variations.${index}.minStock`, {
              validate: validateMinStock,
            })}
            inputMode="numeric"
            aria-invalid={!!variationErrors?.minStock}
            placeholder="0"
          />
          {variationErrors?.minStock && (
            <FormErrorMessage className="mt-1.5">
              {variationErrors.minStock.message}
            </FormErrorMessage>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Atributos</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={() => append({ key: '', value: '' })}
          >
            <Plus className="size-4" />
            Atributo
          </Button>
        </div>
        {fields.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Sem atributos. Ex.: tamanho, cor.
          </p>
        ) : (
          <div className="space-y-2">
            {fields.map((field, attrIndex) => (
              <div key={field.id} className="flex items-center gap-2">
                <Input
                  placeholder="chave"
                  {...register(
                    `variations.${index}.attributes.${attrIndex}.key`,
                  )}
                />
                <Input
                  placeholder="valor"
                  {...register(
                    `variations.${index}.attributes.${attrIndex}.value`,
                  )}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={disabled}
                  onClick={() => remove(attrIndex)}
                  aria-label="Remover atributo"
                >
                  <X className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
