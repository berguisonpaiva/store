import 'package:equatable/equatable.dart';

import '../../../domain/caixa/entities/sessao_caixa_entity.dart';

enum AbrirCaixaStatus {
  idle,

  /// Pre-checking whether the operator already has an open session.
  checking,

  /// A session is already `ABERTA`: the form is blocked and the UI offers
  /// navigation to the active session instead of submitting.
  blocked,
  submitting,
  success,
  failure,
}

class AbrirCaixaState extends Equatable {
  const AbrirCaixaState({
    this.status = AbrirCaixaStatus.idle,
    this.session,
    this.activeSession,
    this.errorCode,
  });

  final AbrirCaixaStatus status;
  final SessaoCaixaEntity? session;

  /// The already-open session found by the preventive check.
  final SessaoCaixaEntity? activeSession;
  final String? errorCode;

  bool get isSubmitting => status == AbrirCaixaStatus.submitting;
  bool get isChecking => status == AbrirCaixaStatus.checking;
  bool get isBlocked => status == AbrirCaixaStatus.blocked;

  @override
  List<Object?> get props => [status, session, activeSession, errorCode];
}
