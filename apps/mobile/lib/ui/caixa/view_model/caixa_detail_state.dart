import 'package:equatable/equatable.dart';

import '../../../domain/caixa/entities/movimentacao_caixa_entity.dart';
import '../../../domain/caixa/entities/resumo_sessao_entity.dart';
import '../../../domain/caixa/entities/sessao_caixa_entity.dart';

enum CaixaDetailStatus { idle, loading, loaded, error }

/// State for the read-only detail of a single cash session from the history:
/// session data, aggregated resumo and movements.
class CaixaDetailState extends Equatable {
  const CaixaDetailState({
    this.status = CaixaDetailStatus.idle,
    this.sessao,
    this.resumo,
    this.movimentacoes = const [],
    this.errorCode,
  });

  final CaixaDetailStatus status;
  final SessaoCaixaEntity? sessao;
  final ResumoSessaoEntity? resumo;
  final List<MovimentacaoCaixaEntity> movimentacoes;
  final String? errorCode;

  bool get isLoading => status == CaixaDetailStatus.loading;

  CaixaDetailState copyWith({
    CaixaDetailStatus? status,
    SessaoCaixaEntity? sessao,
    ResumoSessaoEntity? resumo,
    List<MovimentacaoCaixaEntity>? movimentacoes,
    String? errorCode,
  }) => CaixaDetailState(
    status: status ?? this.status,
    sessao: sessao ?? this.sessao,
    resumo: resumo ?? this.resumo,
    movimentacoes: movimentacoes ?? this.movimentacoes,
    errorCode: errorCode ?? this.errorCode,
  );

  @override
  List<Object?> get props => [
    status,
    sessao,
    resumo,
    movimentacoes,
    errorCode,
  ];
}
