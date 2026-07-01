import 'package:bloc/bloc.dart';

import '../../../domain/catalog/errors/catalog_failure.dart';
import '../../../domain/catalog/usecases/get_product_usecase.dart';
import 'product_detail_state.dart';

/// Loads a single product with its variations for the detail screen.
class ProductDetailCubit extends Cubit<ProductDetailState> {
  ProductDetailCubit({required GetProductUseCase getProduct})
    : _getProduct = getProduct,
      super(const ProductDetailState());

  final GetProductUseCase _getProduct;

  Future<void> load(String productId) async {
    emit(const ProductDetailState(status: ProductDetailStatus.loading));
    final result = await _getProduct(productId);
    result.match(
      (failure) => emit(
        ProductDetailState(
          status: failure is ProductNotFoundFailure
              ? ProductDetailStatus.notFound
              : ProductDetailStatus.error,
          errorCode: failure.code,
        ),
      ),
      (product) => emit(
        ProductDetailState(
          status: ProductDetailStatus.loaded,
          product: product,
        ),
      ),
    );
  }
}
