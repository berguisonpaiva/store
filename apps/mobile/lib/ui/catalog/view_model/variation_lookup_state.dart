import 'package:equatable/equatable.dart';

import '../../../domain/catalog/entities/variation_lookup_entity.dart';

enum VariationLookupStatus { idle, loading, loaded, notFound, error }

class VariationLookupState extends Equatable {
  const VariationLookupState({
    this.status = VariationLookupStatus.idle,
    this.result,
    this.errorCode,
  });

  final VariationLookupStatus status;
  final VariationLookupEntity? result;
  final String? errorCode;

  bool get isLoading => status == VariationLookupStatus.loading;

  @override
  List<Object?> get props => [status, result, errorCode];
}
