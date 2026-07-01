import { Result, UseCase } from '@repo/shared'
import {
  FindVariationByBarcodeInputDTO,
  VariationLookupDTO,
  toVariationLookupDTO,
} from '../dto/product.dto'
import { ProductError } from '../errors'
import { Barcode } from '../model'
import { ProductsRepository } from '../provider'

/// Retrieves a variation by exact barcode, returning it with its product
/// context for the PDV scan flow (RF-CAT-07). Returns `VARIATION_NOT_FOUND`
/// when no variation matches.
export class FindVariationByBarcode
  implements UseCase<FindVariationByBarcodeInputDTO, VariationLookupDTO>
{
  constructor(private readonly productsRepository: ProductsRepository) {}

  async execute(input: FindVariationByBarcodeInputDTO): Promise<Result<VariationLookupDTO>> {
    const barcode = Barcode.tryCreate(input.barcode)
    if (barcode.isFailure) return Result.fail(ProductError.VARIATION_NOT_FOUND)

    const found = await this.productsRepository.findByBarcode(barcode.instance.value)
    if (found.isFailure) return found.withFail
    if (!found.instance) return Result.fail(ProductError.VARIATION_NOT_FOUND)

    const product = found.instance
    const variation = product.variations.find((v) => v.barcode === barcode.instance.value)
    if (!variation) return Result.fail(ProductError.VARIATION_NOT_FOUND)

    return Result.ok(toVariationLookupDTO(product, variation))
  }
}
