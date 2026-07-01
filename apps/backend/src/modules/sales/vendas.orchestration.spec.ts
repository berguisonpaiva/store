import { Result, TransactionContext, TransactionManager } from '@repo/shared';
import {
  CaixaGateway,
  CancelarVenda,
  EstoqueGateway,
  FinalizarVenda,
  FormaPagamento,
  SessaoCaixaResumo,
  StatusVenda,
  Venda,
  VendaError,
  VendasRepository,
} from '@repo/sales';

const USUARIO_ID = '11111111-1111-1111-1111-111111111111';
const SESSAO_ID = '22222222-2222-2222-2222-222222222222';
const VARIACAO_ID = '33333333-3333-3333-3333-333333333333';

/// In-memory repository standing in for `VendasPrismaRepository`. Records whether
/// it was reached inside a transaction so rollback assertions can be precise.
class FakeVendasRepository implements VendasRepository {
  private store = new Map<string, Venda>();
  private seq = 0;
  updates: Venda[] = [];

  async create(venda: Venda): Promise<Result<void>> {
    this.store.set(venda.id, venda);
    return Result.ok();
  }
  async update(venda: Venda): Promise<Result<void>> {
    this.updates.push(venda);
    this.store.set(venda.id, venda);
    return Result.ok();
  }
  async findById(id: string): Promise<Result<Venda | null>> {
    return Result.ok(this.store.get(id) ?? null);
  }
  async proximoNumero(): Promise<Result<number>> {
    this.seq += 1;
    return Result.ok(this.seq);
  }
  current(id: string): Venda | null {
    return this.store.get(id) ?? null;
  }
}

/// Fake stock gateway tracking applied take-downs so rollback (estorno) can be
/// asserted: a clean rollback leaves the net effect at zero.
class FakeEstoqueGateway implements EstoqueGateway {
  baixas: Array<{ variacaoId: string; quantidade: number }> = [];
  estornos: Array<{ variacaoId: string; quantidade: number }> = [];
  failDarBaixa = false;

  async validarSaldoDisponivel(): Promise<Result<void>> {
    return Result.ok();
  }
  async darBaixa(
    variacaoId: string,
    quantidade: number,
  ): Promise<Result<void>> {
    if (this.failDarBaixa) {
      return Result.fail(VendaError.INSUFFICIENT_STOCK);
    }
    this.baixas.push({ variacaoId, quantidade });
    return Result.ok();
  }
  async estornar(
    variacaoId: string,
    quantidade: number,
  ): Promise<Result<void>> {
    this.estornos.push({ variacaoId, quantidade });
    return Result.ok();
  }
  netStock(variacaoId: string): number {
    const out = this.baixas
      .filter((b) => b.variacaoId === variacaoId)
      .reduce((s, b) => s + b.quantidade, 0);
    const back = this.estornos
      .filter((e) => e.variacaoId === variacaoId)
      .reduce((s, e) => s + e.quantidade, 0);
    return out - back;
  }
}

class FakeCaixaGateway implements CaixaGateway {
  vendasRegistradas: number[] = [];
  estornos: number[] = [];
  sessaoAberta = true;
  failRegistrarVenda = false;

  async caixaAbertoDoOperador(): Promise<Result<SessaoCaixaResumo | null>> {
    return Result.ok({ sessaoCaixaId: SESSAO_ID, aberta: true });
  }
  async isSessaoAberta(): Promise<Result<boolean>> {
    return Result.ok(this.sessaoAberta);
  }
  async registrarVenda(_sessao: string, valor: number): Promise<Result<void>> {
    if (this.failRegistrarVenda) {
      return Result.fail('CASH_WRITE_FAILED');
    }
    this.vendasRegistradas.push(valor);
    return Result.ok();
  }
  async estornarVenda(_sessao: string, valor: number): Promise<Result<void>> {
    this.estornos.push(valor);
    return Result.ok();
  }
}

/// Fake transaction manager that simply runs the operation (the fakes are
/// in-memory; the contract under test is the orchestration order and rollback).
class FakeTransactionManager implements TransactionManager {
  ran = 0;
  async runInTransaction<T>(
    operation: (context: TransactionContext) => Promise<T>,
  ): Promise<T> {
    this.ran += 1;
    return operation({} as TransactionContext);
  }
}

async function seedOpenSaleWithItem(repo: FakeVendasRepository): Promise<Venda> {
  const venda = Venda.abrir({ usuarioId: USUARIO_ID, sessaoCaixaId: SESSAO_ID })
    .instance.adicionarItem({
      variacaoId: VARIACAO_ID,
      quantidade: 2,
      precoUnitario: 1500,
    }).instance;
  await repo.create(venda);
  return venda;
}

describe('FinalizarVenda orchestration', () => {
  test('happy path: stock down + payment + cash + CONCLUIDA, all in one transaction', async () => {
    const repo = new FakeVendasRepository();
    const estoque = new FakeEstoqueGateway();
    const caixa = new FakeCaixaGateway();
    const tx = new FakeTransactionManager();
    const venda = await seedOpenSaleWithItem(repo);

    const useCase = new FinalizarVenda(repo, estoque, caixa, tx);
    const result = await useCase.execute({
      vendaId: venda.id,
      pagamentos: [{ forma: FormaPagamento.DINHEIRO, valor: 3000 }],
    });

    expect(result.isOk).toBe(true);
    expect(result.instance.status).toBe(StatusVenda.CONCLUIDA);
    expect(tx.ran).toBe(1);
    expect(estoque.netStock(VARIACAO_ID)).toBe(2); // stock taken down
    expect(caixa.vendasRegistradas).toEqual([3000]);
    expect(repo.current(venda.id)!.status).toBe(StatusVenda.CONCLUIDA);
  });

  test('injected cash failure rolls everything back: stock restored, sale stays ABERTA', async () => {
    const repo = new FakeVendasRepository();
    const estoque = new FakeEstoqueGateway();
    const caixa = new FakeCaixaGateway();
    caixa.failRegistrarVenda = true; // fail AFTER stock take-down
    const tx = new FakeTransactionManager();
    const venda = await seedOpenSaleWithItem(repo);

    const useCase = new FinalizarVenda(repo, estoque, caixa, tx);
    const result = await useCase.execute({
      vendaId: venda.id,
      pagamentos: [{ forma: FormaPagamento.DINHEIRO, valor: 3000 }],
    });

    expect(result.isFailure).toBe(true);
    // Stock was taken down then estorno'd back -> net zero (not reduced).
    expect(estoque.netStock(VARIACAO_ID)).toBe(0);
    expect(caixa.vendasRegistradas).toEqual([]);
    // The persisted sale is restored to ABERTA (never CONCLUIDA).
    expect(repo.current(venda.id)!.status).toBe(StatusVenda.ABERTA);
  });

  test('payment mismatch fails before any stock/cash side effect', async () => {
    const repo = new FakeVendasRepository();
    const estoque = new FakeEstoqueGateway();
    const caixa = new FakeCaixaGateway();
    const tx = new FakeTransactionManager();
    const venda = await seedOpenSaleWithItem(repo);

    const useCase = new FinalizarVenda(repo, estoque, caixa, tx);
    const result = await useCase.execute({
      vendaId: venda.id,
      pagamentos: [{ forma: FormaPagamento.DINHEIRO, valor: 100 }], // != 3000
    });

    expect(result.isFailure).toBe(true);
    expect(result.errors).toContain(VendaError.PAYMENT_MISMATCH);
    expect(estoque.netStock(VARIACAO_ID)).toBe(0);
    expect(caixa.vendasRegistradas).toEqual([]);
  });
});

describe('CancelarVenda orchestration', () => {
  async function finalizedSale(
    repo: FakeVendasRepository,
    estoque: FakeEstoqueGateway,
    caixa: FakeCaixaGateway,
  ): Promise<Venda> {
    const venda = await seedOpenSaleWithItem(repo);
    const tx = new FakeTransactionManager();
    await new FinalizarVenda(repo, estoque, caixa, tx).execute({
      vendaId: venda.id,
      pagamentos: [{ forma: FormaPagamento.DINHEIRO, valor: 3000 }],
    });
    return venda;
  }

  test('cancel of a concluded sale estornos stock + reverses cash + CANCELADA', async () => {
    const repo = new FakeVendasRepository();
    const estoque = new FakeEstoqueGateway();
    const caixa = new FakeCaixaGateway();
    const venda = await finalizedSale(repo, estoque, caixa);

    const tx = new FakeTransactionManager();
    const result = await new CancelarVenda(repo, estoque, caixa, tx).execute({
      vendaId: venda.id,
    });

    expect(result.isOk).toBe(true);
    expect(result.instance.status).toBe(StatusVenda.CANCELADA);
    expect(estoque.netStock(VARIACAO_ID)).toBe(0); // taken down then returned
    expect(caixa.estornos).toEqual([3000]);
    expect(repo.current(venda.id)!.status).toBe(StatusVenda.CANCELADA);
  });

  test('cancel is blocked once the cash session is closed', async () => {
    const repo = new FakeVendasRepository();
    const estoque = new FakeEstoqueGateway();
    const caixa = new FakeCaixaGateway();
    const venda = await finalizedSale(repo, estoque, caixa);
    caixa.sessaoAberta = false; // session closed after finalize

    const tx = new FakeTransactionManager();
    const result = await new CancelarVenda(repo, estoque, caixa, tx).execute({
      vendaId: venda.id,
    });

    expect(result.isFailure).toBe(true);
    expect(result.errors).toContain(VendaError.CASH_SESSION_CLOSED);
    expect(caixa.estornos).toEqual([]); // nothing reversed
    expect(repo.current(venda.id)!.status).toBe(StatusVenda.CONCLUIDA); // unchanged
  });
});
