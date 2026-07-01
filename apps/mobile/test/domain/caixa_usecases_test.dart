import 'package:flutter_test/flutter_test.dart';
import 'package:fpdart/fpdart.dart';
import 'package:mobile/domain/caixa/entities/cash_session_status.dart';
import 'package:mobile/domain/caixa/entities/movimentacao_caixa_entity.dart';
import 'package:mobile/domain/caixa/entities/cash_movement_type.dart';
import 'package:mobile/domain/caixa/entities/resumo_sessao_entity.dart';
import 'package:mobile/domain/caixa/entities/sessao_caixa_entity.dart';
import 'package:mobile/domain/caixa/errors/caixa_failure.dart';
import 'package:mobile/domain/caixa/repositories/caixa_repository.dart';
import 'package:mobile/domain/caixa/usecases/abrir_caixa_usecase.dart';
import 'package:mobile/domain/caixa/usecases/fechar_caixa_usecase.dart';
import 'package:mobile/domain/caixa/usecases/listar_movimentacoes_usecase.dart';
import 'package:mobile/domain/caixa/usecases/obter_caixa_aberto_usecase.dart';
import 'package:mobile/domain/caixa/usecases/obter_resumo_sessao_usecase.dart';
import 'package:mobile/domain/caixa/usecases/registrar_sangria_usecase.dart';
import 'package:mobile/domain/caixa/usecases/registrar_suprimento_usecase.dart';

/// In-memory fake implementing the domain contract.
class _FakeCaixaRepository implements CaixaRepository {
  Either<CaixaFailure, SessaoCaixaEntity> abrirResult = right(_session);
  Either<CaixaFailure, SessaoCaixaEntity> fecharResult = right(_session);
  Either<CaixaFailure, MovimentacaoCaixaEntity> sangriaResult = right(_movement);
  Either<CaixaFailure, MovimentacaoCaixaEntity> suprimentoResult =
      right(_movement);
  Either<CaixaFailure, SessaoCaixaEntity?> abertoResult = right(_session);
  Either<CaixaFailure, ResumoSessaoEntity> resumoResult = right(_resumo);
  Either<CaixaFailure, List<MovimentacaoCaixaEntity>> movimentacoesResult =
      right([_movement]);

  int? lastValorAberturaCents;
  int? lastValorFechamentoCents;
  String? lastObservacao;

  @override
  Future<Either<CaixaFailure, SessaoCaixaEntity>> abrir({
    required int valorAberturaCents,
  }) async {
    lastValorAberturaCents = valorAberturaCents;
    return abrirResult;
  }

  @override
  Future<Either<CaixaFailure, SessaoCaixaEntity>> fechar({
    required String sessaoId,
    required int valorFechamentoCents,
  }) async {
    lastValorFechamentoCents = valorFechamentoCents;
    return fecharResult;
  }

  @override
  Future<Either<CaixaFailure, MovimentacaoCaixaEntity>> registrarSangria({
    required String sessaoId,
    required int valorCents,
    required String observacao,
  }) async {
    lastObservacao = observacao;
    return sangriaResult;
  }

  @override
  Future<Either<CaixaFailure, MovimentacaoCaixaEntity>> registrarSuprimento({
    required String sessaoId,
    required int valorCents,
    required String observacao,
  }) async {
    lastObservacao = observacao;
    return suprimentoResult;
  }

  @override
  Future<Either<CaixaFailure, SessaoCaixaEntity?>> obterCaixaAberto() async =>
      abertoResult;

  @override
  Future<Either<CaixaFailure, ResumoSessaoEntity>> obterResumo(
    String sessaoId,
  ) async => resumoResult;

  @override
  Future<Either<CaixaFailure, List<MovimentacaoCaixaEntity>>>
  listarMovimentacoes(String sessaoId) async => movimentacoesResult;
}

final _session = SessaoCaixaEntity(
  id: 's1',
  status: CashSessionStatus.aberto,
  valorAberturaCents: 10000,
  abertaEm: DateTime(2026, 6, 29, 8),
);

final _movement = MovimentacaoCaixaEntity(
  id: 'm1',
  tipo: CashMovementType.suprimento,
  valorCents: 5000,
  criadaEm: DateTime(2026, 6, 29),
);

final _resumo = const ResumoSessaoEntity(
  aberturaCents: 10000,
  suprimentosCents: 5000,
  vendasDinheiroCents: 20000,
  sangriasCents: 3000,
  esperadoCents: 32000,
);

void main() {
  late _FakeCaixaRepository repo;

  setUp(() => repo = _FakeCaixaRepository());

  group('AbrirCaixaUseCase', () {
    test('forwards a valid opening amount', () async {
      final result = await AbrirCaixaUseCase(repo)(valorAberturaCents: 10000);
      expect(result.isRight(), isTrue);
      expect(repo.lastValorAberturaCents, 10000);
    });

    test('rejects a negative opening amount without hitting the repo', () async {
      final result = await AbrirCaixaUseCase(repo)(valorAberturaCents: -1);
      expect(result.getLeft().toNullable(), isA<InvalidCashAmountFailure>());
      expect(repo.lastValorAberturaCents, isNull);
    });

    test('propagates an already-open failure', () async {
      repo.abrirResult = left(const CashSessionAlreadyOpenFailure());
      final result = await AbrirCaixaUseCase(repo)(valorAberturaCents: 0);
      expect(result.getLeft().toNullable(), isA<CashSessionAlreadyOpenFailure>());
    });
  });

  group('FecharCaixaUseCase', () {
    test('rejects a negative counted amount', () async {
      final result = await FecharCaixaUseCase(repo)(
        sessaoId: 's1',
        valorFechamentoCents: -5,
      );
      expect(result.getLeft().toNullable(), isA<InvalidCashAmountFailure>());
      expect(repo.lastValorFechamentoCents, isNull);
    });

    test('propagates a pending-sale failure', () async {
      repo.fecharResult = left(const PendingSaleInSessionFailure());
      final result = await FecharCaixaUseCase(repo)(
        sessaoId: 's1',
        valorFechamentoCents: 32000,
      );
      expect(result.getLeft().toNullable(), isA<PendingSaleInSessionFailure>());
    });

    test('propagates an already-closed failure', () async {
      repo.fecharResult = left(const CashSessionAlreadyClosedFailure());
      final result = await FecharCaixaUseCase(repo)(
        sessaoId: 's1',
        valorFechamentoCents: 100,
      );
      expect(
        result.getLeft().toNullable(),
        isA<CashSessionAlreadyClosedFailure>(),
      );
    });
  });

  group('RegistrarSangriaUseCase', () {
    test('rejects a non-positive amount', () async {
      final result = await RegistrarSangriaUseCase(repo)(
        sessaoId: 's1',
        valorCents: 0,
        observacao: 'troco',
      );
      expect(result.getLeft().toNullable(), isA<InvalidCashAmountFailure>());
    });

    test('rejects an empty observation', () async {
      final result = await RegistrarSangriaUseCase(repo)(
        sessaoId: 's1',
        valorCents: 500,
        observacao: '   ',
      );
      expect(result.getLeft().toNullable(), isA<InvalidCashAmountFailure>());
    });

    test('trims the observation and forwards a valid sangria', () async {
      final result = await RegistrarSangriaUseCase(repo)(
        sessaoId: 's1',
        valorCents: 500,
        observacao: '  cofre  ',
      );
      expect(result.isRight(), isTrue);
      expect(repo.lastObservacao, 'cofre');
    });
  });

  group('RegistrarSuprimentoUseCase', () {
    test('rejects a non-positive amount', () async {
      final result = await RegistrarSuprimentoUseCase(repo)(
        sessaoId: 's1',
        valorCents: -1,
        observacao: 'reforço',
      );
      expect(result.getLeft().toNullable(), isA<InvalidCashAmountFailure>());
    });

    test('forwards a valid suprimento', () async {
      final result = await RegistrarSuprimentoUseCase(repo)(
        sessaoId: 's1',
        valorCents: 1000,
        observacao: 'reforço',
      );
      expect(result.isRight(), isTrue);
    });
  });

  group('ObterCaixaAbertoUseCase', () {
    test('returns the open session', () async {
      final result = await ObterCaixaAbertoUseCase(repo)();
      expect(result.getRight().toNullable(), isNotNull);
    });

    test('returns null when there is no open session', () async {
      repo.abertoResult = right(null);
      final result = await ObterCaixaAbertoUseCase(repo)();
      expect(result.getRight().toNullable(), isNull);
    });

    test('maps a not-found failure', () async {
      repo.abertoResult = left(const CashSessionNotFoundFailure());
      final result = await ObterCaixaAbertoUseCase(repo)();
      expect(result.getLeft().toNullable(), isA<CashSessionNotFoundFailure>());
    });
  });

  group('ObterResumoSessaoUseCase / ListarMovimentacoesUseCase', () {
    test('resumo returns expected totals', () async {
      final result = await ObterResumoSessaoUseCase(repo)('s1');
      expect(result.getRight().toNullable()!.esperadoCents, 32000);
    });

    test('movimentacoes returns the list', () async {
      final result = await ListarMovimentacoesUseCase(repo)('s1');
      expect(result.getRight().toNullable()!.length, 1);
    });
  });
}
