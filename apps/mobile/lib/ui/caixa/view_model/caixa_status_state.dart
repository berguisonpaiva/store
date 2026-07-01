import 'package:equatable/equatable.dart';

import '../../../domain/caixa/entities/sessao_caixa_entity.dart';

enum CaixaStatusValue { idle, loading, noSession, sessionOpen, error }

class CaixaStatusState extends Equatable {
  const CaixaStatusState({
    this.status = CaixaStatusValue.idle,
    this.session,
    this.errorCode,
  });

  final CaixaStatusValue status;
  final SessaoCaixaEntity? session;
  final String? errorCode;

  bool get isLoading => status == CaixaStatusValue.loading;

  @override
  List<Object?> get props => [status, session, errorCode];
}
