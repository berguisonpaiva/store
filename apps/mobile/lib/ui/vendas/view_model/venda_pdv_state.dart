import 'package:equatable/equatable.dart';

import '../../../domain/vendas/entities/venda_entity.dart';

/// Top-level status of the PDV screen.
enum VendaPdvStatus {
  /// Resolving / creating the sale.
  loading,

  /// A sale is active and editable (ABERTA) or read-only (CONCLUIDA/CANCELADA).
  loaded,

  /// The operator has no open cash session — selling is blocked.
  noOpenCashSession,

  /// The sale could not be loaded/created for another reason.
  error,
}

/// Status of an in-flight sale operation (add/remove/discount/finalize/cancel).
enum VendaOpStatus { idle, submitting, success, failure }

class VendaPdvState extends Equatable {
  const VendaPdvState({
    this.status = VendaPdvStatus.loading,
    this.venda,
    this.errorCode,
    this.opStatus = VendaOpStatus.idle,
    this.opErrorCode,
  });

  final VendaPdvStatus status;
  final VendaEntity? venda;
  final String? errorCode;

  /// Lifecycle of the most recent mutating operation.
  final VendaOpStatus opStatus;
  final String? opErrorCode;

  bool get isLoading => status == VendaPdvStatus.loading;
  bool get isSubmitting => opStatus == VendaOpStatus.submitting;

  /// True when there is a finalized/cancelled sale that must render read-only.
  bool get isReadOnly => venda?.isReadOnly ?? false;

  int get subtotalCents => venda?.subtotalCents ?? 0;
  int get descontoCents => venda?.descontoCents ?? 0;
  int get totalCents => venda?.totalCents ?? 0;

  VendaPdvState copyWith({
    VendaPdvStatus? status,
    VendaEntity? venda,
    String? errorCode,
    VendaOpStatus? opStatus,
    String? opErrorCode,
  }) => VendaPdvState(
    status: status ?? this.status,
    venda: venda ?? this.venda,
    errorCode: errorCode ?? this.errorCode,
    opStatus: opStatus ?? this.opStatus,
    opErrorCode: opErrorCode ?? this.opErrorCode,
  );

  @override
  List<Object?> get props => [
    status,
    venda,
    errorCode,
    opStatus,
    opErrorCode,
  ];
}
