import { PaginatedResultDTO, Result } from '@repo/shared'
import { ListProductsFilterDTO, ProductListItemDTO } from '../dto/product.dto'

/// CQRS read port: paginated/filtered product projection for listing. Kept
/// separate from the command-side `ProductsRepository`.
export interface ProductsQuery {
  list(filter: ListProductsFilterDTO): Promise<Result<PaginatedResultDTO<ProductListItemDTO>>>
}
