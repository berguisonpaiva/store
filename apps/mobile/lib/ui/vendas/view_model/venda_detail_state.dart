import 'package:equatable/equatable.dart';

import '../../../domain/vendas/entities/venda_entity.dart';

enum VendaDetailStatus { idle, loading, loaded, error }

/// State for the read-only detail of a single sale from the history.
class VendaDetailState extends Equatable {
  const VendaDetailState({
    this.status = VendaDetailStatus.idle,
    this.venda,
    this.errorCode,
  });

  final VendaDetailStatus status;
  final VendaEntity? venda;
  final String? errorCode;

  bool get isLoading => status == VendaDetailStatus.loading;

  @override
  List<Object?> get props => [status, venda, errorCode];
}
