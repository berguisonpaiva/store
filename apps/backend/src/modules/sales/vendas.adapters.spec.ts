import { Prisma } from '@prisma/client';
import { Result } from '@repo/shared';
import { FormaPagamento, StatusVenda, Venda } from '@repo/sales';
import { MotivoMovimentacaoEstoque } from '@repo/inventory';
import { PrismaService } from '../../db/prisma.service';
import { CaixaGatewayAdapter } from './adapters/caixa.gateway.adapter';
import { EstoqueGatewayAdapter } from './adapters/estoque.gateway.adapter';
import { centsToDecimal, decimalToCents, reaisToCents } from './adapters/money';
import { VendasPrismaQuery } from './adapters/vendas.prisma.query';
import { VendasPrismaRepository } from './adapters/vendas.prisma.repository';

const USUARIO_ID = '11111111-1111-1111-1111-111111111111';
const SESSAO_ID = '22222222-2222-2222-2222-222222222222';
const VARIACAO_ID = '33333333-3333-3333-3333-333333333333';

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

function makePrisma(overrides: Partial<Record<string, any>> = {}) {
  const venda = {
    create: jest.fn(),
    update: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
  };
  const itemVenda = { deleteMany: jest.fn() };
  const pagamento = { deleteMany: jest.fn(), groupBy: jest.fn() };
  const client = {
    venda,
    itemVenda,
    pagamento,
    $queryRaw: jest.fn(),
  };
  const prisma = {
    client,
    runInTransaction: (op: any) => op({ client }),
    ...overrides,
  } as unknown as PrismaService;
  return { prisma, venda, itemVenda, pagamento, client };
}

function openSaleWithItem(): Venda {
  const aberta = Venda.abrir({
    usuarioId: USUARIO_ID,
    sessaoCaixaId: SESSAO_ID,
  }).instance;
  return aberta.adicionarItem({
    variacaoId: VARIACAO_ID,
    quantidade: 2,
    precoUnitario: 1500, // cents
  }).instance;
}

describe('VendasPrismaRepository.toDomain/fromDomain', () => {
  test('create persists money as Decimal and items/payments as child rows', async () => {
    const { prisma, venda } = makePrisma();
    const repo = new VendasPrismaRepository(prisma);

    const sale = openSaleWithItem();
    venda.create.mockResolvedValue({});

    const result = await repo.create(sale);

    expect(result.isOk).toBe(true);
    const data = venda.create.mock.calls[0][0].data;
    expect(data.subtotal).toBeInstanceOf(Prisma.Decimal);
    expect(data.subtotal.toFixed(2)).toBe('30.00'); // 2 * 1500 cents
    expect(data.itens.create).toHaveLength(1);
    expect(data.itens.create[0].precoUnitario.toFixed(2)).toBe('15.00');
    expect(data.itens.create[0].total.toFixed(2)).toBe('30.00');
    expect(data.status).toBe(StatusVenda.ABERTA);
    expect(data.numero).toBeNull();
  });

  test('round-trips a persisted sale via hydrate with money intact', async () => {
    const { prisma, venda } = makePrisma();
    const repo = new VendasPrismaRepository(prisma);

    const SALE_ID = '44444444-4444-4444-4444-444444444444';
    const ITEM_ID = '55555555-5555-5555-5555-555555555555';
    const PAY_ID = '66666666-6666-6666-6666-666666666666';
    venda.findUnique.mockResolvedValue({
      id: SALE_ID,
      numero: 7,
      canal: 'PDV',
      status: StatusVenda.CONCLUIDA,
      usuarioId: USUARIO_ID,
      sessaoCaixaId: SESSAO_ID,
      subtotal: new Prisma.Decimal('30.00'),
      desconto: new Prisma.Decimal('5.00'),
      total: new Prisma.Decimal('25.00'),
      criadaEm: new Date('2026-06-30T10:00:00Z'),
      concluidaEm: new Date('2026-06-30T10:05:00Z'),
      canceladaEm: null,
      createdAt: new Date('2026-06-30T10:00:00Z'),
      updatedAt: new Date('2026-06-30T10:05:00Z'),
      itens: [
        {
          id: ITEM_ID,
          variacaoId: VARIACAO_ID,
          quantidade: 2,
          precoUnitario: new Prisma.Decimal('15.00'),
          total: new Prisma.Decimal('30.00'),
        },
      ],
      pagamentos: [
        {
          id: PAY_ID,
          forma: FormaPagamento.DINHEIRO,
          valor: new Prisma.Decimal('25.00'),
        },
      ],
    });

    const result = await repo.findById(SALE_ID);

    expect(result.isOk).toBe(true);
    const sale = result.instance!;
    expect(sale.numero).toBe(7);
    expect(sale.status).toBe(StatusVenda.CONCLUIDA);
    expect(sale.subtotal).toBe(3000);
    expect(sale.desconto).toBe(500);
    expect(sale.total).toBe(2500);
    expect(sale.itens[0].precoUnitario).toBe(1500);
    expect(sale.pagamentos[0].valor).toBe(2500);
  });

  test('proximoNumero draws an atomic value from the DB sequence', async () => {
    const { prisma, client } = makePrisma();
    const repo = new VendasPrismaRepository(prisma);

    client.$queryRaw.mockResolvedValue([{ nextval: BigInt(42) }]);

    const result = await repo.proximoNumero();

    expect(result.isOk).toBe(true);
    expect(result.instance).toBe(42);
    expect(client.$queryRaw).toHaveBeenCalledTimes(1);
  });

  test('update assigns numero from the sequence when a sale becomes CONCLUIDA', async () => {
    const { prisma, venda, client } = makePrisma();
    const repo = new VendasPrismaRepository(prisma);

    const sale = openSaleWithItem();
    const finalized = sale
      .definirPagamentos([{ forma: FormaPagamento.DINHEIRO, valor: 3000 }])
      .instance.concluir().instance;

    client.$queryRaw.mockResolvedValue([{ nextval: BigInt(100) }]);
    venda.update.mockResolvedValue({});

    const result = await repo.update(finalized);

    expect(result.isOk).toBe(true);
    expect(client.$queryRaw).toHaveBeenCalledTimes(1);
    expect(venda.update.mock.calls[0][0].data.numero).toBe(100);
    expect(venda.update.mock.calls[0][0].data.status).toBe(
      StatusVenda.CONCLUIDA,
    );
  });

  test('update does NOT assign numero for a still-open sale', async () => {
    const { prisma, venda, client } = makePrisma();
    const repo = new VendasPrismaRepository(prisma);

    const sale = openSaleWithItem();
    venda.update.mockResolvedValue({});

    await repo.update(sale);

    expect(client.$queryRaw).not.toHaveBeenCalled();
    expect(venda.update.mock.calls[0][0].data.numero).toBeNull();
  });
});

describe('VendasPrismaQuery', () => {
  test('resumo aggregates count and money totals (cents)', async () => {
    const { prisma, venda, pagamento } = makePrisma();
    const query = new VendasPrismaQuery(prisma);

    venda.aggregate.mockResolvedValue({
      _count: { _all: 3 },
      _sum: {
        subtotal: new Prisma.Decimal('90.00'),
        desconto: new Prisma.Decimal('10.00'),
        total: new Prisma.Decimal('80.00'),
      },
    });
    // RF30: two payment methods used; the other two must come back zero-filled.
    pagamento.groupBy.mockResolvedValue([
      {
        forma: FormaPagamento.DINHEIRO,
        _sum: { valor: new Prisma.Decimal('50.00') },
        _count: { _all: 2 },
      },
      {
        forma: FormaPagamento.PIX,
        _sum: { valor: new Prisma.Decimal('30.00') },
        _count: { _all: 1 },
      },
    ]);

    const result = await query.resumo({ status: StatusVenda.CONCLUIDA });

    expect(result.isOk).toBe(true);
    expect(result.instance).toEqual({
      quantidade: 3,
      subtotal: 9000,
      desconto: 1000,
      total: 8000,
      porFormaPagamento: [
        { forma: FormaPagamento.DINHEIRO, total: 5000, quantidade: 2 },
        { forma: FormaPagamento.CARTAO_DEBITO, total: 0, quantidade: 0 },
        { forma: FormaPagamento.CARTAO_CREDITO, total: 0, quantidade: 0 },
        { forma: FormaPagamento.PIX, total: 3000, quantidade: 1 },
      ],
    });
  });
});

describe('EstoqueGatewayAdapter', () => {
  test('darBaixa delegates to the estoque port with VENDA_PDV', async () => {
    const port = {
      darBaixa: jest.fn().mockResolvedValue({ isFailure: false }),
    };
    const repo = {} as any;
    const adapter = new EstoqueGatewayAdapter(port as any, repo);

    const tx = {} as any;
    await adapter.darBaixa(VARIACAO_ID, 2, 'venda-1', 'operador-1', tx);

    expect(port.darBaixa).toHaveBeenCalledWith(
      VARIACAO_ID,
      2,
      'venda-1',
      'operador-1',
      MotivoMovimentacaoEstoque.VENDA_PDV,
      tx,
    );
  });

  test('darBaixa maps a port failure to INSUFFICIENT_STOCK', async () => {
    const port = {
      darBaixa: jest.fn().mockResolvedValue({ isFailure: true }),
    };
    const adapter = new EstoqueGatewayAdapter(port as any, {} as any);

    const result = await adapter.darBaixa(
      VARIACAO_ID,
      2,
      'venda-1',
      'operador-1',
    );

    expect(result.isFailure).toBe(true);
    expect(result.errors).toContain('INSUFFICIENT_STOCK');
  });

  test('estornar delegates to the estoque port (reversal as ENTRADA)', async () => {
    const port = {
      estornar: jest.fn().mockResolvedValue({ isFailure: false }),
    };
    const adapter = new EstoqueGatewayAdapter(port as any, {} as any);

    const tx = {} as any;
    await adapter.estornar(VARIACAO_ID, 2, 'venda-1', 'operador-1', tx);

    expect(port.estornar).toHaveBeenCalledWith(
      VARIACAO_ID,
      2,
      'venda-1',
      'operador-1',
      MotivoMovimentacaoEstoque.VENDA_PDV,
      tx,
    );
  });

  test('validarSaldoDisponivel fails when current balance is below quantity', async () => {
    const repo = {
      findSaldoByVariacaoId: jest.fn().mockResolvedValue({
        isFailure: false,
        instance: { saldoAtual: 1 },
      }),
    };
    const adapter = new EstoqueGatewayAdapter({} as any, repo as any);

    const result = await adapter.validarSaldoDisponivel(VARIACAO_ID, 2);

    expect(result.isFailure).toBe(true);
    expect(result.errors).toContain('INSUFFICIENT_STOCK');
  });
});

describe('CaixaGatewayAdapter', () => {
  test('caixaAbertoDoOperador maps the session DTO to {sessaoCaixaId, aberta}', async () => {
    const port = {
      caixaAbertoDoOperador: jest.fn().mockResolvedValue({
        isFailure: false,
        instance: { id: SESSAO_ID, status: 'ABERTA' },
      }),
    };
    const adapter = new CaixaGatewayAdapter(port as any);

    const result = await adapter.caixaAbertoDoOperador(USUARIO_ID);

    expect(result.isOk).toBe(true);
    expect(result.instance).toEqual({ sessaoCaixaId: SESSAO_ID, aberta: true });
  });

  test('registrarVenda delegates to the caixa port, threading tx (RN09)', async () => {
    const port = {
      registrarVenda: jest.fn().mockResolvedValue({ isFailure: false }),
    };
    const adapter = new CaixaGatewayAdapter(port as any);

    const tx = {} as any;
    await adapter.registrarVenda(SESSAO_ID, 2500, tx);

    expect(port.registrarVenda).toHaveBeenCalledWith(SESSAO_ID, 2500, tx);
  });

  test('estornarVenda delegates to the caixa port, threading tx', async () => {
    const port = {
      estornarVenda: jest.fn().mockResolvedValue({ isFailure: false }),
    };
    const adapter = new CaixaGatewayAdapter(port as any);

    const tx = {} as any;
    await adapter.estornarVenda(SESSAO_ID, 2500, tx);

    expect(port.estornarVenda).toHaveBeenCalledWith(SESSAO_ID, 2500, tx);
  });

  test('isSessaoAberta reflects the session aberta flag via the port', async () => {
    const port = {
      isSessaoAberta: jest.fn().mockResolvedValue(Result.ok(false)),
    };
    const adapter = new CaixaGatewayAdapter(port as any);

    const result = await adapter.isSessaoAberta(SESSAO_ID);

    expect(result.isOk).toBe(true);
    expect(result.instance).toBe(false);
    expect(port.isSessaoAberta).toHaveBeenCalledWith(SESSAO_ID);
  });
});
