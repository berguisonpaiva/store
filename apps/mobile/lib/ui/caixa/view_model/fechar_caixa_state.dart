import 'package:equatable/equatable.dart';

import '../../../domain/caixa/entities/sessao_caixa_entity.dart';

enum FecharCaixaStatus {
  idle,
  submitting,
  success,
  failure,

  /// The API rejected the close with `VENDA_PENDENTE_NO_FECHAMENTO`: an open
  /// sale blocks the closing and the session stays open. Dedicated state so
  /// the UI can point the operator to the pending sale.
  pendingSale,
}

class FecharCaixaState extends Equatable {
  const FecharCaixaState({
    required this.esperadoCents,
    this.contadoCents,
    this.status = FecharCaixaStatus.idle,
    this.session,
    this.errorCode,
  });

  /// Expected drawer amount, provided by the session summary.
  final int esperadoCents;

  /// Counted amount typed by the operator (null until entered).
  final int? contadoCents;

  final FecharCaixaStatus status;
  final SessaoCaixaEntity? session;
  final String? errorCode;

  bool get isSubmitting => status == FecharCaixaStatus.submitting;
  bool get isBlockedByPendingSale => status == FecharCaixaStatus.pendingSale;

  /// `contado - esperado`. Null while no valid counted amount is entered.
  int? get divergenciaCents =>
      contadoCents == null ? null : contadoCents! - esperadoCents;

  FecharCaixaState copyWith({
    int? esperadoCents,
    int? contadoCents,
    bool resetContado = false,
    FecharCaixaStatus? status,
    SessaoCaixaEntity? session,
    String? errorCode,
  }) => FecharCaixaState(
    esperadoCents: esperadoCents ?? this.esperadoCents,
    contadoCents: resetContado ? null : (contadoCents ?? this.contadoCents),
    status: status ?? this.status,
    session: session ?? this.session,
    errorCode: errorCode ?? this.errorCode,
  );

  @override
  List<Object?> get props => [
    esperadoCents,
    contadoCents,
    status,
    session,
    errorCode,
  ];
}
