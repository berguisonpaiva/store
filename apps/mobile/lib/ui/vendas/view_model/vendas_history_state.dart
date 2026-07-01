import 'package:equatable/equatable.dart';

import '../../../domain/vendas/entities/status_venda.dart';
import '../../../domain/vendas/entities/venda_entity.dart';

enum VendasHistoryStatus { idle, loading, loaded, error }

/// State for the operator's own sales-history list. The backend auto-scopes
/// `GET /vendas` to the caller (RN03), so no `usuarioId` filter is sent.
class VendasHistoryState extends Equatable {
  const VendasHistoryState({
    this.status = VendasHistoryStatus.idle,
    this.vendas = const [],
    this.filtroStatus,
    this.errorCode,
  });

  final VendasHistoryStatus status;
  final List<VendaEntity> vendas;

  /// Optional status filter; `null` means "all".
  final StatusVenda? filtroStatus;
  final String? errorCode;

  bool get isLoading => status == VendasHistoryStatus.loading;
  bool get isEmpty =>
      status == VendasHistoryStatus.loaded && vendas.isEmpty;

  VendasHistoryState copyWith({
    VendasHistoryStatus? status,
    List<VendaEntity>? vendas,
    StatusVenda? filtroStatus,
    bool clearFiltroStatus = false,
    String? errorCode,
  }) => VendasHistoryState(
    status: status ?? this.status,
    vendas: vendas ?? this.vendas,
    filtroStatus: clearFiltroStatus ? null : (filtroStatus ?? this.filtroStatus),
    errorCode: errorCode,
  );

  @override
  List<Object?> get props => [status, vendas, filtroStatus, errorCode];
}
