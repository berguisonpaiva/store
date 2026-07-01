import 'package:equatable/equatable.dart';

import '../../../domain/caixa/entities/sessao_caixa_entity.dart';

enum AbrirCaixaStatus { idle, submitting, success, failure }

class AbrirCaixaState extends Equatable {
  const AbrirCaixaState({
    this.status = AbrirCaixaStatus.idle,
    this.session,
    this.errorCode,
  });

  final AbrirCaixaStatus status;
  final SessaoCaixaEntity? session;
  final String? errorCode;

  bool get isSubmitting => status == AbrirCaixaStatus.submitting;

  @override
  List<Object?> get props => [status, session, errorCode];
}
