import 'package:bloc_test/bloc_test.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:fpdart/fpdart.dart';
import 'package:mobile/domain/catalog/entities/product_summary_entity.dart';
import 'package:mobile/domain/catalog/entities/products_page_entity.dart';
import 'package:mobile/domain/catalog/errors/catalog_failure.dart';
import 'package:mobile/domain/catalog/usecases/list_categories_usecase.dart';
import 'package:mobile/domain/catalog/usecases/list_products_usecase.dart';
import 'package:mobile/ui/catalog/view_model/products_cubit.dart';
import 'package:mobile/ui/catalog/view_model/products_state.dart';
import 'package:mocktail/mocktail.dart';

class _MockListProducts extends Mock implements ListProductsUseCase {}

class _MockListCategories extends Mock implements ListCategoriesUseCase {}

ProductsPageEntity _page(int page, int totalPages, List<String> ids) =>
    ProductsPageEntity(
      items: [
        for (final id in ids)
          ProductSummaryEntity(
            id: id,
            name: 'P$id',
            categoryId: null,
            active: true,
            variationCount: 1,
          ),
      ],
      page: page,
      pageSize: 20,
      total: 99,
      totalPages: totalPages,
    );

void main() {
  late _MockListProducts listProducts;
  late _MockListCategories listCategories;

  setUp(() {
    listProducts = _MockListProducts();
    listCategories = _MockListCategories();
    when(() => listCategories(active: any(named: 'active')))
        .thenAnswer((_) async => right(const []));
  });

  ProductsCubit build() =>
      ProductsCubit(listProducts: listProducts, listCategories: listCategories);

  void stubByPage() {
    when(
      () => listProducts(
        page: any(named: 'page'),
        pageSize: any(named: 'pageSize'),
        name: any(named: 'name'),
        categoryId: any(named: 'categoryId'),
        active: any(named: 'active'),
      ),
    ).thenAnswer((invocation) async {
      final page = invocation.namedArguments[const Symbol('page')] as int;
      return right(
        page == 1 ? _page(1, 2, ['1', '2']) : _page(2, 2, ['3', '4']),
      );
    });
  }

  blocTest<ProductsCubit, ProductsState>(
    'init loads the first page and reports hasMore',
    setUp: stubByPage,
    build: build,
    act: (cubit) => cubit.init(),
    verify: (cubit) {
      expect(cubit.state.status, ProductsStatus.loaded);
      expect(cubit.state.items.length, 2);
      expect(cubit.state.hasMore, isTrue);
    },
  );

  blocTest<ProductsCubit, ProductsState>(
    'loadMore appends the next page',
    setUp: stubByPage,
    build: build,
    act: (cubit) async {
      await cubit.init();
      await cubit.loadMore();
    },
    verify: (cubit) {
      expect(cubit.state.items.map((p) => p.id), ['1', '2', '3', '4']);
      expect(cubit.state.page, 2);
      expect(cubit.state.hasMore, isFalse);
    },
  );

  blocTest<ProductsCubit, ProductsState>(
    'search forwards the term to the use case',
    setUp: () => when(
      () => listProducts(
        page: any(named: 'page'),
        pageSize: any(named: 'pageSize'),
        name: any(named: 'name'),
        categoryId: any(named: 'categoryId'),
        active: any(named: 'active'),
      ),
    ).thenAnswer((_) async => right(_page(1, 1, ['1']))),
    build: build,
    act: (cubit) async {
      await cubit.init();
      await cubit.search('shirt');
    },
    verify: (_) {
      verify(
        () => listProducts(
          page: any(named: 'page'),
          pageSize: any(named: 'pageSize'),
          name: 'shirt',
          categoryId: any(named: 'categoryId'),
          active: any(named: 'active'),
        ),
      ).called(1);
    },
  );

  blocTest<ProductsCubit, ProductsState>(
    'a failure sets the error status',
    setUp: () => when(
      () => listProducts(
        page: any(named: 'page'),
        pageSize: any(named: 'pageSize'),
        name: any(named: 'name'),
        categoryId: any(named: 'categoryId'),
        active: any(named: 'active'),
      ),
    ).thenAnswer((_) async => left(const CatalogNetworkFailure())),
    build: build,
    act: (cubit) => cubit.init(),
    verify: (cubit) => expect(cubit.state.status, ProductsStatus.error),
  );
}
