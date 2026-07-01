import { PaginatedInputDTO } from '@repo/shared'
import { AttributeMap, Product, Variation } from '../model'

/// Public projection of a single variation (price in cents).
export type VariationDTO = {
  id: string
  sku: string
  barcode: string | null
  attributes: AttributeMap
  price: number
  minStock: number
  active: boolean
}

/// Public projection of a product with its variations. Never leaks the entity
/// or ORM rows.
export type ProductDTO = {
  id: string
  name: string
  description: string | null
  categoryId: string | null
  active: boolean
  variations: VariationDTO[]
  createdAt: Date
  updatedAt: Date
}

/// Lighter projection used for paginated listings (variation count instead of
/// the full nested list).
export type ProductListItemDTO = {
  id: string
  name: string
  categoryId: string | null
  active: boolean
  variationCount: number
  createdAt: Date
  updatedAt: Date
}

/// Variation projection for the PDV scan flow — the variation plus enough
/// product context to add it to a sale.
export type VariationLookupDTO = {
  productId: string
  productName: string
  productActive: boolean
  variation: VariationDTO
}

export type CreateVariationInputDTO = {
  sku: string
  barcode?: string | null
  attributes?: AttributeMap
  price: number
  minStock?: number
  active?: boolean
}

export type CreateProductInputDTO = {
  name: string
  description?: string | null
  categoryId?: string | null
  active?: boolean
  variations: CreateVariationInputDTO[]
}

export type UpdateProductInputDTO = {
  id: string
  name?: string
  description?: string | null
  categoryId?: string | null
}

export type AddVariationInputDTO = {
  productId: string
} & CreateVariationInputDTO

export type UpdateVariationInputDTO = {
  productId: string
  variationId: string
  sku?: string
  barcode?: string | null
  attributes?: AttributeMap
  price?: number
  minStock?: number
}

export type SetProductActiveInputDTO = {
  id: string
}

export type SetVariationActiveInputDTO = {
  productId: string
  variationId: string
}

export type FindProductByIdInputDTO = {
  id: string
}

export type FindVariationBySkuInputDTO = {
  sku: string
}

export type FindVariationByBarcodeInputDTO = {
  barcode: string
}

export type ListProductsFilterDTO = PaginatedInputDTO & {
  name?: string
  categoryId?: string
  active?: boolean
}

export function toVariationDTO(variation: Variation): VariationDTO {
  return {
    id: variation.id,
    sku: variation.sku,
    barcode: variation.barcode,
    attributes: variation.attributes,
    price: variation.price,
    minStock: variation.minStock,
    active: variation.active,
  }
}

export function toProductDTO(product: Product): ProductDTO {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    categoryId: product.categoryId,
    active: product.active,
    variations: product.variations.map(toVariationDTO),
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  }
}

export function toProductListItemDTO(product: Product): ProductListItemDTO {
  return {
    id: product.id,
    name: product.name,
    categoryId: product.categoryId,
    active: product.active,
    variationCount: product.variations.length,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  }
}

export function toVariationLookupDTO(product: Product, variation: Variation): VariationLookupDTO {
  return {
    productId: product.id,
    productName: product.name,
    productActive: product.active,
    variation: toVariationDTO(variation),
  }
}
