import '../../errors/failure.dart';

/// Business failures for the catalog context.
sealed class CatalogFailure extends Failure {
  const CatalogFailure(super.code, {super.message});
}

/// The referenced product does not exist (HTTP 404).
class ProductNotFoundFailure extends CatalogFailure {
  const ProductNotFoundFailure({String? message})
    : super('catalog.product_not_found', message: message);
}

/// No variation matched the given SKU/barcode (HTTP 404).
class VariationNotFoundFailure extends CatalogFailure {
  const VariationNotFoundFailure({String? message})
    : super('catalog.variation_not_found', message: message);
}

/// A network/transport problem prevented the catalog operation.
class CatalogNetworkFailure extends CatalogFailure {
  const CatalogNetworkFailure({String? message})
    : super('catalog.network', message: message);
}
