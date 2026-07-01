'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Combobox } from '@/components/ui/combobox';
import { FormErrorMessage } from '@/components/ui/form-error-message';
import { PageSectionHeader } from '@/components/ui/page-section-header';
import { VariationFields } from './variation-fields';
import {
  createProduct,
  setVariationActive,
  updateProduct,
  updateVariation,
  addVariation,
  type VariationInput,
} from '../data/product.actions';
import {
  BARCODE_FIELD_CODE,
  messageForCode,
  SKU_FIELD_CODE,
} from '../data/error-messages';
import { toCents } from '../data/price';
import {
  emptyVariation,
  productFormDefaults,
  productToFormValues,
  PRODUCT_NAME_RULES,
  type ProductFormValues,
  type VariationFormValues,
} from '../schemas/product.schema';
import type { CategoryDTO, ProductDTO } from '../data/types';

type ProductFormProps = {
  product?: ProductDTO;
  categories: CategoryDTO[];
  /** When rendered inside a dialog: hide the page header and, on success, call
   * `onSuccess` (close the dialog) instead of navigating. */
  embedded?: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
};

const NO_CATEGORY = 'none';

function buildVariationInput(values: VariationFormValues): VariationInput {
  const attributes: Record<string, string> = {};
  for (const row of values.attributes) {
    const key = row.key.trim();
    if (key) attributes[key] = row.value.trim();
  }
  return {
    sku: values.sku.trim(),
    barcode: values.barcode.trim() ? values.barcode.trim() : null,
    attributes,
    price: toCents(Number(values.price.replace(',', '.'))),
    minStock: Number(values.minStock),
    active: values.active,
  };
}

export function ProductForm({
  product,
  categories,
  embedded = false,
  onSuccess,
  onCancel,
}: ProductFormProps) {
  const router = useRouter();
  const isEdit = !!product;
  const [submitting, setSubmitting] = useState(false);

  function finishSuccess(message: string): void {
    toast.success(message);
    if (onSuccess) onSuccess();
    else router.push('/products');
  }

  const {
    register,
    control,
    handleSubmit,
    setValue,
    setError,
    formState: { errors },
  } = useForm<ProductFormValues>({
    defaultValues: product
      ? productToFormValues(product)
      : productFormDefaults(),
  });

  // keyName defaults to `id`, which would clobber the variation's domain id —
  // use a distinct key so `field.id` stays the backend variation id.
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'variations',
    keyName: 'fieldId',
  });

  const categoryOptions = [
    { label: 'Sem categoria', value: NO_CATEGORY },
    ...categories.map((category) => ({
      label: category.name,
      value: category.id,
    })),
  ];

  async function onCreate(values: ProductFormValues): Promise<void> {
    const result = await createProduct({
      name: values.name.trim(),
      description: values.description.trim() || null,
      categoryId: values.categoryId || null,
      variations: values.variations.map(buildVariationInput),
    });
    if (result.ok) {
      finishSuccess('Produto criado.');
      return;
    }
    // On bulk create a duplicate SKU/barcode is not attributable to a row.
    toast.error(messageForCode(result.code));
  }

  async function onEdit(values: ProductFormValues): Promise<void> {
    const id = product!.id;
    const profile = await updateProduct(id, {
      name: values.name.trim(),
      description: values.description.trim() || null,
      categoryId: values.categoryId || null,
    });
    if (!profile.ok) {
      toast.error(messageForCode(profile.code));
      return;
    }

    for (let index = 0; index < values.variations.length; index += 1) {
      const variation = values.variations[index];
      const input = buildVariationInput(variation);
      const saved = variation.id
        ? await updateVariation(id, variation.id, input)
        : await addVariation(id, input);

      if (!saved.ok) {
        if (saved.code === SKU_FIELD_CODE) {
          setError(`variations.${index}.sku`, {
            message: messageForCode(saved.code),
          });
        } else if (saved.code === BARCODE_FIELD_CODE) {
          setError(`variations.${index}.barcode`, {
            message: messageForCode(saved.code),
          });
        }
        toast.error(messageForCode(saved.code));
        return;
      }
    }

    finishSuccess('Produto atualizado.');
  }

  const onSubmit = handleSubmit(async (values) => {
    setSubmitting(true);
    try {
      if (isEdit) await onEdit(values);
      else await onCreate(values);
    } finally {
      setSubmitting(false);
    }
  });

  async function onToggleVariationActive(
    index: number,
    variationId: string,
    nextActive: boolean,
  ): Promise<void> {
    const result = await setVariationActive(
      product!.id,
      variationId,
      nextActive,
    );
    if (result.ok) {
      setValue(`variations.${index}.active`, nextActive);
      toast.success(nextActive ? 'Variação ativada.' : 'Variação desativada.');
    } else {
      toast.error(messageForCode(result.code));
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6" noValidate>
      {!embedded && (
        <PageSectionHeader
          title={isEdit ? 'Editar produto' : 'Novo produto'}
          subtitle="Defina os dados do produto e ao menos uma variação."
          aside={
            <Button asChild variant="ghost" size="sm">
              <Link href="/products">
                <ArrowLeft className="size-4" />
                Voltar
              </Link>
            </Button>
          }
        />
      )}

      <Card className="gap-4 p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              {...register('name', PRODUCT_NAME_RULES)}
              aria-invalid={!!errors.name}
              placeholder="Coca-Cola"
            />
            {errors.name && (
              <FormErrorMessage className="mt-1.5">
                {errors.name.message}
              </FormErrorMessage>
            )}
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Detalhes do produto"
            />
          </div>

          <div>
            <Label>Categoria (opcional)</Label>
            <Controller
              control={control}
              name="categoryId"
              render={({ field }) => (
                <Combobox
                  options={categoryOptions}
                  value={field.value ? field.value : NO_CATEGORY}
                  onChange={(value) =>
                    field.onChange(value === NO_CATEGORY ? '' : value)
                  }
                  placeholder="Selecionar categoria"
                />
              )}
            />
          </div>
        </div>
      </Card>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Variações</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append(emptyVariation())}
          >
            <Plus className="size-4" />
            Adicionar variação
          </Button>
        </div>

        {fields.map((field, index) => (
          <VariationFields
            key={field.fieldId}
            index={index}
            control={control}
            register={register}
            errors={errors}
            isExisting={!!field.id}
            active={field.active}
            canRemove={fields.length > 1}
            onRemove={() => remove(index)}
            onToggleActive={
              field.id
                ? () =>
                    onToggleVariationActive(
                      index,
                      field.id as string,
                      !field.active,
                    )
                : undefined
            }
            disabled={submitting}
          />
        ))}
      </div>

      <div className="flex justify-end gap-2">
        {embedded ? (
          <Button
            type="button"
            variant="ghost"
            disabled={submitting}
            onClick={onCancel}
          >
            Cancelar
          </Button>
        ) : (
          <Button asChild variant="ghost">
            <Link href="/products">Cancelar</Link>
          </Button>
        )}
        <Button type="submit" disabled={submitting}>
          <Save className="size-4" />
          {submitting ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>
    </form>
  );
}
