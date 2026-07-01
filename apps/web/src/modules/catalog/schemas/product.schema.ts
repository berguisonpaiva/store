import type { ProductDTO } from '../data/types';
import { centsToInput } from '../data/price';

/**
 * Form value shapes + inline validation rules for the product form. The project
 * does not use Zod (consistent with `web-auth`); validation is expressed as
 * React Hook Form rules. Price is edited as a decimal string and converted to
 * integer cents at submit time; the backend remains the source of truth.
 */

export type AttributeRow = { key: string; value: string };

export type VariationFormValues = {
  /** Present when editing an existing variation (drives add vs. update). */
  id?: string;
  sku: string;
  barcode: string;
  attributes: AttributeRow[];
  price: string; // decimal string, e.g. "5.90"
  minStock: string; // integer string
  active: boolean;
};

export type ProductFormValues = {
  name: string;
  description: string;
  categoryId: string; // '' = no category
  variations: VariationFormValues[];
};

export const PRODUCT_NAME_RULES = {
  required: 'Informe o nome do produto.',
  minLength: { value: 2, message: 'O nome deve ter ao menos 2 caracteres.' },
} as const;

export const SKU_RULES = {
  required: 'Informe o SKU.',
} as const;

export function validatePrice(value: string): true | string {
  const n = Number(String(value).replace(',', '.'));
  if (!Number.isFinite(n) || n <= 0) return 'O preço deve ser maior que zero.';
  return true;
}

export function validateMinStock(value: string): true | string {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 0)
    return 'O estoque mínimo deve ser um inteiro ≥ 0.';
  return true;
}

export function emptyVariation(): VariationFormValues {
  return {
    sku: '',
    barcode: '',
    attributes: [],
    price: '',
    minStock: '0',
    active: true,
  };
}

export function productFormDefaults(): ProductFormValues {
  return {
    name: '',
    description: '',
    categoryId: '',
    variations: [emptyVariation()],
  };
}

/** Builds form values from an existing product (edit mode). */
export function productToFormValues(product: ProductDTO): ProductFormValues {
  return {
    name: product.name,
    description: product.description ?? '',
    categoryId: product.categoryId ?? '',
    variations: product.variations.map((variation) => ({
      id: variation.id,
      sku: variation.sku,
      barcode: variation.barcode ?? '',
      attributes: Object.entries(variation.attributes).map(([key, value]) => ({
        key,
        value,
      })),
      price: centsToInput(variation.price),
      minStock: String(variation.minStock),
      active: variation.active,
    })),
  };
}
