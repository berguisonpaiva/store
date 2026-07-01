import '../dtos/category_dto.dart';
import '../dtos/product_dto.dart';
import '../dtos/products_page_dto.dart';
import '../dtos/variation_lookup_dto.dart';

/// Remote calls against the backend catalog endpoints. Throws technical
/// `AppException`s; the repository converts them into failures.
abstract interface class CatalogRemoteDataSource {
  Future<ProductsPageDto> listProducts({
    required int page,
    required int pageSize,
    String? name,
    String? categoryId,
    bool? active,
  });

  Future<ProductDto> getProduct(String id);

  Future<VariationLookupDto> findVariationBySku(String sku);

  Future<VariationLookupDto> findVariationByBarcode(String barcode);

  Future<List<CategoryDto>> listCategories({bool? active});
}
