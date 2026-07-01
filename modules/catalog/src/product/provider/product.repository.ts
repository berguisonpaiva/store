import {
  CreateRepository,
  FindByIdRepository,
  Result,
  UpdateRepository,
} from '@repo/shared'
import { Product } from '../model'

/// Persistence contract for the `Product` aggregate. Composed from the shared
/// create/update/findById ports (deliberately NOT `CrudRepository`, which would
/// mandate `delete` — catalog never deletes, only deactivates). The extra reads
/// (`findBySku`, `findByBarcode`) only *feed* the uniqueness specifications and
/// PDV lookups; the rules themselves live in the domain.
export interface ProductsRepository
  extends CreateRepository<Product>,
    UpdateRepository<Product>,
    FindByIdRepository<Product> {
  /// Returns the product owning a variation with the given SKU, or `ok(null)`.
  findBySku(sku: string): Promise<Result<Product | null>>

  /// Returns the product owning a variation with the given barcode, or
  /// `ok(null)`.
  findByBarcode(barcode: string): Promise<Result<Product | null>>
}
