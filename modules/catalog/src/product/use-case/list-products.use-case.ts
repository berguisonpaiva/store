import { PaginatedResultDTO, Result, UseCase } from '@repo/shared'
import { ListProductsFilterDTO, ProductListItemDTO } from '../dto/product.dto'
import { ProductsQuery } from '../provider'

/// Lists products with pagination, free-text name search and category/status
/// filters (read side, RF-CAT-08).
export class ListProducts
  implements UseCase<ListProductsFilterDTO, PaginatedResultDTO<ProductListItemDTO>>
{
  constructor(private readonly productsQuery: ProductsQuery) {}

  async execute(
    input: ListProductsFilterDTO,
  ): Promise<Result<PaginatedResultDTO<ProductListItemDTO>>> {
    return this.productsQuery.list(input)
  }
}
