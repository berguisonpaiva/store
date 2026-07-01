import {
  ConflictException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  AbrirCaixa,
  CaixaAbertoDoOperador,
  CaixaError,
  FecharCaixa,
  ListarMovimentacoes,
  RegistrarSangria,
  RegistrarSuprimento,
  ResumoSessao,
  StatusSessaoCaixa,
  TipoMovimentacaoCaixa,
} from '@repo/sales';
import { Result } from '@repo/shared';
import { CaixaCommandsController } from './caixa-commands.controller';
import { CaixaQueriesController } from './caixa-queries.controller';

const OPERADOR_ID = '11111111-1111-1111-1111-111111111111';
const SESSAO_ID = '22222222-2222-2222-2222-222222222222';

describe('Caixa controllers', () => {
  let commands: CaixaCommandsController;
  let queries: CaixaQueriesController;

  const abrirCaixa = { execute: jest.fn() };
  const fecharCaixa = { execute: jest.fn() };
  const registrarSangria = { execute: jest.fn() };
  const registrarSuprimento = { execute: jest.fn() };
  const caixaAbertoDoOperador = { execute: jest.fn() };
  const resumoSessao = { execute: jest.fn() };
  const listarMovimentacoes = { execute: jest.fn() };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CaixaCommandsController, CaixaQueriesController],
      providers: [
        { provide: AbrirCaixa, useValue: abrirCaixa },
        { provide: FecharCaixa, useValue: fecharCaixa },
        { provide: RegistrarSangria, useValue: registrarSangria },
        { provide: RegistrarSuprimento, useValue: registrarSuprimento },
        { provide: CaixaAbertoDoOperador, useValue: caixaAbertoDoOperador },
        { provide: ResumoSessao, useValue: resumoSessao },
        { provide: ListarMovimentacoes, useValue: listarMovimentacoes },
      ],
    }).compile();

    commands = module.get(CaixaCommandsController);
    queries = module.get(CaixaQueriesController);
  });

  // --- Happy paths -----------------------------------------------------------

  test('abrir derives operadorId from the token and converts reais->cents', async () => {
    const sessao = {
      id: SESSAO_ID,
      operadorId: OPERADOR_ID,
      status: StatusSessaoCaixa.ABERTO,
      valorAbertura: 10000,
      valorFechamento: null,
      abertaEm: new Date('2026-06-30T10:00:00Z'),
      fechadaEm: null,
    };
    abrirCaixa.execute.mockResolvedValue(Result.ok(sessao));

    const out = await commands.abrir(OPERADOR_ID, { valorAbertura: 100 });

    expect(abrirCaixa.execute).toHaveBeenCalledWith({
      operadorId: OPERADOR_ID,
      valorAbertura: 10000,
    });
    expect(out.valorAbertura).toBe(100);
    expect(out.operadorId).toBe(OPERADOR_ID);
  });

  test('fechar returns esperado/contado/divergencia in reais', async () => {
    fecharCaixa.execute.mockResolvedValue(
      Result.ok({
        sessaoId: SESSAO_ID,
        esperado: 15000,
        contado: 14950,
        divergencia: -50,
      }),
    );

    const out = await commands.fechar(SESSAO_ID, { valorFechamento: 149.5 });

    expect(fecharCaixa.execute).toHaveBeenCalledWith({
      sessaoId: SESSAO_ID,
      valorFechamento: 14950,
    });
    expect(out).toEqual({
      sessaoId: SESSAO_ID,
      esperado: 150,
      contado: 149.5,
      divergencia: -0.5,
    });
  });

  test('sangria delegates with cents and returns the movement in reais', async () => {
    registrarSangria.execute.mockResolvedValue(
      Result.ok({
        id: 'mov-1',
        sessaoId: SESSAO_ID,
        tipo: TipoMovimentacaoCaixa.SANGRIA,
        valor: 5000,
        observacao: 'troco',
        criadaEm: new Date('2026-06-30T11:00:00Z'),
      }),
    );

    const out = await commands.sangria(SESSAO_ID, {
      valor: 50,
      observacao: 'troco',
    });

    expect(registrarSangria.execute).toHaveBeenCalledWith({
      sessaoId: SESSAO_ID,
      valor: 5000,
      observacao: 'troco',
    });
    expect(out.valor).toBe(50);
    expect(out.tipo).toBe(TipoMovimentacaoCaixa.SANGRIA);
  });

  test('suprimento delegates to RegistrarSuprimento', async () => {
    registrarSuprimento.execute.mockResolvedValue(
      Result.ok({
        id: 'mov-2',
        sessaoId: SESSAO_ID,
        tipo: TipoMovimentacaoCaixa.SUPRIMENTO,
        valor: 2000,
        observacao: 'reforço',
        criadaEm: new Date(),
      }),
    );

    await commands.suprimento(SESSAO_ID, { valor: 20, observacao: 'reforço' });

    expect(registrarSuprimento.execute).toHaveBeenCalledWith({
      sessaoId: SESSAO_ID,
      valor: 2000,
      observacao: 'reforço',
    });
  });

  test('aberto returns null when no open session exists', async () => {
    caixaAbertoDoOperador.execute.mockResolvedValue(Result.ok(null));

    const out = await queries.aberto(OPERADOR_ID);

    expect(caixaAbertoDoOperador.execute).toHaveBeenCalledWith({
      operadorId: OPERADOR_ID,
    });
    expect(out).toBeNull();
  });

  test('resumo returns the full breakdown in reais', async () => {
    resumoSessao.execute.mockResolvedValue(
      Result.ok({
        sessaoId: SESSAO_ID,
        status: StatusSessaoCaixa.ABERTO,
        abertura: 10000,
        suprimentos: 2000,
        vendasDinheiro: 3000,
        sangrias: 500,
        esperado: 14500,
        contado: null,
        divergencia: null,
      }),
    );

    const out = await queries.resumo(SESSAO_ID);

    expect(out).toEqual({
      abertura: 100,
      suprimentos: 20,
      vendasDinheiro: 30,
      sangrias: 5,
      esperado: 145,
      contado: null,
      divergencia: null,
    });
  });

  test('movimentacoes maps the page to reais', async () => {
    listarMovimentacoes.execute.mockResolvedValue(
      Result.ok({
        data: [
          {
            id: 'mov-1',
            sessaoId: SESSAO_ID,
            tipo: TipoMovimentacaoCaixa.VENDA,
            valor: 2500,
            observacao: null,
            timestamp: new Date('2026-06-30T12:00:00Z'),
          },
        ],
        meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
      }),
    );

    const out = await queries.movimentacoes(SESSAO_ID, {
      page: 1,
      pageSize: 20,
    });

    expect(out.data[0].valor).toBe(25);
    expect(out.data[0].tipo).toBe(TipoMovimentacaoCaixa.VENDA);
    expect(out.meta.total).toBe(1);
  });

  // --- Error rows (mapped via unwrap / domain-error.mapper) -------------------

  test('abrir maps CASH_SESSION_ALREADY_OPEN -> 409', async () => {
    abrirCaixa.execute.mockResolvedValue(
      Result.fail(CaixaError.CASH_SESSION_ALREADY_OPEN),
    );

    await expect(
      commands.abrir(OPERADOR_ID, { valorAbertura: 100 }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  test('fechar maps CASH_SESSION_NOT_FOUND -> 404', async () => {
    fecharCaixa.execute.mockResolvedValue(
      Result.fail(CaixaError.CASH_SESSION_NOT_FOUND),
    );

    await expect(
      commands.fechar(SESSAO_ID, { valorFechamento: 100 }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  test('fechar maps CASH_SESSION_ALREADY_CLOSED -> 409', async () => {
    fecharCaixa.execute.mockResolvedValue(
      Result.fail(CaixaError.CASH_SESSION_ALREADY_CLOSED),
    );

    await expect(
      commands.fechar(SESSAO_ID, { valorFechamento: 100 }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  test('fechar maps PENDING_SALE_IN_SESSION -> 422', async () => {
    fecharCaixa.execute.mockResolvedValue(
      Result.fail(CaixaError.PENDING_SALE_IN_SESSION),
    );

    await expect(
      commands.fechar(SESSAO_ID, { valorFechamento: 100 }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });

  test('sangria maps CASH_SESSION_NOT_FOUND -> 404', async () => {
    registrarSangria.execute.mockResolvedValue(
      Result.fail(CaixaError.CASH_SESSION_NOT_FOUND),
    );

    await expect(
      commands.sangria(SESSAO_ID, { valor: 50, observacao: 'x' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  // --- No public VENDA route -------------------------------------------------

  test('commands controller exposes no method that creates a VENDA movement', () => {
    const methods = Object.getOwnPropertyNames(
      CaixaCommandsController.prototype,
    );
    expect(methods).toEqual(
      expect.arrayContaining(['abrir', 'fechar', 'sangria', 'suprimento']),
    );
    expect(methods).not.toEqual(expect.arrayContaining(['venda', 'registrarVenda']));
  });
});
