import 'package:equatable/equatable.dart';

import '../../../domain/caixa/entities/cash_session_status.dart';
import '../../../domain/caixa/entities/sessao_caixa_entity.dart';

enum CaixaHistoryStatus { idle, loading, loaded, error }

/// State for the operator's own cash-session history list. The backend scopes
/// `GET /caixa/minhas` to the caller (RN03).
class CaixaHistoryState extends Equatable {
  const CaixaHistoryState({
    this.status = CaixaHistoryStatus.idle,
    this.sessoes = const [],
    this.filtroStatus,
    this.errorCode,
  });

  final CaixaHistoryStatus status;
  final List<SessaoCaixaEntity> sessoes;

  /// Optional status filter; `null` means "all".
  final CashSessionStatus? filtroStatus;
  final String? errorCode;

  bool get isLoading => status == CaixaHistoryStatus.loading;
  bool get isEmpty => status == CaixaHistoryStatus.loaded && sessoes.isEmpty;

  CaixaHistoryState copyWith({
    CaixaHistoryStatus? status,
    List<SessaoCaixaEntity>? sessoes,
    CashSessionStatus? filtroStatus,
    bool clearFiltroStatus = false,
    String? errorCode,
  }) => CaixaHistoryState(
    status: status ?? this.status,
    sessoes: sessoes ?? this.sessoes,
    filtroStatus: clearFiltroStatus
        ? null
        : (filtroStatus ?? this.filtroStatus),
    errorCode: errorCode,
  );

  @override
  List<Object?> get props => [status, sessoes, filtroStatus, errorCode];
}
