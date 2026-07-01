import 'package:bloc/bloc.dart';

import '../../../domain/catalog/usecases/list_categories_usecase.dart';
import '../../../domain/catalog/usecases/list_products_usecase.dart';
import 'products_state.dart';

/// Drives the products list. Owns the query state (name, category, status,
/// page) and exposes search/filter/loadMore. No Flutter imports.
class ProductsCubit extends Cubit<ProductsState> {
  ProductsCubit({
    required ListProductsUseCase listProducts,
    required ListCategoriesUseCase listCategories,
  }) : _listProducts = listProducts,
       _listCategories = listCategories,
       super(const ProductsState());

  final ListProductsUseCase _listProducts;
  final ListCategoriesUseCase _listCategories;

  static const _pageSize = 20;

  /// Loads the category options then the first page of products.
  Future<void> init() async {
    await _loadCategories();
    await _loadFirstPage();
  }

  Future<void> _loadCategories() async {
    final result = await _listCategories(active: true);
    result.match(
      (_) {},
      (categories) => emit(state.copyWith(categories: categories)),
    );
  }

  Future<void> search(String name) {
    emit(state.copyWith(name: name));
    return _loadFirstPage();
  }

  Future<void> filterCategory(String? categoryId) {
    emit(
      state.copyWith(
        categoryId: categoryId,
        clearCategoryId: categoryId == null,
      ),
    );
    return _loadFirstPage();
  }

  Future<void> filterActive(bool? active) {
    emit(state.copyWith(active: active, clearActive: active == null));
    return _loadFirstPage();
  }

  Future<void> refresh() => _loadFirstPage();

  Future<void> _loadFirstPage() async {
    emit(state.copyWith(status: ProductsStatus.loading));
    final result = await _listProducts(
      page: 1,
      pageSize: _pageSize,
      name: state.name,
      categoryId: state.categoryId,
      active: state.active,
    );
    result.match(
      (failure) => emit(
        state.copyWith(status: ProductsStatus.error, errorCode: failure.code),
      ),
      (page) => emit(
        state.copyWith(
          status: ProductsStatus.loaded,
          items: page.items,
          page: page.page,
          totalPages: page.totalPages,
          total: page.total,
        ),
      ),
    );
  }

  /// Appends the next page when scrolling near the end.
  Future<void> loadMore() async {
    if (state.isLoadingMore ||
        !state.hasMore ||
        state.status != ProductsStatus.loaded) {
      return;
    }
    emit(state.copyWith(isLoadingMore: true));
    final result = await _listProducts(
      page: state.page + 1,
      pageSize: _pageSize,
      name: state.name,
      categoryId: state.categoryId,
      active: state.active,
    );
    result.match(
      (failure) => emit(
        state.copyWith(isLoadingMore: false, errorCode: failure.code),
      ),
      (page) => emit(
        state.copyWith(
          isLoadingMore: false,
          items: [...state.items, ...page.items],
          page: page.page,
          totalPages: page.totalPages,
          total: page.total,
        ),
      ),
    );
  }
}
