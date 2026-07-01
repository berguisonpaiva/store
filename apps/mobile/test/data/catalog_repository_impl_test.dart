import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/errors/app_exception.dart';
import 'package:mobile/data/catalog/datasources/catalog_remote_data_source.dart';
import 'package:mobile/data/catalog/dtos/category_dto.dart';
import 'package:mobile/data/catalog/dtos/product_dto.dart';
import 'package:mobile/data/catalog/dtos/products_page_dto.dart';
import 'package:mobile/data/catalog/dtos/variation_lookup_dto.dart';
import 'package:mobile/data/catalog/repositories/catalog_repository_impl.dart';
import 'package:mobile/domain/catalog/errors/catalog_failure.dart';
import 'package:mocktail/mocktail.dart';

class _MockRemote extends Mock implements CatalogRemoteDataSource {}

void main() {
  late _MockRemote remote;
  late CatalogRepositoryImpl repository;

  setUp(() {
    remote = _MockRemote();
    repository = CatalogRepositoryImpl(remote);
  });

  group('listProducts', () {
    test('maps the paginated payload to entities', () async {
      when(
        () => remote.listProducts(
          page: any(named: 'page'),
          pageSize: any(named: 'pageSize'),
          name: any(named: 'name'),
          categoryId: any(named: 'categoryId'),
          active: any(named: 'active'),
        ),
      ).thenAnswer(
        (_) async => ProductsPageDto.fromJson(const {
          'data': [
            {
              'id': 'p1',
              'name': 'Shirt',
              'categoryId': 'c1',
              'active': true,
              'variationCount': 2,
            },
          ],
          'meta': {'page': 1, 'pageSize': 20, 'total': 1, 'totalPages': 1},
        }),
      );

      final result = await repository.listProducts();

      final page = result.getRight().toNullable()!;
      expect(page.total, 1);
      expect(page.items.single.name, 'Shirt');
      expect(page.items.single.variationCount, 2);
    });
  });

  group('getProduct', () {
    test('maps a product with its variations (price in cents)', () async {
      when(() => remote.getProduct(any())).thenAnswer(
        (_) async => ProductDto.fromJson(const {
          'id': 'p1',
          'name': 'Shirt',
          'description': 'Nice shirt',
          'categoryId': 'c1',
          'active': true,
          'variations': [
            {
              'id': 'v1',
              'sku': 'SH-1',
              'barcode': '789',
              'attributes': {'size': 'M'},
              'price': 1990,
              'minStock': 3,
              'active': true,
            },
          ],
        }),
      );

      final result = await repository.getProduct('p1');

      final product = result.getRight().toNullable()!;
      expect(product.variations.single.sku, 'SH-1');
      expect(product.variations.single.priceCents, 1990);
    });

    test('404 → ProductNotFoundFailure', () async {
      when(() => remote.getProduct(any())).thenThrow(
        const NetworkException('not found', statusCode: 404),
      );

      final result = await repository.getProduct('missing');

      expect(result.getLeft().toNullable(), isA<ProductNotFoundFailure>());
    });
  });

  group('findVariationBySku', () {
    test('maps the lookup payload', () async {
      when(() => remote.findVariationBySku(any())).thenAnswer(
        (_) async => VariationLookupDto.fromJson(const {
          'productId': 'p1',
          'productName': 'Shirt',
          'productActive': true,
          'variation': {
            'id': 'v1',
            'sku': 'SH-1',
            'barcode': null,
            'attributes': <String, dynamic>{},
            'price': 1990,
            'minStock': 3,
            'active': true,
          },
        }),
      );

      final result = await repository.findVariationBySku('SH-1');

      final lookup = result.getRight().toNullable()!;
      expect(lookup.productName, 'Shirt');
      expect(lookup.variation.sku, 'SH-1');
    });

    test('404 → VariationNotFoundFailure', () async {
      when(() => remote.findVariationBySku(any())).thenThrow(
        const NetworkException('not found', statusCode: 404),
      );

      final result = await repository.findVariationBySku('nope');

      expect(result.getLeft().toNullable(), isA<VariationNotFoundFailure>());
    });

    test('non-404 → CatalogNetworkFailure', () async {
      when(() => remote.findVariationBySku(any())).thenThrow(
        const NetworkException('boom', statusCode: 500),
      );

      final result = await repository.findVariationBySku('x');

      expect(result.getLeft().toNullable(), isA<CatalogNetworkFailure>());
    });
  });

  group('listCategories', () {
    test('maps the list of categories', () async {
      when(() => remote.listCategories(active: any(named: 'active'))).thenAnswer(
        (_) async => [
          CategoryDto.fromJson(const {
            'id': 'c1',
            'name': 'Shirts',
            'active': true,
          }),
        ],
      );

      final result = await repository.listCategories();

      expect(result.getRight().toNullable()!.single.name, 'Shirts');
    });
  });
}
