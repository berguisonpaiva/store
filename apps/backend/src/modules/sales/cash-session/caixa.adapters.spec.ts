import { Prisma } from '@prisma/client';
import {
  CaixaError,
  CaixaPortService,
  MovimentacaoCaixa,
  SessaoCaixa,
  StatusSessaoCaixa,
  TipoMovimentacaoCaixa,
} from '@repo/sales';
import { PrismaService } from '../../../db/prisma.service';
import { CaixaPrismaQuery } from './adapters/caixa.prisma.query';
import { CaixaPrismaRepository } from './adapters/caixa.prisma.repository';
import {
  centsToDecimal,
  decimalToCents,
  reaisToCents,
} from './adapters/money';

const OPERADOR_ID = '11111111-1111-1111-1111-111111111111';
const SESSAO_ID = '22222222-2222-2222-2222-222222222222';

describe('money helpers', () => {
  test('cents <-> Decimal reais round-trip preserves precision', () => {
    for (const cents of [0, 1, 99, 100, 14950, 999999]) {
      const decimal = centsToDecimal(cents);
      expect(decimal).toBeInstanceOf(Prisma.Decimal);
      expect(decimalToCents(decimal)).toBe(cents);
    }
  });

  test('reais -> cents rounds to the nearest cent with no float drift', () => {
    expect(reaisToCents(100)).toBe(10000);
    expect(reaisToCents(149.5)).toBe(14950);
    expect(reaisToCents(0.1)).toBe(10);
    expect(reaisToCents(12.34)).toBe(1234);
  });
});

describe('CaixaPrismaRepository.toDomain/fromDomain', () => {
  function makePrisma(overrides: Partial<Record<string, any>> = {}) {
    const sessaoCaixa = {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    };
    const movimentacaoCaixa = { create: jest.fn() };
    const prisma = {
      client: { sessaoCaixa, movimentacaoCaixa },
      runInTransaction: (op: any) => op({ client: { sessaoCaixa, movimentacaoCaixa } }),
      ...overrides,
    } as unknown as PrismaService;
    return { prisma, sessaoCaixa, movimentacaoCaixa };
  }

  test('round-trip mapping reconstructs the session with money intact', async () => {
    const { prisma, sessaoCaixa } = makePrisma();
    const repo = new CaixaPrismaRepository(prisma);

    const opened = SessaoCaixa.abrir({
      operadorId: OPERADOR_ID,
      valorAbertura: 12345, // cents
    }).instance;

    // fromDomain persists Decimal reais...
    sessaoCaixa.create.mockImplementation(({ data }: any) => ({
      id: data.id,
      operadorId: data.operadorId,
      status: data.status,
      valorAbertura: data.valorAbertura,
      valorFechamento: data.valorFechamento,
      abertaEm: data.abertaEm,
      fechadaEm: data.fechadaEm,
      createdAt: opened.createdAt,
      updatedAt: opened.updatedAt,
    }));

    const result = await repo.abrirSessao(opened);

    expect(result.isOk).toBe(true);
    const persistedData = sessaoCaixa.create.mock.calls[0][0].data;
    expect(persistedData.valorAbertura).toBeInstanceOf(Prisma.Decimal);
    expect(persistedData.valorAbertura.toFixed(2)).toBe('123.45');
    // ...and toDomain rebuilds cents exactly.
    expect(result.instance.valorAbertura).toBe(12345);
    expect(result.instance.operadorId).toBe(OPERADOR_ID);
    expect(result.instance.status).toBe(StatusSessaoCaixa.ABERTO);
  });

  test('abrirSessao maps Prisma P2002 -> CASH_SESSION_ALREADY_OPEN', async () => {
    const { prisma, sessaoCaixa } = makePrisma();
    const repo = new CaixaPrismaRepository(prisma);

    sessaoCaixa.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('unique', {
        code: 'P2002',
        clientVersion: 'test',
      }),
    );

    const opened = SessaoCaixa.abrir({
      operadorId: OPERADOR_ID,
      valorAbertura: 0,
    }).instance;

    const result = await repo.abrirSessao(opened);

    expect(result.isFailure).toBe(true);
    expect(result.errors).toContain(CaixaError.CASH_SESSION_ALREADY_OPEN);
  });

  test('registrarMovimentacao persists transactionally and maps back', async () => {
    const { prisma, movimentacaoCaixa } = makePrisma();
    const repo = new CaixaPrismaRepository(prisma);

    const mov = MovimentacaoCaixa.criar(TipoMovimentacaoCaixa.SANGRIA, {
      sessaoId: SESSAO_ID,
      valor: 5000,
      observacao: 'troco',
    }).instance;

    movimentacaoCaixa.create.mockImplementation(({ data }: any) => ({
      id: data.id,
      sessaoId: data.sessaoId,
      tipo: data.tipo,
      valor: data.valor,
      observacao: data.observacao,
      criadaEm: data.criadaEm,
    }));

    const result = await repo.registrarMovimentacao(mov);

    expect(result.isOk).toBe(true);
    expect(result.instance.valor).toBe(5000);
    expect(result.instance.tipo).toBe(TipoMovimentacaoCaixa.SANGRIA);
    expect(movimentacaoCaixa.create.mock.calls[0][0].data.valor.toFixed(2)).toBe(
      '50.00',
    );
  });
});

describe('CaixaPortService.registrarVenda', () => {
  test('persists a VENDA movement against an open session', async () => {
    const sessaoCaixa = {
      findUnique: jest.fn().mockResolvedValue({
        id: SESSAO_ID,
        operadorId: OPERADOR_ID,
        status: StatusSessaoCaixa.ABERTO,
        valorAbertura: new Prisma.Decimal('100.00'),
        valorFechamento: null,
        abertaEm: new Date(),
        fechadaEm: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    };
    const movimentacaoCaixa = {
      create: jest.fn().mockImplementation(({ data }: any) => ({ ...data })),
    };
    const prisma = {
      client: { sessaoCaixa, movimentacaoCaixa },
      runInTransaction: (op: any) =>
        op({ client: { sessaoCaixa, movimentacaoCaixa } }),
    } as unknown as PrismaService;

    const repo = new CaixaPrismaRepository(prisma);
    const query = new CaixaPrismaQuery(prisma);
    const port = new CaixaPortService(repo, query);

    const result = await port.registrarVenda(SESSAO_ID, 2500);

    expect(result.isOk).toBe(true);
    expect(movimentacaoCaixa.create).toHaveBeenCalledTimes(1);
    const data = movimentacaoCaixa.create.mock.calls[0][0].data;
    expect(data.tipo).toBe(TipoMovimentacaoCaixa.VENDA);
    expect(data.valor.toFixed(2)).toBe('25.00');
    expect(data.sessaoId).toBe(SESSAO_ID);
  });

  test('fails with CASH_SESSION_ALREADY_CLOSED on a closed session', async () => {
    const sessaoCaixa = {
      findUnique: jest.fn().mockResolvedValue({
        id: SESSAO_ID,
        operadorId: OPERADOR_ID,
        status: StatusSessaoCaixa.FECHADO,
        valorAbertura: new Prisma.Decimal('100.00'),
        valorFechamento: new Prisma.Decimal('100.00'),
        abertaEm: new Date(),
        fechadaEm: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    };
    const movimentacaoCaixa = { create: jest.fn() };
    const prisma = {
      client: { sessaoCaixa, movimentacaoCaixa },
      runInTransaction: (op: any) =>
        op({ client: { sessaoCaixa, movimentacaoCaixa } }),
    } as unknown as PrismaService;

    const port = new CaixaPortService(
      new CaixaPrismaRepository(prisma),
      new CaixaPrismaQuery(prisma),
    );

    const result = await port.registrarVenda(SESSAO_ID, 2500);

    expect(result.isFailure).toBe(true);
    expect(result.errors).toContain(CaixaError.CASH_SESSION_ALREADY_CLOSED);
    expect(movimentacaoCaixa.create).not.toHaveBeenCalled();
  });
});
