import 'package:fpdart/fpdart.dart';

import '../../../core/errors/app_exception.dart';
import '../../../domain/caixa/entities/movimentacao_caixa_entity.dart';
import '../../../domain/caixa/entities/resumo_sessao_entity.dart';
import '../../../domain/caixa/entities/sessao_caixa_entity.dart';
import '../../../domain/caixa/errors/caixa_failure.dart';
import '../../../domain/caixa/repositories/caixa_repository.dart';
import '../datasources/caixa_remote_data_source.dart';
import '../datasources/cash_session_exception.dart';
import '../dtos/cash_money.dart';

/// Default [CaixaRepository]. Delegates to the remote data source and converts
/// technical exceptions at the boundary into domain [CaixaFailure]s, mapping the
/// backend's stable error code to the matching failure.
class CaixaRepositoryImpl implements CaixaRepository {
  const CaixaRepositoryImpl(this._remote);

  final CaixaRemoteDataSource _remote;

  @override
  Future<Either<CaixaFailure, SessaoCaixaEntity>> abrir({
    required int valorAberturaCents,
  }) => _guard(() async {
    final dto = await _remote.abrir(
      valorAbertura: CashMoney.centsToReais(valorAberturaCents),
    );
    return dto.toEntity();
  });

  @override
  Future<Either<CaixaFailure, SessaoCaixaEntity>> fechar({
    required String sessaoId,
    required int valorFechamentoCents,
  }) => _guard(() async {
    final dto = await _remote.fechar(
      sessaoId: sessaoId,
      valorFechamento: CashMoney.centsToReais(valorFechamentoCents),
    );
    return dto.toEntity();
  });

  @override
  Future<Either<CaixaFailure, MovimentacaoCaixaEntity>> registrarSangria({
    required String sessaoId,
    required int valorCents,
    required String observacao,
  }) => _guard(() async {
    final dto = await _remote.sangria(
      sessaoId: sessaoId,
      valor: CashMoney.centsToReais(valorCents),
      observacao: observacao,
    );
    return dto.toEntity();
  });

  @override
  Future<Either<CaixaFailure, MovimentacaoCaixaEntity>> registrarSuprimento({
    required String sessaoId,
    required int valorCents,
    required String observacao,
  }) => _guard(() async {
    final dto = await _remote.suprimento(
      sessaoId: sessaoId,
      valor: CashMoney.centsToReais(valorCents),
      observacao: observacao,
    );
    return dto.toEntity();
  });

  @override
  Future<Either<CaixaFailure, SessaoCaixaEntity?>> obterCaixaAberto() =>
      _guard(() async {
        final dto = await _remote.getAberto();
        return dto?.toEntity();
      });

  @override
  Future<Either<CaixaFailure, ResumoSessaoEntity>> obterResumo(
    String sessaoId,
  ) => _guard(() async {
    final dto = await _remote.getResumo(sessaoId);
    return dto.toEntity();
  });

  @override
  Future<Either<CaixaFailure, List<MovimentacaoCaixaEntity>>>
  listarMovimentacoes(String sessaoId) => _guard(() async {
    final dtos = await _remote.listMovimentacoes(sessaoId);
    return dtos.map((e) => e.toEntity()).toList();
  });

  /// Runs [run], converting any cash/technical exception into a failure.
  Future<Either<CaixaFailure, T>> _guard<T>(Future<T> Function() run) async {
    try {
      return right(await run());
    } on CashSessionException catch (e) {
      return left(_toFailure(e));
    } on AppException {
      return left(const CaixaNetworkFailure());
    }
  }

  CaixaFailure _toFailure(CashSessionException e) {
    return switch (e.code) {
      'CASH_SESSION_ALREADY_OPEN' => const CashSessionAlreadyOpenFailure(),
      'CASH_SESSION_NOT_FOUND' => const CashSessionNotFoundFailure(),
      'CASH_SESSION_ALREADY_CLOSED' => const CashSessionAlreadyClosedFailure(),
      'PENDING_SALE_IN_SESSION' => const PendingSaleInSessionFailure(),
      _ => _fallbackByStatus(e.statusCode),
    };
  }

  CaixaFailure _fallbackByStatus(int? status) => switch (status) {
    404 => const CashSessionNotFoundFailure(),
    _ => const CaixaNetworkFailure(),
  };
}
