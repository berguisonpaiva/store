@Tags(['live'])
library;

import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/network/http_client.dart';
import 'package:mobile/core/network/http_client_impl.dart';
import 'package:mobile/data/catalog/datasources/catalog_remote_data_source_impl.dart';
import 'package:mobile/data/catalog/repositories/catalog_repository_impl.dart';
import 'package:mobile/domain/catalog/errors/catalog_failure.dart';
import 'package:mobile/domain/catalog/repositories/catalog_repository.dart';

/// Live integration test: runs the REAL catalog data layer (HttpClientImpl →
/// CatalogRemoteDataSourceImpl → CatalogRepositoryImpl) against a backend on
/// localhost:4000. Skips gracefully when the backend is offline.
const _baseUrl = 'http://localhost:4000';
const _email = 'admin@store.local';
const _password = 'Admin!123';

void main() {
  late HttpClient http;
  late CatalogRepository repository;
  String? token;

  setUpAll(() async {
    http = HttpClientImpl(baseUrl: _baseUrl);
    try {
      final res = await http.post(
        '/api/auth/login',
        body: {'email': _email, 'password': _password},
      );
      token = (res.data as Map<String, dynamic>)['accessToken'] as String?;
      if (token != null) http.setAuthToken(token);
    } catch (_) {
      token = null;
    }
    repository = CatalogRepositoryImpl(CatalogRemoteDataSourceImpl(http));
  });

  test('listProducts returns a paginated page from the backend', () async {
    if (token == null) return markTestSkipped('backend offline');
    final result = await repository.listProducts(pageSize: 5);
    final page = result.getRight().toNullable();
    expect(page, isNotNull, reason: result.toString());
    expect(page!.total, greaterThanOrEqualTo(0));
  });

  test('getProduct + findVariationBySku resolve a real variation', () async {
    if (token == null) return markTestSkipped('backend offline');

    final products = (await repository.listProducts(pageSize: 1))
        .getRight()
        .toNullable()!;
    if (products.items.isEmpty) return markTestSkipped('no products seeded');

    final detail =
        (await repository.getProduct(products.items.first.id))
            .getRight()
            .toNullable()!;
    expect(detail.variations, isNotEmpty);

    final sku = detail.variations.first.sku;
    final lookup =
        (await repository.findVariationBySku(sku)).getRight().toNullable()!;
    expect(lookup.variation.sku, sku);
    expect(lookup.productName, isNotEmpty);
  });

  test('findVariationBySku maps a real 404 to VariationNotFoundFailure', () async {
    if (token == null) return markTestSkipped('backend offline');
    final result = await repository.findVariationBySku('__DOES_NOT_EXIST__');
    expect(result.getLeft().toNullable(), isA<VariationNotFoundFailure>());
  });

  test('listCategories returns categories from the backend', () async {
    if (token == null) return markTestSkipped('backend offline');
    final result = await repository.listCategories();
    expect(result.getRight().toNullable(), isNotNull);
  });
}
