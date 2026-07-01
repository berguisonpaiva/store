import { Entity, EntityProps, Id, Result } from '@repo/shared'
import { VendaError } from '../errors'
import { VendaCalculatorService } from '../service/venda-calculator.service'
import { CanalVenda } from './canal-venda'
import { Desconto, DescontoProps } from './desconto.vo'
import { CreateItemVendaProps, ItemVenda } from './item-venda.entity'
import { CreatePagamentoProps, Pagamento } from './pagamento.entity'
import { StatusVenda } from './status-venda'

export interface VendaProps extends EntityProps {
  numero: number | null
  canal: CanalVenda
  status: StatusVenda
  usuarioId: string
  sessaoCaixaId: string
  itens: ItemVenda[]
  pagamentos: Pagamento[]
  desconto: Desconto
  concluidaEm: Date | null
  canceladaEm: Date | null
}

export interface AbrirVendaProps {
  id?: string
  usuarioId: string
  sessaoCaixaId: string
  numero?: number | null
}

/// Rehydration shape (e.g. from persistence). Children and discount are plain data.
export interface HydrateVendaProps extends EntityProps {
  numero: number | null
  status: StatusVenda
  usuarioId: string
  sessaoCaixaId: string
  itens: CreateItemVendaProps[]
  pagamentos: CreatePagamentoProps[]
  desconto?: DescontoProps | null
  concluidaEm?: Date | null
  canceladaEm?: Date | null
}

/// `Venda` aggregate root. Owns `ItemVenda` and `Pagamento`. Lifecycle
/// `ABERTA → CONCLUIDA | CANCELADA`; `CONCLUIDA` is immutable. `canal` is fixed `PDV`
/// (MVP 1). All monetary getters return integer cents. Mutating methods return a new
/// `Venda` via `Result` (no in-place setters).
export class Venda extends Entity<Venda, VendaProps> {
  private constructor(props: VendaProps) {
    super(props)
  }

  // --- factories -----------------------------------------------------------

  /// Validates a required id without throwing: empty/malformed → failed Result.
  private static requireId(value: string, attribute: string): Result<Id> {
    if (!value) {
      return Result.fail('INVALID_ID')
    }
    return Id.tryCreate(value, { attribute })
  }

  static abrir(props: AbrirVendaProps): Result<Venda> {
    const usuarioId = Venda.requireId(props.usuarioId, 'usuarioId')
    const sessaoCaixaId = Venda.requireId(props.sessaoCaixaId, 'sessaoCaixaId')

    const validated = Result.combine([usuarioId, sessaoCaixaId])
    if (validated.isFailure) {
      return validated.withFail
    }

    const [validUsuarioId, validSessaoCaixaId] = validated.instance

    return Result.ok(
      new Venda({
        id: props.id,
        numero: props.numero ?? null,
        canal: CanalVenda.PDV,
        status: StatusVenda.ABERTA,
        usuarioId: validUsuarioId.value,
        sessaoCaixaId: validSessaoCaixaId.value,
        itens: [],
        pagamentos: [],
        desconto: Desconto.zero(),
        concluidaEm: null,
        canceladaEm: null,
      }),
    )
  }

  static hydrate(props: HydrateVendaProps): Result<Venda> {
    const usuarioId = Venda.requireId(props.usuarioId, 'usuarioId')
    const sessaoCaixaId = Venda.requireId(props.sessaoCaixaId, 'sessaoCaixaId')
    const validated = Result.combine([usuarioId, sessaoCaixaId])
    if (validated.isFailure) {
      return validated.withFail
    }

    const itens: ItemVenda[] = []
    for (const itemProps of props.itens ?? []) {
      const item = ItemVenda.tryCreate(itemProps)
      if (item.isFailure) {
        return item.withFail
      }
      itens.push(item.instance)
    }

    const pagamentos: Pagamento[] = []
    for (const pagamentoProps of props.pagamentos ?? []) {
      const pagamento = Pagamento.tryCreate(pagamentoProps)
      if (pagamento.isFailure) {
        return pagamento.withFail
      }
      pagamentos.push(pagamento.instance)
    }

    let desconto = Desconto.zero()
    if (props.desconto) {
      const descontoResult = Desconto.tryCreate(props.desconto)
      if (descontoResult.isFailure) {
        return descontoResult.withFail
      }
      desconto = descontoResult.instance
    }

    const [validUsuarioId, validSessaoCaixaId] = validated.instance

    return Result.ok(
      new Venda({
        id: props.id,
        createdAt: props.createdAt,
        updatedAt: props.updatedAt,
        deletedAt: props.deletedAt,
        numero: props.numero ?? null,
        canal: CanalVenda.PDV,
        status: props.status,
        usuarioId: validUsuarioId.value,
        sessaoCaixaId: validSessaoCaixaId.value,
        itens,
        pagamentos,
        desconto,
        concluidaEm: props.concluidaEm ?? null,
        canceladaEm: props.canceladaEm ?? null,
      }),
    )
  }

  // --- internal helpers ----------------------------------------------------

  private rebuild(overrides: Partial<VendaProps>): Venda {
    return new Venda({
      id: this.id,
      createdAt: this.createdAt,
      updatedAt: new Date(),
      deletedAt: this.deletedAt,
      numero: this.props.numero,
      canal: this.props.canal,
      status: this.props.status,
      usuarioId: this.props.usuarioId,
      sessaoCaixaId: this.props.sessaoCaixaId,
      itens: this.props.itens,
      pagamentos: this.props.pagamentos,
      desconto: this.props.desconto,
      concluidaEm: this.props.concluidaEm,
      canceladaEm: this.props.canceladaEm,
      ...overrides,
    })
  }

  private ensureAberta(): Result<void> {
    if (this.props.status === StatusVenda.CONCLUIDA) {
      return Result.fail(VendaError.SALE_ALREADY_FINALIZED)
    }
    if (this.props.status !== StatusVenda.ABERTA) {
      return Result.fail(VendaError.SALE_NOT_OPEN)
    }
    return Result.ok()
  }

  // --- write behavior ------------------------------------------------------

  adicionarItem(props: CreateItemVendaProps): Result<Venda> {
    const open = this.ensureAberta()
    if (open.isFailure) {
      return open.withFail
    }

    const item = ItemVenda.tryCreate(props)
    if (item.isFailure) {
      return item.withFail
    }

    return Result.ok(this.rebuild({ itens: [...this.props.itens, item.instance] }))
  }

  removerItem(itemId: string): Result<Venda> {
    const open = this.ensureAberta()
    if (open.isFailure) {
      return open.withFail
    }

    const exists = this.props.itens.some((item) => item.id === itemId)
    if (!exists) {
      return Result.fail(VendaError.ITEM_NOT_FOUND)
    }

    const itens = this.props.itens.filter((item) => item.id !== itemId)
    return Result.ok(this.rebuildWithDescontoRevalidated(itens))
  }

  alterarQuantidadeItem(itemId: string, quantidade: number): Result<Venda> {
    const open = this.ensureAberta()
    if (open.isFailure) {
      return open.withFail
    }

    const index = this.props.itens.findIndex((item) => item.id === itemId)
    if (index < 0) {
      return Result.fail(VendaError.ITEM_NOT_FOUND)
    }

    const changed = this.props.itens[index]!.withQuantidade(quantidade)
    if (changed.isFailure) {
      return changed.withFail
    }

    const itens = [...this.props.itens]
    itens[index] = changed.instance
    return Result.ok(this.rebuildWithDescontoRevalidated(itens))
  }

  /// After items change, an existing absolute discount might now exceed the new
  /// subtotal. We keep the discount as-is (it stays capped at amount level via
  /// `amountFor`), so totals are always consistent. This helper just rebuilds.
  private rebuildWithDescontoRevalidated(itens: ItemVenda[]): Venda {
    return this.rebuild({ itens })
  }

  aplicarDesconto(props: DescontoProps): Result<Venda> {
    const open = this.ensureAberta()
    if (open.isFailure) {
      return open.withFail
    }

    const desconto = Desconto.tryCreate(props)
    if (desconto.isFailure) {
      return desconto.withFail
    }

    const subtotal = VendaCalculatorService.subtotal(this.props.itens)
    if (desconto.instance.exceedsSubtotal(subtotal)) {
      return Result.fail(VendaError.DISCOUNT_EXCEEDS_SUBTOTAL)
    }

    return Result.ok(this.rebuild({ desconto: desconto.instance }))
  }

  adicionarPagamento(props: CreatePagamentoProps): Result<Venda> {
    const open = this.ensureAberta()
    if (open.isFailure) {
      return open.withFail
    }

    const pagamento = Pagamento.tryCreate(props)
    if (pagamento.isFailure) {
      return pagamento.withFail
    }

    return Result.ok(this.rebuild({ pagamentos: [...this.props.pagamentos, pagamento.instance] }))
  }

  definirPagamentos(pagamentos: CreatePagamentoProps[]): Result<Venda> {
    const open = this.ensureAberta()
    if (open.isFailure) {
      return open.withFail
    }

    const built: Pagamento[] = []
    for (const props of pagamentos) {
      const pagamento = Pagamento.tryCreate(props)
      if (pagamento.isFailure) {
        return pagamento.withFail
      }
      built.push(pagamento.instance)
    }

    return Result.ok(this.rebuild({ pagamentos: built }))
  }

  /// Assign the unique sequential receipt number (idempotent guard left to caller).
  atribuirNumero(numero: number): Result<Venda> {
    const open = this.ensureAberta()
    if (open.isFailure) {
      return open.withFail
    }
    return Result.ok(this.rebuild({ numero }))
  }

  /// Transition to CONCLUIDA. Enforces: open, has items, `Σ pagamentos = total`.
  concluir(now: Date = new Date()): Result<Venda> {
    const open = this.ensureAberta()
    if (open.isFailure) {
      return open.withFail
    }

    if (this.props.itens.length === 0) {
      return Result.fail(VendaError.SALE_HAS_NO_ITEMS)
    }

    if (this.totalPagamentos !== this.total) {
      return Result.fail(VendaError.PAYMENT_MISMATCH)
    }

    return Result.ok(this.rebuild({ status: StatusVenda.CONCLUIDA, concluidaEm: now }))
  }

  /// Transition to CANCELADA. Blocked when already CONCLUIDA's immutability does not
  /// apply — a CONCLUIDA sale can still be cancelled (estorno) while its session is
  /// open; that session check lives in the use case. A CANCELADA sale cannot be
  /// cancelled again.
  cancelar(now: Date = new Date()): Result<Venda> {
    if (this.props.status === StatusVenda.CANCELADA) {
      return Result.fail(VendaError.SALE_NOT_OPEN)
    }
    return Result.ok(this.rebuild({ status: StatusVenda.CANCELADA, canceladaEm: now }))
  }

  // --- getters -------------------------------------------------------------

  get numero(): number | null {
    return this.props.numero
  }

  get canal(): CanalVenda {
    return this.props.canal
  }

  get status(): StatusVenda {
    return this.props.status
  }

  get usuarioId(): string {
    return this.props.usuarioId
  }

  get sessaoCaixaId(): string {
    return this.props.sessaoCaixaId
  }

  get itens(): ItemVenda[] {
    return [...this.props.itens]
  }

  get pagamentos(): Pagamento[] {
    return [...this.props.pagamentos]
  }

  get descontoConfig(): Desconto {
    return this.props.desconto
  }

  get subtotal(): number {
    return VendaCalculatorService.subtotal(this.props.itens)
  }

  get desconto(): number {
    return VendaCalculatorService.totals(this.props.itens, this.props.desconto).desconto
  }

  get total(): number {
    return VendaCalculatorService.totals(this.props.itens, this.props.desconto).total
  }

  get totalPagamentos(): number {
    return VendaCalculatorService.totalPagamentos(this.props.pagamentos)
  }

  get concluidaEm(): Date | null {
    return this.props.concluidaEm
  }

  get canceladaEm(): Date | null {
    return this.props.canceladaEm
  }

  get isAberta(): boolean {
    return this.props.status === StatusVenda.ABERTA
  }

  get isConcluida(): boolean {
    return this.props.status === StatusVenda.CONCLUIDA
  }

  get isCancelada(): boolean {
    return this.props.status === StatusVenda.CANCELADA
  }
}
