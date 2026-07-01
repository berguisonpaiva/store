/**
 * Catalog DTOs as returned by the backend (`catalog-backend`). Prices are
 * always integer cents. The web app never invents business rules — these are
 * read/echo shapes only.
 */

export type AttributeMap = Record<string, string>;

export type VariationDTO = {
  id: string;
  sku: string;
  barcode: string | null;
  attributes: AttributeMap;
  price: number; // integer cents
  minStock: number;
  active: boolean;
};

export type ProductDTO = {
  id: string;
  name: string;
  description: string | null;
  categoryId: string | null;
  active: boolean;
  variations: VariationDTO[];
  createdAt: string;
  updatedAt: string;
};

export type ProductListItemDTO = {
  id: string;
  name: string;
  categoryId: string | null;
  active: boolean;
  variationCount: number;
  createdAt: string;
  updatedAt: string;
};

export type VariationLookupDTO = {
  productId: string;
  productName: string;
  productActive: boolean;
  variation: VariationDTO;
};

export type CategoryDTO = {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PaginationMetaDTO = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type PaginatedResultDTO<T> = {
  data: T[];
  meta: PaginationMetaDTO;
};

/** Parsed filters for the product list (mirrors the `nuqs` URL state). */
export type ListProductsParams = {
  page: number;
  pageSize: number;
  name?: string;
  categoryId?: string;
  active?: boolean;
};
