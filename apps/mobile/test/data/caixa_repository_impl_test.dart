import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/errors/app_exception.dart';
import 'package:mobile/data/caixa/datasources/caixa_remote_data_source.dart';
import 'package:mobile/data/caixa/datasources/cash_session_exception.dart';
import 'package:mobile/data/caixa/dtos/movimentacao_caixa_dto.dart';
import 'package:mobile/data/caixa/dtos/resumo_sessao_dto.dart';
import 'package:mobile/data/caixa/dtos/sessao_caixa_dto.dart';
import 'package:mobile/data/caixa/repositories/caixa_repository_impl.dart';
import 'package:mobile/domain/caixa/entities/cash_movement_type.dart';
import 'package:mobile/domain/caixa/entities/cash_session_status.dart';
import 'package:mobile/domain/caixa/errors/caixa_failure.dart';
import 'package:mobile/domain/caixa/repositories/caixa_repository.dart';
import 'package:mocktail/mocktail.dart';

class _MockRemote extends Mock implements CaixaRemoteDataSource {}

void main() {
  late _MockRemote remote;
  late CaixaRepositoryImpl repository;

  setUp(() {
    remote = _MockRemote();
    repository = CaixaRepositoryImpl(remote);
  });

  group('DTO ↔ entity mapping (reais → cents)', () {
    test('session DTO maps reais to cents and parses status', () async {
      when(() => remote.abrir(valorAbertura: any(named: 'valorAbertura')))
          .thenAnswer(
        (_) async => SessaoCaixaDto.fromJson(const {
          'id': 's1',
          'status': 'ABERTO',
          'valorAbertura': 100.0,
          'abertaEm': '2026-06-29T08:00:00.000Z',
          'operadorId': 'op1',
        }),
      );

      final result = await repository.abrir(valorAberturaCents: 10000);
      final session = result.getRight().toNullable()!;
      expect(session.valorAberturaCents, 10000);
      expect(session.status, CashSessionStatus.aberto);
      expect(session.operadorId, 'op1');
    });

    test('sends the opening amount in reais', () async {
      when(() => remote.abrir(valorAbertura: any(named: 'valorAbertura')))
          .thenAnswer(
        (_) async => SessaoCaixaDto.fromJson(const {
          'id': 's1',
          'status': 'ABERTO',
          'valorAbertura': 19.9,
          'abertaEm': '2026-06-29T08:00:00.000Z',
        }),
      );

      await repository.abrir(valorAberturaCents: 1990);
      verify(() => remote.abrir(valorAbertura: 19.9)).called(1);
    });

    test('movement DTO maps fractional reais to cents without drift', () async {
      when(
        () => remote.sangria(
          sessaoId: any(named: 'sessaoId'),
          valor: any(named: 'valor'),
          observacao: any(named: 'observacao'),
        ),
      ).thenAnswer(
        (_) async => MovimentacaoCaixaDto.fromJson(const {
          'id': 'm1',
          'tipo': 'SANGRIA',
          'valor': 19.99,
          'observacao': 'cofre',
          'criadaEm': '2026-06-29T09:00:00.000Z',
        }),
      );

      final result = await repository.registrarSangria(
        sessaoId: 's1',
        valorCents: 1999,
        observacao: 'cofre',
      );
      final movement = result.getRight().toNullable()!;
      expect(movement.valorCents, 1999);
      expect(movement.tipo, CashMovementType.sangria);
    });

    test('resumo DTO maps all monetary fields to cents', () async {
      when(() => remote.getResumo(any())).thenAnswer(
        (_) async => ResumoSessaoDto.fromJson(const {
          'abertura': 100.0,
          'suprimentos': 50.0,
          'vendasDinheiro': 200.0,
          'sangrias': 30.0,
          'esperado': 320.0,
          'contado': 318.5,
          'divergencia': -1.5,
        }),
      );

      final result = await repository.obterResumo('s1');
      final resumo = result.getRight().toNullable()!;
      expect(resumo.esperadoCents, 32000);
      expect(resumo.contadoCents, 31850);
      expect(resumo.divergenciaCents, -150);
    });
  });

  group('obterCaixaAberto', () {
    test('maps an open session', () async {
      when(() => remote.getAberto()).thenAnswer(
        (_) async => SessaoCaixaDto.fromJson(const {
          'id': 's1',
          'status': 'ABERTO',
          'valorAbertura': 100.0,
          'abertaEm': '2026-06-29T08:00:00.000Z',
        }),
      );

      final result = await repository.obterCaixaAberto();
      expect(result.getRight().toNullable(), isNotNull);
    });

    test('returns null when there is no open session', () async {
      when(() => remote.getAberto()).thenAnswer((_) async => null);
      final result = await repository.obterCaixaAberto();
      expect(result.isRight(), isTrue);
      expect(result.getRight().toNullable(), isNull);
    });
  });

  group('listarSessoes', () {
    test('builds the wire query from the filter and maps the sessions',
        () async {
      when(() => remote.listMinhas(any())).thenAnswer(
        (_) async => [
          SessaoCaixaDto.fromJson(const {
            'id': 's1',
            'status': 'FECHADO',
            'valorAbertura': 100.0,
            'abertaEm': '2026-06-29T08:00:00.000Z',
            'valorFechamento': 318.5,
            'fechadaEm': '2026-06-29T18:00:00.000Z',
          }),
        ],
      );

      final result = await repository.listarSessoes(
        SessoesCaixaFiltro(
          status: CashSessionStatus.fechado,
          from: DateTime.utc(2026, 6, 1),
        ),
      );

      final sessions = result.getRight().toNullable()!;
      expect(sessions.single.status, CashSessionStatus.fechado);
      expect(sessions.single.valorFechamentoCents, 31850);

      final query = verify(() => remote.listMinhas(captureAny()))
          .captured
          .single as Map<String, dynamic>;
      expect(query['status'], 'FECHADO');
      expect(query['from'], '2026-06-01T00:00:00.000Z');
      expect(query.containsKey('to'), isFalse);
    });

    test('sends an empty query for the default filter', () async {
      when(() => remote.listMinhas(any())).thenAnswer((_) async => []);
      await repository.listarSessoes(const SessoesCaixaFiltro());
      final query = verify(() => remote.listMinhas(captureAny()))
          .captured
          .single as Map<String, dynamic>;
      expect(query, isEmpty);
    });
  });

  group('obterSessao', () {
    test('maps the session DTO', () async {
      when(() => remote.getSessao(any())).thenAnswer(
        (_) async => SessaoCaixaDto.fromJson(const {
          'id': 's1',
          'status': 'ABERTO',
          'valorAbertura': 100.0,
          'abertaEm': '2026-06-29T08:00:00.000Z',
        }),
      );

      final result = await repository.obterSessao('s1');
      expect(result.getRight().toNullable()!.id, 's1');
    });

    test('ACESSO_NEGADO → CashSessionAccessDeniedFailure', () async {
      when(() => remote.getSessao(any())).thenThrow(
        const CashSessionException(
          'forbidden',
          code: 'ACESSO_NEGADO',
          statusCode: 403,
        ),
      );

      final result = await repository.obterSessao('other');
      expect(
        result.getLeft().toNullable(),
        isA<CashSessionAccessDeniedFailure>(),
      );
    });

    test('bare 403 without code → CashSessionAccessDeniedFailure', () async {
      when(() => remote.getSessao(any())).thenThrow(
        const CashSessionException('forbidden', statusCode: 403),
      );

      final result = await repository.obterSessao('other');
      expect(
        result.getLeft().toNullable(),
        isA<CashSessionAccessDeniedFailure>(),
      );
    });
  });

  group('error code → Failure', () {
    test('CAIXA_JA_ABERTO → CashSessionAlreadyOpenFailure', () async {
      when(() => remote.abrir(valorAbertura: any(named: 'valorAbertura')))
          .thenThrow(
        const CashSessionException(
          'conflict',
          code: 'CAIXA_JA_ABERTO',
          statusCode: 409,
        ),
      );

      final result = await repository.abrir(valorAberturaCents: 0);
      expect(
        result.getLeft().toNullable(),
        isA<CashSessionAlreadyOpenFailure>(),
      );
    });

    test('CAIXA_NAO_ENCONTRADO → CashSessionNotFoundFailure', () async {
      when(() => remote.getResumo(any())).thenThrow(
        const CashSessionException(
          'missing',
          code: 'CAIXA_NAO_ENCONTRADO',
          statusCode: 404,
        ),
      );

      final result = await repository.obterResumo('x');
      expect(result.getLeft().toNullable(), isA<CashSessionNotFoundFailure>());
    });

    test('CAIXA_JA_FECHADO → CashSessionAlreadyClosedFailure',
        () async {
      when(
        () => remote.fechar(
          sessaoId: any(named: 'sessaoId'),
          valorFechamento: any(named: 'valorFechamento'),
        ),
      ).thenThrow(
        const CashSessionException(
          'closed',
          code: 'CAIXA_JA_FECHADO',
          statusCode: 409,
        ),
      );

      final result = await repository.fechar(
        sessaoId: 's1',
        valorFechamentoCents: 100,
      );
      expect(
        result.getLeft().toNullable(),
        isA<CashSessionAlreadyClosedFailure>(),
      );
    });

    test('VENDA_PENDENTE_NO_FECHAMENTO → PendingSaleInSessionFailure', () async {
      when(
        () => remote.fechar(
          sessaoId: any(named: 'sessaoId'),
          valorFechamento: any(named: 'valorFechamento'),
        ),
      ).thenThrow(
        const CashSessionException(
          'pending',
          code: 'VENDA_PENDENTE_NO_FECHAMENTO',
          statusCode: 422,
        ),
      );

      final result = await repository.fechar(
        sessaoId: 's1',
        valorFechamentoCents: 100,
      );
      expect(result.getLeft().toNullable(), isA<PendingSaleInSessionFailure>());
    });

    test('unknown 404 without code → CashSessionNotFoundFailure', () async {
      when(() => remote.getResumo(any())).thenThrow(
        const CashSessionException('not found', statusCode: 404),
      );

      final result = await repository.obterResumo('x');
      expect(result.getLeft().toNullable(), isA<CashSessionNotFoundFailure>());
    });

    test('a generic AppException → CaixaNetworkFailure', () async {
      when(() => remote.getResumo(any()))
          .thenThrow(const SerializationException('bad payload'));

      final result = await repository.obterResumo('x');
      expect(result.getLeft().toNullable(), isA<CaixaNetworkFailure>());
    });
  });
}
