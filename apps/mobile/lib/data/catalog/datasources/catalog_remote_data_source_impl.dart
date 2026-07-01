import '../../../core/errors/app_exception.dart';
import '../../../core/network/http_client.dart';
import '../dtos/category_dto.dart';
import '../dtos/product_dto.dart';
import '../dtos/products_page_dto.dart';
import '../dtos/variation_lookup_dto.dart';
import 'catalog_remote_data_source.dart';

/// Talks to the backend catalog endpoints via [HttpClient] (bearer + 401
/// refresh handled by the shared transport).
class CatalogRemoteDataSourceImpl implements CatalogRemoteDataSource {
  const CatalogRemoteDataSourceImpl(this._http);

  final HttpClient _http;

  @override
  Future<ProductsPageDto> listProducts({
    required int page,
    required int pageSize,
    String? name,
    String? categoryId,
    bool? active,
  }) async {
    final res = await _http.get(
      '/api/products',
      query: {
        'page': page,
        'pageSize': pageSize,
        if (name != null && name.trim().isNotEmpty) 'name': name.trim(),
        if (categoryId != null && categoryId.isNotEmpty)
          'categoryId': categoryId,
        'active': ?active,
      },
    );
    try {
      return ProductsPageDto.fromJson(res.data as Map<String, dynamic>);
    } catch (e) {
      throw SerializationException('Invalid products payload', cause: e);
    }
  }

  @override
  Future<ProductDto> getProduct(String id) async {
    final res = await _http.get('/api/products/$id');
    try {
      return ProductDto.fromJson(res.data as Map<String, dynamic>);
    } catch (e) {
      throw SerializationException('Invalid product payload', cause: e);
    }
  }

  @override
  Future<VariationLookupDto> findVariationBySku(String sku) async {
    final res = await _http.get('/api/variations/by-sku/${Uri.encodeComponent(sku)}');
    try {
      return VariationLookupDto.fromJson(res.data as Map<String, dynamic>);
    } catch (e) {
      throw SerializationException('Invalid variation payload', cause: e);
    }
  }

  @override
  Future<VariationLookupDto> findVariationByBarcode(String barcode) async {
    final res = await _http
        .get('/api/variations/by-barcode/${Uri.encodeComponent(barcode)}');
    try {
      return VariationLookupDto.fromJson(res.data as Map<String, dynamic>);
    } catch (e) {
      throw SerializationException('Invalid variation payload', cause: e);
    }
  }

  @override
  Future<List<CategoryDto>> listCategories({bool? active}) async {
    final res = await _http.get(
      '/api/categories',
      query: {'active': ?active},
    );
    try {
      return (res.data as List<dynamic>)
          .map((e) => CategoryDto.fromJson(e as Map<String, dynamic>))
          .toList();
    } catch (e) {
      throw SerializationException('Invalid categories payload', cause: e);
    }
  }
}
