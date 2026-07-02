import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Result } from '@repo/shared';
import { UserRole } from '@repo/auth';
import {
  AdicionarItem,
  AdicionarPagamento,
  AlterarQuantidadeItem,
  AplicarDesconto,
  BuscarVenda,
  CancelarVenda,
  CanalVenda,
  CriarVenda,
  FinalizarVenda,
  FormaPagamento,
  ListarVendas,
  RemoverItem,
  ResumoVendas,
  StatusVenda,
  TipoDesconto,
  VendaError,
} from '@repo/sales';
import { VariacaoPrismaReader } from './adapters/variacao.prisma.reader';
import { TipoDescontoHttp } from './dto';
import { VendasCommandsController } from './vendas-commands.controller';
import { VendasQueriesController } from './vendas-queries.controller';

const USUARIO_ID = '11111111-1111-1111-1111-111111111111';
const SESSAO_ID = '22222222-2222-2222-2222-222222222222';
const VENDA_ID = '33333333-3333-3333-3333-333333333333';
const VARIACAO_ID = '44444444-4444-4444-4444-444444444444';
const ITEM_ID = '55555555-5555-5555-5555-555555555555';

function vendaDTO(overrides: Record<string, any> = {}) {
  return {
    id: VENDA_ID,
    numero: null,
    canal: CanalVenda.PDV,
    status: StatusVenda.ABERTA,
    usuarioId: USUARIO_ID,
    sessaoCaixaId: SESSAO_ID,
    subtotal: 3000,
    desconto: 0,
    total: 3000,
    itens: [],
    pagamentos: [],
    concluidaEm: null,
    canceladaEm: null,
    criadoEm: new Date('2026-06-30T10:00:00Z'),
    ...overrides,
  };
}

describe('Vendas controllers', () => {
  let commands: VendasCommandsController;
  let queries: VendasQueriesController;

  const criarVenda = { execute: jest.fn() };
  const adicionarItem = { execute: jest.fn() };
  const removerItem = { execute: jest.fn() };
  const alterarQuantidadeItem = { execute: jest.fn() };
  const adicionarPagamento = { execute: jest.fn() };
  const aplicarDesconto = { execute: jest.fn() };
  const finalizarVenda = { execute: jest.fn() };
  const cancelarVenda = { execute: jest.fn() };
  const buscarVenda = { execute: jest.fn() };
  const listarVendas = { execute: jest.fn() };
  const resumoVendas = { execute: jest.fn() };
  const variacaoReader = { resolver: jest.fn() };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [VendasCommandsController, VendasQueriesController],
      providers: [
        { provide: CriarVenda, useValue: criarVenda },
        { provide: AdicionarItem, useValue: adicionarItem },
        { provide: RemoverItem, useValue: removerItem },
        { provide: AlterarQuantidadeItem, useValue: alterarQuantidadeItem },
        { provide: AdicionarPagamento, useValue: adicionarPagamento },
        { provide: AplicarDesconto, useValue: aplicarDesconto },
        { provide: FinalizarVenda, useValue: finalizarVenda },
        { provide: CancelarVenda, useValue: cancelarVenda },
        { provide: BuscarVenda, useValue: buscarVenda },
        { provide: ListarVendas, useValue: listarVendas },
        { provide: ResumoVendas, useValue: resumoVendas },
        { provide: VariacaoPrismaReader, useValue: variacaoReader },
      ],
    }).compile();

    commands = module.get(VendasCommandsController);
    queries = module.get(VendasQueriesController);
  });

  // --- Happy paths -----------------------------------------------------------

  test('criar derives usuarioId from the token (never the body)', async () => {
    criarVenda.execute.mockResolvedValue(Result.ok(vendaDTO()));

    const out = await commands.criar(USUARIO_ID, {});

    expect(criarVenda.execute).toHaveBeenCalledWith({ usuarioId: USUARIO_ID });
    expect(out.id).toBe(VENDA_ID);
    expect(out.subtotal).toBe(30); // cents -> reais
  });

  test('adicionar resolves the identifier and delegates WITHOUT a price (RN10)', async () => {
    variacaoReader.resolver.mockResolvedValue({ variacaoId: VARIACAO_ID });
    adicionarItem.execute.mockResolvedValue(Result.ok(vendaDTO()));

    await commands.adicionar(VENDA_ID, { sku: 'ABC', quantidade: 2 });

    expect(variacaoReader.resolver).toHaveBeenCalledWith({
      variacaoId: undefined,
      sku: 'ABC',
      codigoBarras: undefined,
    });
    // The price snapshot is resolved by the domain via VariacaoGateway, never here.
    expect(adicionarItem.execute).toHaveBeenCalledWith({
      vendaId: VENDA_ID,
      variacaoId: VARIACAO_ID,
      quantidade: 2,
    });
  });

  test('adicionar with no identifier returns 400', async () => {
    await expect(
      commands.adicionar(VENDA_ID, { quantidade: 1 }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  test('adicionar with an unresolved identifier returns 404 (VARIACAO_NAO_ENCONTRADA)', async () => {
    variacaoReader.resolver.mockResolvedValue(null);

    await expect(
      commands.adicionar(VENDA_ID, { sku: 'NOPE', quantidade: 1 }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  test('quantidade delegates to AlterarQuantidadeItem with the caller usuarioId', async () => {
    alterarQuantidadeItem.execute.mockResolvedValue(Result.ok(vendaDTO()));

    const out = await commands.quantidade(USUARIO_ID, VENDA_ID, ITEM_ID, {
      quantidade: 5,
    });

    expect(alterarQuantidadeItem.execute).toHaveBeenCalledWith({
      vendaId: VENDA_ID,
      itemId: ITEM_ID,
      quantidade: 5,
      usuarioId: USUARIO_ID,
    });
    expect(out.id).toBe(VENDA_ID);
  });

  test('pagamento converts valor from reais to cents and passes the caller usuarioId', async () => {
    adicionarPagamento.execute.mockResolvedValue(
      Result.ok(
        vendaDTO({
          pagamentos: [{ id: ITEM_ID, forma: FormaPagamento.PIX, valor: 1250 }],
        }),
      ),
    );

    const out = await commands.pagamento(USUARIO_ID, VENDA_ID, {
      forma: FormaPagamento.PIX,
      valor: 12.5,
    });

    expect(adicionarPagamento.execute).toHaveBeenCalledWith({
      vendaId: VENDA_ID,
      usuarioId: USUARIO_ID,
      forma: FormaPagamento.PIX,
      valor: 1250,
    });
    expect(out.pagamentos[0].valor).toBe(12.5); // cents -> reais
  });

  test('remover delegates to RemoverItem', async () => {
    removerItem.execute.mockResolvedValue(Result.ok(vendaDTO()));

    await commands.remover(VENDA_ID, ITEM_ID);

    expect(removerItem.execute).toHaveBeenCalledWith({
      vendaId: VENDA_ID,
      itemId: ITEM_ID,
    });
  });

  test('desconto converts a "valor" discount from reais to cents', async () => {
    aplicarDesconto.execute.mockResolvedValue(Result.ok(vendaDTO()));

    await commands.desconto(VENDA_ID, {
      tipo: TipoDescontoHttp.VALOR,
      valor: 5,
    });

    expect(aplicarDesconto.execute).toHaveBeenCalledWith({
      vendaId: VENDA_ID,
      tipo: TipoDesconto.VALOR,
      valor: 500,
    });
  });

  test('desconto passes a "percentual" value through as a percentage', async () => {
    aplicarDesconto.execute.mockResolvedValue(Result.ok(vendaDTO()));

    await commands.desconto(VENDA_ID, {
      tipo: TipoDescontoHttp.PERCENTUAL,
      valor: 10,
    });

    expect(aplicarDesconto.execute).toHaveBeenCalledWith({
      vendaId: VENDA_ID,
      tipo: TipoDesconto.PERCENTUAL,
      valor: 10,
    });
  });

  test('finalizar converts payment amounts to cents and returns reais', async () => {
    finalizarVenda.execute.mockResolvedValue(
      Result.ok(
        vendaDTO({
          status: StatusVenda.CONCLUIDA,
          numero: 12,
          total: 3000,
          pagamentos: [
            { id: ITEM_ID, forma: FormaPagamento.DINHEIRO, valor: 3000 },
          ],
        }),
      ),
    );

    const out = await commands.finalizar(VENDA_ID, {
      pagamentos: [{ forma: FormaPagamento.DINHEIRO, valor: 30 }],
    });

    expect(finalizarVenda.execute).toHaveBeenCalledWith({
      vendaId: VENDA_ID,
      pagamentos: [{ forma: FormaPagamento.DINHEIRO, valor: 3000 }],
    });
    expect(out.status).toBe(StatusVenda.CONCLUIDA);
    expect(out.numero).toBe(12);
    expect(out.pagamentos[0].valor).toBe(30);
  });

  test('cancelar delegates to CancelarVenda', async () => {
    cancelarVenda.execute.mockResolvedValue(
      Result.ok(vendaDTO({ status: StatusVenda.CANCELADA })),
    );

    const out = await commands.cancelar(VENDA_ID);

    expect(cancelarVenda.execute).toHaveBeenCalledWith({ vendaId: VENDA_ID });
    expect(out.status).toBe(StatusVenda.CANCELADA);
  });

  test('buscar returns the sale in reais for its owner', async () => {
    buscarVenda.execute.mockResolvedValue(
      Result.ok(vendaDTO({ subtotal: 3000, desconto: 500, total: 2500 })),
    );

    const out = await queries.buscar(USUARIO_ID, UserRole.OPERADOR, VENDA_ID);

    expect(out.subtotal).toBe(30);
    expect(out.desconto).toBe(5);
    expect(out.total).toBe(25);
  });

  test('buscar returns another operator sale to an ADMIN', async () => {
    buscarVenda.execute.mockResolvedValue(
      Result.ok(vendaDTO({ usuarioId: 'someone-else' })),
    );

    const out = await queries.buscar(USUARIO_ID, UserRole.ADMIN, VENDA_ID);

    expect(out.id).toBe(VENDA_ID);
  });

  test('buscar forbids a non-ADMIN reading another operator sale (ACESSO_NEGADO)', async () => {
    buscarVenda.execute.mockResolvedValue(
      Result.ok(vendaDTO({ usuarioId: 'someone-else' })),
    );

    await expect(
      queries.buscar(USUARIO_ID, UserRole.OPERADOR, VENDA_ID),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  test('listar scopes a non-ADMIN to their own sales (ignores usuarioId filter)', async () => {
    listarVendas.execute.mockResolvedValue(
      Result.ok({
        data: [vendaDTO({ total: 2500 })],
        meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
      }),
    );

    const out = await queries.listar(USUARIO_ID, UserRole.OPERADOR, {
      page: 1,
      pageSize: 20,
      usuarioId: 'someone-else',
    });

    expect(listarVendas.execute).toHaveBeenCalledWith(
      expect.objectContaining({ usuarioId: USUARIO_ID }),
    );
    expect(out.data[0].total).toBe(25);
    expect(out.meta.total).toBe(1);
  });

  test('listar lets an ADMIN filter by any usuarioId', async () => {
    listarVendas.execute.mockResolvedValue(
      Result.ok({
        data: [],
        meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
      }),
    );

    await queries.listar(USUARIO_ID, UserRole.ADMIN, {
      page: 1,
      pageSize: 20,
      usuarioId: 'someone-else',
    });

    expect(listarVendas.execute).toHaveBeenCalledWith(
      expect.objectContaining({ usuarioId: 'someone-else' }),
    );
  });

  test('resumo returns aggregated totals in reais', async () => {
    resumoVendas.execute.mockResolvedValue(
      Result.ok({
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
      }),
    );

    const out = await queries.resumo(USUARIO_ID, UserRole.ADMIN, {});

    expect(out).toEqual({
      quantidade: 3,
      subtotal: 90,
      desconto: 10,
      total: 80,
      porFormaPagamento: [
        { forma: FormaPagamento.DINHEIRO, total: 50, quantidade: 2 },
        { forma: FormaPagamento.CARTAO_DEBITO, total: 0, quantidade: 0 },
        { forma: FormaPagamento.CARTAO_CREDITO, total: 0, quantidade: 0 },
        { forma: FormaPagamento.PIX, total: 30, quantidade: 1 },
      ],
    });
  });

  // --- Error rows (one assertion per mapped status) --------------------------

  test('criar maps NO_OPEN_CASH_SESSION -> 409', async () => {
    criarVenda.execute.mockResolvedValue(
      Result.fail(VendaError.NO_OPEN_CASH_SESSION),
    );
    await expect(commands.criar(USUARIO_ID, {})).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  test('adicionar maps SALE_NOT_FOUND -> 404', async () => {
    variacaoReader.resolver.mockResolvedValue({ variacaoId: VARIACAO_ID });
    adicionarItem.execute.mockResolvedValue(
      Result.fail(VendaError.SALE_NOT_FOUND),
    );
    await expect(
      commands.adicionar(VENDA_ID, { variacaoId: VARIACAO_ID, quantidade: 1 }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  test('adicionar maps SALE_ALREADY_FINALIZED -> 409', async () => {
    variacaoReader.resolver.mockResolvedValue({ variacaoId: VARIACAO_ID });
    adicionarItem.execute.mockResolvedValue(
      Result.fail(VendaError.SALE_ALREADY_FINALIZED),
    );
    await expect(
      commands.adicionar(VENDA_ID, { variacaoId: VARIACAO_ID, quantidade: 1 }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  test('adicionar maps VARIACAO_NAO_ENCONTRADA (use case) -> 404', async () => {
    variacaoReader.resolver.mockResolvedValue({ variacaoId: VARIACAO_ID });
    adicionarItem.execute.mockResolvedValue(
      Result.fail(VendaError.VARIACAO_NAO_ENCONTRADA),
    );
    await expect(
      commands.adicionar(VENDA_ID, { variacaoId: VARIACAO_ID, quantidade: 1 }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  test('adicionar maps VARIACAO_INATIVA -> 422', async () => {
    variacaoReader.resolver.mockResolvedValue({ variacaoId: VARIACAO_ID });
    adicionarItem.execute.mockResolvedValue(
      Result.fail(VendaError.VARIACAO_INATIVA),
    );
    await expect(
      commands.adicionar(VENDA_ID, { variacaoId: VARIACAO_ID, quantidade: 1 }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });

  test('quantidade maps INSUFFICIENT_STOCK -> 422', async () => {
    alterarQuantidadeItem.execute.mockResolvedValue(
      Result.fail(VendaError.INSUFFICIENT_STOCK),
    );
    await expect(
      commands.quantidade(USUARIO_ID, VENDA_ID, ITEM_ID, { quantidade: 99 }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });

  test('quantidade maps ITEM_NOT_FOUND -> 404', async () => {
    alterarQuantidadeItem.execute.mockResolvedValue(
      Result.fail(VendaError.ITEM_NOT_FOUND),
    );
    await expect(
      commands.quantidade(USUARIO_ID, VENDA_ID, ITEM_ID, { quantidade: 2 }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  test('quantidade maps ACESSO_NEGADO (non-owner) -> 403', async () => {
    alterarQuantidadeItem.execute.mockResolvedValue(
      Result.fail(VendaError.ACESSO_NEGADO),
    );
    await expect(
      commands.quantidade(USUARIO_ID, VENDA_ID, ITEM_ID, { quantidade: 2 }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  test('pagamento maps ACESSO_NEGADO (non-owner) -> 403', async () => {
    adicionarPagamento.execute.mockResolvedValue(
      Result.fail(VendaError.ACESSO_NEGADO),
    );
    await expect(
      commands.pagamento(USUARIO_ID, VENDA_ID, {
        forma: FormaPagamento.DINHEIRO,
        valor: 10,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  test('pagamento maps SALE_ALREADY_FINALIZED -> 409', async () => {
    adicionarPagamento.execute.mockResolvedValue(
      Result.fail(VendaError.SALE_ALREADY_FINALIZED),
    );
    await expect(
      commands.pagamento(USUARIO_ID, VENDA_ID, {
        forma: FormaPagamento.DINHEIRO,
        valor: 10,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  test('finalizar maps INSUFFICIENT_STOCK -> 422', async () => {
    finalizarVenda.execute.mockResolvedValue(
      Result.fail(VendaError.INSUFFICIENT_STOCK),
    );
    await expect(
      commands.finalizar(VENDA_ID, {
        pagamentos: [{ forma: FormaPagamento.DINHEIRO, valor: 30 }],
      }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });

  test('finalizar maps PAYMENT_MISMATCH -> 422', async () => {
    finalizarVenda.execute.mockResolvedValue(
      Result.fail(VendaError.PAYMENT_MISMATCH),
    );
    await expect(
      commands.finalizar(VENDA_ID, {
        pagamentos: [{ forma: FormaPagamento.DINHEIRO, valor: 30 }],
      }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });

  test('cancelar maps CASH_SESSION_CLOSED -> 409', async () => {
    cancelarVenda.execute.mockResolvedValue(
      Result.fail(VendaError.CASH_SESSION_CLOSED),
    );
    await expect(commands.cancelar(VENDA_ID)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  test('buscar maps SALE_NOT_FOUND -> 404', async () => {
    buscarVenda.execute.mockResolvedValue(
      Result.fail(VendaError.SALE_NOT_FOUND),
    );
    await expect(
      queries.buscar(USUARIO_ID, UserRole.OPERADOR, VENDA_ID),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  // --- Route ordering guard --------------------------------------------------

  test('queries controller declares /resumo before /:id so it is not shadowed', () => {
    const methods = Object.getOwnPropertyNames(
      VendasQueriesController.prototype,
    );
    expect(methods.indexOf('resumo')).toBeLessThan(methods.indexOf('buscar'));
  });
});
