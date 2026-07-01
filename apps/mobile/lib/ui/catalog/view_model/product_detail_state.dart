import 'package:equatable/equatable.dart';

import '../../../domain/catalog/entities/product_entity.dart';

enum ProductDetailStatus { idle, loading, loaded, notFound, error }

class ProductDetailState extends Equatable {
  const ProductDetailState({
    this.status = ProductDetailStatus.idle,
    this.product,
    this.errorCode,
  });

  final ProductDetailStatus status;
  final ProductEntity? product;
  final String? errorCode;

  bool get isLoading => status == ProductDetailStatus.loading;

  @override
  List<Object?> get props => [status, product, errorCode];
}
