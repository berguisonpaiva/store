import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:fpdart/fpdart.dart';
import 'package:mobile/app/di/injector.dart';
import 'package:mobile/domain/catalog/entities/product_summary_entity.dart';
import 'package:mobile/domain/catalog/entities/products_page_entity.dart';
import 'package:mobile/domain/catalog/usecases/list_categories_usecase.dart';
import 'package:mobile/domain/catalog/usecases/list_products_usecase.dart';
import 'package:mobile/l10n/app_localizations.dart';
import 'package:mobile/ui/catalog/products_page.dart';
import 'package:mobile/ui/catalog/view_model/products_cubit.dart';
import 'package:mobile/ui/catalog/widgets/product_tile.dart';
import 'package:mocktail/mocktail.dart';

class _MockListProducts extends Mock implements ListProductsUseCase {}

class _MockListCategories extends Mock implements ListCategoriesUseCase {}

ProductsPageEntity _page(List<String> names) => ProductsPageEntity(
  items: [
    for (final name in names)
      ProductSummaryEntity(
        id: name,
        name: name,
        categoryId: null,
        active: true,
        variationCount: 1,
      ),
  ],
  page: 1,
  pageSize: 20,
  total: names.length,
  totalPages: 1,
);

Widget _app() => const MaterialApp(
  locale: Locale('en'),
  localizationsDelegates: AppLocalizations.localizationsDelegates,
  supportedLocales: AppLocalizations.supportedLocales,
  home: ProductsPage(),
);

void main() {
  late _MockListProducts listProducts;
  late _MockListCategories listCategories;

  setUp(() {
    listProducts = _MockListProducts();
    listCategories = _MockListCategories();
    when(() => listCategories(active: any(named: 'active')))
        .thenAnswer((_) async => right(const []));
    getIt.registerFactory(
      () => ProductsCubit(
        listProducts: listProducts,
        listCategories: listCategories,
      ),
    );
  });

  tearDown(() => getIt.reset());

  void stubProducts(ProductsPageEntity result) {
    when(
      () => listProducts(
        page: any(named: 'page'),
        pageSize: any(named: 'pageSize'),
        name: any(named: 'name'),
        categoryId: any(named: 'categoryId'),
        active: any(named: 'active'),
      ),
    ).thenAnswer((_) async => right(result));
  }

  testWidgets('renders the loaded products', (tester) async {
    stubProducts(_page(['Shirt', 'Pants']));

    await tester.pumpWidget(_app());
    await tester.pumpAndSettle();

    expect(find.byType(ProductTile), findsNWidgets(2));
    expect(find.text('Shirt'), findsOneWidget);
  });

  testWidgets('submitting the search forwards the term', (tester) async {
    stubProducts(_page(['Shirt']));

    await tester.pumpWidget(_app());
    await tester.pumpAndSettle();

    await tester.enterText(find.byType(TextField), 'pants');
    await tester.testTextInput.receiveAction(TextInputAction.search);
    await tester.pumpAndSettle();

    verify(
      () => listProducts(
        page: any(named: 'page'),
        pageSize: any(named: 'pageSize'),
        name: 'pants',
        categoryId: any(named: 'categoryId'),
        active: any(named: 'active'),
      ),
    ).called(1);
  });
}
