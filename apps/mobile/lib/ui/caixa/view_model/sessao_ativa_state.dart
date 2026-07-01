import 'package:equatable/equatable.dart';

import '../../../domain/caixa/entities/movimentacao_caixa_entity.dart';
import '../../../domain/caixa/entities/resumo_sessao_entity.dart';

enum SessaoAtivaStatus { idle, loading, loaded, error }

/// Status of an in-flight sangria/suprimento submission.
enum CashOpStatus { idle, submitting, success, failure }

class SessaoAtivaState extends Equatable {
  const SessaoAtivaState({
    this.status = SessaoAtivaStatus.idle,
    this.resumo,
    this.movimentacoes = const [],
    this.errorCode,
    this.opStatus = CashOpStatus.idle,
    this.opErrorCode,
  });

  final SessaoAtivaStatus status;
  final ResumoSessaoEntity? resumo;
  final List<MovimentacaoCaixaEntity> movimentacoes;
  final String? errorCode;

  /// Sangria/suprimento submission lifecycle.
  final CashOpStatus opStatus;
  final String? opErrorCode;

  bool get isLoading => status == SessaoAtivaStatus.loading;
  bool get isSubmittingOp => opStatus == CashOpStatus.submitting;

  SessaoAtivaState copyWith({
    SessaoAtivaStatus? status,
    ResumoSessaoEntity? resumo,
    List<MovimentacaoCaixaEntity>? movimentacoes,
    String? errorCode,
    CashOpStatus? opStatus,
    String? opErrorCode,
  }) => SessaoAtivaState(
    status: status ?? this.status,
    resumo: resumo ?? this.resumo,
    movimentacoes: movimentacoes ?? this.movimentacoes,
    errorCode: errorCode ?? this.errorCode,
    opStatus: opStatus ?? this.opStatus,
    opErrorCode: opErrorCode ?? this.opErrorCode,
  );

  @override
  List<Object?> get props => [
    status,
    resumo,
    movimentacoes,
    errorCode,
    opStatus,
    opErrorCode,
  ];
}
