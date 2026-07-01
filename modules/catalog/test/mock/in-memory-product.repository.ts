import { PaginatedResultDTO, Result, TransactionContext } from '@repo/shared'
import {
  ListProductsFilterDTO,
  Product,
  ProductListItemDTO,
  ProductsQuery,
  ProductsRepository,
  toProductListItemDTO,
} from '../../src/product'

/// Reference in-memory implementation used by use-case tests. Implements both
/// the command (`ProductsRepository`) and read (`ProductsQuery`) ports.
export class InMemoryProductRepository implements ProductsRepository, ProductsQuery {
  readonly items = new Map<string, Product>()

  async create(entity: Product, _tx?: TransactionContext): Promise<Result<void>> {
    this.items.set(entity.id, entity)
    return Result.ok()
  }

  async update(entity: Product, _tx?: TransactionContext): Promise<Result<void>> {
    this.items.set(entity.id, entity)
    return Result.ok()
  }

  async findById(id: string): Promise<Result<Product>> {
    const entity = this.items.get(id)
    if (!entity) {
      return Result.fail('ENTITY_NOT_FOUND')
    }
    return Result.ok(entity)
  }

  async findBySku(sku: string): Promise<Result<Product | null>> {
    const normalized = sku.trim().toUpperCase()
    const found = [...this.items.values()].find((product) =>
      product.variations.some((variation) => variation.sku === normalized),
    )
    return Result.ok(found ?? null)
  }

  async findByBarcode(barcode: string): Promise<Result<Product | null>> {
    const normalized = barcode.trim()
    const found = [...this.items.values()].find((product) =>
      product.variations.some((variation) => variation.barcode === normalized),
    )
    return Result.ok(found ?? null)
  }

  async list(
    filter: ListProductsFilterDTO,
  ): Promise<Result<PaginatedResultDTO<ProductListItemDTO>>> {
    let rows = [...this.items.values()]

    if (filter.name) {
      const term = filter.name.trim().toLowerCase()
      rows = rows.filter((product) => product.name.toLowerCase().includes(term))
    }
    if (filter.categoryId !== undefined) {
      rows = rows.filter((product) => product.categoryId === filter.categoryId)
    }
    if (filter.active !== undefined) {
      rows = rows.filter((product) => product.active === filter.active)
    }

    const total = rows.length
    const page = filter.page
    const pageSize = filter.pageSize
    const start = (page - 1) * pageSize
    const data = rows.slice(start, start + pageSize).map(toProductListItemDTO)

    return Result.ok({
      data,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    })
  }
}
