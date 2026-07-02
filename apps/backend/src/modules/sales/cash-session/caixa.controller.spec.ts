import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  AbrirCaixa,
  CaixaAbertoDoOperador,
  CaixaError,
  CanalVenda,
  FecharCaixa,
  ListarMovimentacoes,
  ListarVendas,
  PapelCaixa,
  RegistrarSangria,
  RegistrarSuprimento,
  ResumoSessao,
  StatusSessaoCaixa,
  StatusVenda,
  TipoMovimentacaoCaixa,
} from '@repo/sales';
import { UserRole } from '@repo/auth';
import { Result } from '@repo/shared';
import { CaixaPrismaQuery } from './adapters/caixa.prisma.query';
import { CaixaCommandsController } from './caixa-commands.controller';
import { CaixaQueriesController } from './caixa-queries.controller';

const OPERADOR_ID = '11111111-1111-1111-1111-111111111111';
const OTHER_ID = '99999999-9999-9999-9999-999999999999';
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
  const listarVendas = { execute: jest.fn() };
  const caixaQuery = { listarSessoes: jest.fn(), sessaoPorId: jest.fn() };

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
        { provide: ListarVendas, useValue: listarVendas },
        { provide: CaixaPrismaQuery, useValue: caixaQuery },
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
      status: StatusSessaoCaixa.ABERTA,
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

  test('fechar passes usuarioId and returns esperado/contado/divergencia + resumo in reais', async () => {
    fecharCaixa.execute.mockResolvedValue(
      Result.ok({
        sessaoId: SESSAO_ID,
        resumo: {
          totalVendas: 3000,
          qtdVendas: 2,
          totalPorForma: { DINHEIRO: 3000 },
          sangrias: 500,
          suprimentos: 2000,
          saldoEsperado: 15000,
        },
        contado: 14950,
        divergencia: -50,
      }),
    );

    const out = await commands.fechar(OPERADOR_ID, SESSAO_ID, {
      valorFechamento: 149.5,
    });

    expect(fecharCaixa.execute).toHaveBeenCalledWith({
      sessaoId: SESSAO_ID,
      usuarioId: OPERADOR_ID,
      valorFechamento: 14950,
    });
    expect(out.sessaoId).toBe(SESSAO_ID);
    expect(out.esperado).toBe(150);
    expect(out.contado).toBe(149.5);
    expect(out.divergencia).toBe(-0.5);
    expect(out.resumo.saldoEsperado).toBe(150);
    expect(out.resumo.qtdVendas).toBe(2);
    expect(out.resumo.totalPorForma).toEqual({ DINHEIRO: 30 });
  });

  test('fechar defaults valorFechamento to 0 when omitted', async () => {
    fecharCaixa.execute.mockResolvedValue(
      Result.ok({
        sessaoId: SESSAO_ID,
        resumo: {
          totalVendas: 0,
          qtdVendas: 0,
          totalPorForma: {},
          sangrias: 0,
          suprimentos: 0,
          saldoEsperado: 10000,
        },
        contado: 0,
        divergencia: -10000,
      }),
    );

    await commands.fechar(OPERADOR_ID, SESSAO_ID, {});

    expect(fecharCaixa.execute).toHaveBeenCalledWith({
      sessaoId: SESSAO_ID,
      usuarioId: OPERADOR_ID,
      valorFechamento: 0,
    });
  });

  test('sangria passes usuarioId and cents, returns the movement in reais', async () => {
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

    const out = await commands.sangria(OPERADOR_ID, SESSAO_ID, {
      valor: 50,
      observacao: 'troco',
    });

    expect(registrarSangria.execute).toHaveBeenCalledWith({
      sessaoId: SESSAO_ID,
      usuarioId: OPERADOR_ID,
      valor: 5000,
      observacao: 'troco',
    });
    expect(out.valor).toBe(50);
    expect(out.tipo).toBe(TipoMovimentacaoCaixa.SANGRIA);
  });

  test('suprimento delegates to RegistrarSuprimento with usuarioId', async () => {
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

    await commands.suprimento(OPERADOR_ID, SESSAO_ID, {
      valor: 20,
      observacao: 'reforço',
    });

    expect(registrarSuprimento.execute).toHaveBeenCalledWith({
      sessaoId: SESSAO_ID,
      usuarioId: OPERADOR_ID,
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

  test('resumo passes the actor and returns the full breakdown in reais', async () => {
    resumoSessao.execute.mockResolvedValue(
      Result.ok({
        sessaoId: SESSAO_ID,
        status: StatusSessaoCaixa.ABERTA,
        abertura: 10000,
        suprimentos: 2000,
        vendasDinheiro: 3000,
        sangrias: 500,
        esperado: 14500,
        contado: null,
        divergencia: null,
        totalVendas: 3000,
        qtdVendas: 2,
        totalPorForma: { DINHEIRO: 3000 },
      }),
    );

    const out = await queries.resumo(OPERADOR_ID, UserRole.OPERADOR, SESSAO_ID);

    expect(resumoSessao.execute).toHaveBeenCalledWith({
      sessaoId: SESSAO_ID,
      ator: { usuarioId: OPERADOR_ID, papel: PapelCaixa.OPERADOR },
    });
    expect(out).toEqual({
      abertura: 100,
      suprimentos: 20,
      vendasDinheiro: 30,
      sangrias: 5,
      esperado: 145,
      contado: null,
      divergencia: null,
      totalVendas: 30,
      qtdVendas: 2,
      totalPorForma: { DINHEIRO: 30 },
    });
  });

  test('resumo maps an ADMIN role to PapelCaixa.ADMIN', async () => {
    resumoSessao.execute.mockResolvedValue(
      Result.ok({
        sessaoId: SESSAO_ID,
        status: StatusSessaoCaixa.ABERTA,
        abertura: 0,
        suprimentos: 0,
        vendasDinheiro: 0,
        sangrias: 0,
        esperado: 0,
        contado: null,
        divergencia: null,
        totalVendas: 0,
        qtdVendas: 0,
        totalPorForma: {},
      }),
    );

    await queries.resumo(OPERADOR_ID, UserRole.ADMIN, SESSAO_ID);

    expect(resumoSessao.execute).toHaveBeenCalledWith({
      sessaoId: SESSAO_ID,
      ator: { usuarioId: OPERADOR_ID, papel: PapelCaixa.ADMIN },
    });
  });

  test('movimentacoes passes the actor and maps the page to reais', async () => {
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

    const out = await queries.movimentacoes(
      OPERADOR_ID,
      UserRole.OPERADOR,
      SESSAO_ID,
      {
        page: 1,
        pageSize: 20,
      },
    );

    expect(listarMovimentacoes.execute).toHaveBeenCalledWith({
      sessaoId: SESSAO_ID,
      ator: { usuarioId: OPERADOR_ID, papel: PapelCaixa.OPERADOR },
      page: 1,
      pageSize: 20,
    });
    expect(out.data[0].valor).toBe(25);
    expect(out.data[0].tipo).toBe(TipoMovimentacaoCaixa.VENDA);
    expect(out.meta.total).toBe(1);
  });

  test('listar (ADMIN) returns all operators sessions mapped to reais', async () => {
    caixaQuery.listarSessoes.mockResolvedValue(
      Result.ok({
        data: [
          {
            id: SESSAO_ID,
            operadorId: OTHER_ID,
            status: StatusSessaoCaixa.FECHADA,
            valorAbertura: 10000,
            valorFechamento: 15000,
            abertaEm: new Date('2026-06-30T10:00:00Z'),
            fechadaEm: new Date('2026-06-30T18:00:00Z'),
          },
        ],
        meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
      }),
    );

    const out = await queries.listar({ page: 1, pageSize: 20 });

    expect(out.data[0].operadorId).toBe(OTHER_ID);
    expect(out.data[0].valorAbertura).toBe(100);
    expect(out.data[0].valorFechamento).toBe(150);
    expect(out.meta.total).toBe(1);
  });

  // --- GET /caixa/minhas (caller-scoped list, any role) -----------------------

  test('minhas forces the usuarioId filter to the caller and maps to reais', async () => {
    caixaQuery.listarSessoes.mockResolvedValue(
      Result.ok({
        data: [
          {
            id: SESSAO_ID,
            operadorId: OPERADOR_ID,
            status: StatusSessaoCaixa.FECHADA,
            valorAbertura: 10000,
            valorFechamento: 15000,
            abertaEm: new Date('2026-06-30T10:00:00Z'),
            fechadaEm: new Date('2026-06-30T18:00:00Z'),
          },
        ],
        meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
      }),
    );

    const out = await queries.minhas(OPERADOR_ID, {
      page: 2,
      pageSize: 10,
      status: StatusSessaoCaixa.FECHADA,
      from: '2026-06-01T00:00:00Z',
      to: '2026-07-01T00:00:00Z',
    });

    // The scope is ALWAYS the caller — there is no usuarioId filter on this route.
    expect(caixaQuery.listarSessoes).toHaveBeenCalledWith({
      page: 2,
      pageSize: 10,
      usuarioId: OPERADOR_ID,
      status: StatusSessaoCaixa.FECHADA,
      from: new Date('2026-06-01T00:00:00Z'),
      to: new Date('2026-07-01T00:00:00Z'),
    });
    expect(out.data[0].operadorId).toBe(OPERADOR_ID);
    expect(out.data[0].valorAbertura).toBe(100);
    expect(out.meta.total).toBe(1);
  });

  // --- GET /caixa/:id (owner or ADMIN) ----------------------------------------

  const sessaoDTO = (overrides: Record<string, unknown> = {}) => ({
    id: SESSAO_ID,
    operadorId: OPERADOR_ID,
    status: StatusSessaoCaixa.ABERTA,
    valorAbertura: 10000,
    valorFechamento: null,
    abertaEm: new Date('2026-06-30T10:00:00Z'),
    fechadaEm: null,
    ...overrides,
  });

  test('porId: owner reads their own session (money in reais)', async () => {
    caixaQuery.sessaoPorId.mockResolvedValue(Result.ok(sessaoDTO()));

    const out = await queries.porId(OPERADOR_ID, UserRole.OPERADOR, SESSAO_ID);

    expect(caixaQuery.sessaoPorId).toHaveBeenCalledWith(SESSAO_ID);
    expect(out.id).toBe(SESSAO_ID);
    expect(out.operadorId).toBe(OPERADOR_ID);
    expect(out.valorAbertura).toBe(100);
    expect(out.status).toBe(StatusSessaoCaixa.ABERTA);
  });

  test('porId: ADMIN reads another operator session', async () => {
    caixaQuery.sessaoPorId.mockResolvedValue(
      Result.ok(sessaoDTO({ operadorId: OTHER_ID })),
    );

    const out = await queries.porId(OPERADOR_ID, UserRole.ADMIN, SESSAO_ID);

    expect(out.operadorId).toBe(OTHER_ID);
  });

  test('porId: non-ADMIN reading another operator session -> 403 (ACESSO_NEGADO)', async () => {
    caixaQuery.sessaoPorId.mockResolvedValue(
      Result.ok(sessaoDTO({ operadorId: OTHER_ID })),
    );

    await expect(
      queries.porId(OPERADOR_ID, UserRole.OPERADOR, SESSAO_ID),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  test('porId: missing session -> 404 (CAIXA_NAO_ENCONTRADO)', async () => {
    caixaQuery.sessaoPorId.mockResolvedValue(Result.ok(null));

    await expect(
      queries.porId(OPERADOR_ID, UserRole.ADMIN, SESSAO_ID),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  test('queries controller declares literal routes (aberto, minhas) before /:id', () => {
    const methods = Object.getOwnPropertyNames(
      CaixaQueriesController.prototype,
    );
    expect(methods.indexOf('aberto')).toBeLessThan(methods.indexOf('porId'));
    expect(methods.indexOf('minhas')).toBeLessThan(methods.indexOf('porId'));
  });

  // --- GET /caixa/:id/vendas (sale-api contract, RN03/RN04) ------------------

  const okResumo = (overrides: Record<string, unknown> = {}) =>
    Result.ok({
      sessaoId: SESSAO_ID,
      status: StatusSessaoCaixa.ABERTA,
      abertura: 0,
      suprimentos: 0,
      vendasDinheiro: 0,
      sangrias: 0,
      esperado: 0,
      contado: null,
      divergencia: null,
      totalVendas: 0,
      qtdVendas: 0,
      totalPorForma: {},
      ...overrides,
    });

  const vendaDTO = (overrides: Record<string, unknown> = {}) => ({
    id: '33333333-3333-3333-3333-333333333333',
    numero: 1,
    canal: CanalVenda.PDV,
    status: StatusVenda.CONCLUIDA,
    usuarioId: OPERADOR_ID,
    sessaoCaixaId: SESSAO_ID,
    subtotal: 3000,
    desconto: 0,
    total: 3000,
    itens: [],
    pagamentos: [],
    concluidaEm: new Date('2026-06-30T12:00:00Z'),
    canceladaEm: null,
    criadoEm: new Date('2026-06-30T11:00:00Z'),
    ...overrides,
  });

  test('vendas: ADMIN sees the session sales filtered by sessaoCaixaId (reais)', async () => {
    resumoSessao.execute.mockResolvedValue(okResumo());
    listarVendas.execute.mockResolvedValue(
      Result.ok({
        data: [vendaDTO({ usuarioId: OTHER_ID, total: 3000 })],
        meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
      }),
    );

    const out = await queries.vendas(OPERADOR_ID, UserRole.ADMIN, SESSAO_ID, {
      page: 1,
      pageSize: 20,
    });

    // The ADMIN passes the ownership gate (ATOR=ADMIN) and the list is scoped to
    // the session id, not the caller.
    expect(resumoSessao.execute).toHaveBeenCalledWith({
      sessaoId: SESSAO_ID,
      ator: { usuarioId: OPERADOR_ID, papel: PapelCaixa.ADMIN },
    });
    expect(listarVendas.execute).toHaveBeenCalledWith(
      expect.objectContaining({ sessaoCaixaId: SESSAO_ID }),
    );
    expect(out.data[0].total).toBe(30);
    expect(out.meta.total).toBe(1);
  });

  test('vendas: OPERADOR reading another operator session sales -> 403 (ACESSO_NEGADO)', async () => {
    // The ownership gate (ResumoSessao) rejects a non-owner non-ADMIN.
    resumoSessao.execute.mockResolvedValue(
      Result.fail(CaixaError.ACESSO_NEGADO),
    );

    await expect(
      queries.vendas(OPERADOR_ID, UserRole.OPERADOR, SESSAO_ID, {
        page: 1,
        pageSize: 20,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    // The sales read is never reached once the gate fails.
    expect(listarVendas.execute).not.toHaveBeenCalled();
  });

  test('vendas: OPERADOR sees the sales of their own session', async () => {
    resumoSessao.execute.mockResolvedValue(okResumo());
    listarVendas.execute.mockResolvedValue(
      Result.ok({
        data: [vendaDTO()],
        meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
      }),
    );

    const out = await queries.vendas(
      OPERADOR_ID,
      UserRole.OPERADOR,
      SESSAO_ID,
      {
        page: 1,
        pageSize: 20,
      },
    );

    expect(resumoSessao.execute).toHaveBeenCalledWith({
      sessaoId: SESSAO_ID,
      ator: { usuarioId: OPERADOR_ID, papel: PapelCaixa.OPERADOR },
    });
    expect(out.data[0].id).toBe('33333333-3333-3333-3333-333333333333');
  });

  test('vendas: missing session -> 404 (CAIXA_NAO_ENCONTRADO)', async () => {
    resumoSessao.execute.mockResolvedValue(
      Result.fail(CaixaError.CAIXA_NAO_ENCONTRADO),
    );

    await expect(
      queries.vendas(OPERADOR_ID, UserRole.ADMIN, SESSAO_ID, {
        page: 1,
        pageSize: 20,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  // --- Error rows (mapped via unwrap / domain-error.mapper) -------------------

  test('abrir maps CAIXA_JA_ABERTO -> 409', async () => {
    abrirCaixa.execute.mockResolvedValue(
      Result.fail(CaixaError.CAIXA_JA_ABERTO),
    );

    await expect(
      commands.abrir(OPERADOR_ID, { valorAbertura: 100 }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  test('fechar maps CAIXA_NAO_ENCONTRADO -> 404', async () => {
    fecharCaixa.execute.mockResolvedValue(
      Result.fail(CaixaError.CAIXA_NAO_ENCONTRADO),
    );

    await expect(
      commands.fechar(OPERADOR_ID, SESSAO_ID, { valorFechamento: 100 }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  test('fechar maps NAO_E_DONO_DO_CAIXA -> 403', async () => {
    fecharCaixa.execute.mockResolvedValue(
      Result.fail(CaixaError.NAO_E_DONO_DO_CAIXA),
    );

    await expect(
      commands.fechar(OPERADOR_ID, SESSAO_ID, { valorFechamento: 100 }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  test('fechar maps CAIXA_JA_FECHADO -> 409', async () => {
    fecharCaixa.execute.mockResolvedValue(
      Result.fail(CaixaError.CAIXA_JA_FECHADO),
    );

    await expect(
      commands.fechar(OPERADOR_ID, SESSAO_ID, { valorFechamento: 100 }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  test('fechar maps VENDA_PENDENTE_NO_FECHAMENTO -> 409', async () => {
    fecharCaixa.execute.mockResolvedValue(
      Result.fail(CaixaError.VENDA_PENDENTE_NO_FECHAMENTO),
    );

    await expect(
      commands.fechar(OPERADOR_ID, SESSAO_ID, { valorFechamento: 100 }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  test('resumo maps ACESSO_NEGADO -> 403', async () => {
    resumoSessao.execute.mockResolvedValue(
      Result.fail(CaixaError.ACESSO_NEGADO),
    );

    await expect(
      queries.resumo(OPERADOR_ID, UserRole.OPERADOR, SESSAO_ID),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  test('sangria maps CAIXA_NAO_ENCONTRADO -> 404', async () => {
    registrarSangria.execute.mockResolvedValue(
      Result.fail(CaixaError.CAIXA_NAO_ENCONTRADO),
    );

    await expect(
      commands.sangria(OPERADOR_ID, SESSAO_ID, { valor: 50, observacao: 'x' }),
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
    expect(methods).not.toEqual(
      expect.arrayContaining(['venda', 'registrarVenda']),
    );
  });
});
