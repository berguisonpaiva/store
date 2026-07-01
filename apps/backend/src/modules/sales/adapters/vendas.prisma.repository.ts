import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Result, TransactionContext } from '@repo/shared';
import {
  FormaPagamento,
  StatusVenda,
  TipoDesconto,
  Venda,
  VendaError,
  VendasRepository,
} from '@repo/sales';
import {
  PrismaService,
  PrismaTransactionContext,
} from '../../../db/prisma.service';
import { centsToDecimal, decimalToCents } from './money';

type VendaRow = Prisma.VendaGetPayload<{
  include: { itens: true; pagamentos: true };
}>;

/// Write-side Prisma adapter for the `Venda` aggregate (root + items + payments).
/// Money is persisted as `Decimal` (reais) and converted to/from integer cents at
/// this boundary so the domain keeps its precise cents representation with no
/// floating-point drift. Enlists in the sale transaction when a `tx` is passed.
@Injectable()
export class VendasPrismaRepository implements VendasRepository {
  constructor(private readonly prisma: PrismaService) {}

  private client(tx?: TransactionContext): PrismaService['client'] {
    return (
      ((tx as PrismaTransactionContext | undefined)?.client as
        | PrismaService['client']
        | undefined) ?? this.prisma.client
    );
  }

  async create(venda: Venda, tx?: TransactionContext): Promise<Result<void>> {
    try {
      const client = this.client(tx);
      await client.venda.create({ data: this.fromDomain(venda) });
      return Result.ok();
    } catch (error) {
      return this.mapError(error);
    }
  }

  async update(venda: Venda, tx?: TransactionContext): Promise<Result<void>> {
    try {
      const client = this.client(tx);
      // Assign the receipt `numero` from the sequence the first time a sale reaches
      // CONCLUIDA (design D4: assign at finalization so abandoned ABERTA carts never
      // consume a number). The domain leaves `numero` null until persisted here.
      const numero = await this.resolveNumero(venda, tx);
      // Children are rewritten wholesale: the aggregate is the unit of consistency
      // and item/payment ids are owned by the domain, so a delete-then-recreate
      // keeps the rows in lockstep with the in-memory aggregate.
      await client.itemVenda.deleteMany({ where: { vendaId: venda.id } });
      await client.pagamento.deleteMany({ where: { vendaId: venda.id } });
      await client.venda.update({
        where: { id: venda.id },
        data: {
          numero,
          status: venda.status,
          subtotal: centsToDecimal(venda.subtotal),
          desconto: centsToDecimal(venda.desconto),
          total: centsToDecimal(venda.total),
          concluidaEm: venda.concluidaEm,
          canceladaEm: venda.canceladaEm,
          itens: { create: this.itensData(venda) },
          pagamentos: { create: this.pagamentosData(venda) },
        },
      });
      return Result.ok();
    } catch (error) {
      return this.mapError(error);
    }
  }

  /// Keeps an already-assigned `numero`; otherwise draws a fresh one from the
  /// sequence when (and only when) the sale is being finalized (CONCLUIDA).
  private async resolveNumero(
    venda: Venda,
    tx?: TransactionContext,
  ): Promise<number | null> {
    if (venda.numero !== null) {
      return venda.numero;
    }
    if (venda.status !== StatusVenda.CONCLUIDA) {
      return null;
    }
    const next = await this.proximoNumero(tx);
    return next.isOk ? next.instance : null;
  }

  async findById(id: string): Promise<Result<Venda | null>> {
    const row = await this.prisma.client.venda.findUnique({
      where: { id },
      include: { itens: true, pagamentos: true },
    });

    if (!row) {
      return Result.ok(null);
    }

    return this.toDomain(row);
  }

  /// Atomic receipt number from the DB sequence (design D4). `nextval` is atomic
  /// and non-transactional, so concurrent sales never collide; the UNIQUE index on
  /// `numero` is the backstop.
  async proximoNumero(tx?: TransactionContext): Promise<Result<number>> {
    const client = this.client(tx);
    const rows = await client.$queryRaw<Array<{ nextval: bigint }>>`
      SELECT nextval('vendas_numero_seq') AS nextval
    `;
    const next = rows[0]?.nextval ?? BigInt(0);
    return Result.ok(Number(next));
  }

  private fromDomain(venda: Venda): Prisma.VendaUncheckedCreateInput {
    return {
      id: venda.id,
      numero: venda.numero,
      canal: venda.canal,
      status: venda.status,
      usuarioId: venda.usuarioId,
      sessaoCaixaId: venda.sessaoCaixaId,
      subtotal: centsToDecimal(venda.subtotal),
      desconto: centsToDecimal(venda.desconto),
      total: centsToDecimal(venda.total),
      criadaEm: venda.createdAt,
      concluidaEm: venda.concluidaEm,
      canceladaEm: venda.canceladaEm,
      itens: { create: this.itensData(venda) },
      pagamentos: { create: this.pagamentosData(venda) },
    };
  }

  private itensData(venda: Venda): Prisma.ItemVendaCreateWithoutVendaInput[] {
    return venda.itens.map((item) => ({
      id: item.id,
      variacaoId: item.variacaoId,
      quantidade: item.quantidade,
      precoUnitario: centsToDecimal(item.precoUnitario),
      total: centsToDecimal(item.total),
    }));
  }

  private pagamentosData(
    venda: Venda,
  ): Prisma.PagamentoCreateWithoutVendaInput[] {
    return venda.pagamentos.map((pagamento) => ({
      id: pagamento.id,
      forma: pagamento.forma,
      valor: centsToDecimal(pagamento.valor),
    }));
  }

  private toDomain(row: VendaRow): Result<Venda> {
    return Venda.hydrate({
      id: row.id,
      numero: row.numero,
      status: row.status as StatusVenda,
      usuarioId: row.usuarioId,
      sessaoCaixaId: row.sessaoCaixaId,
      itens: row.itens.map((item) => ({
        id: item.id,
        variacaoId: item.variacaoId,
        quantidade: item.quantidade,
        precoUnitario: decimalToCents(item.precoUnitario),
      })),
      pagamentos: row.pagamentos.map((pagamento) => ({
        id: pagamento.id,
        forma: pagamento.forma as FormaPagamento,
        valor: decimalToCents(pagamento.valor),
      })),
      desconto: this.descontoFromRow(row),
      concluidaEm: row.concluidaEm,
      canceladaEm: row.canceladaEm,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  /// The persisted `desconto` is the resolved amount (cents). When non-zero we
  /// rehydrate it as an absolute `VALOR` discount so totals reconstruct exactly.
  private descontoFromRow(
    row: VendaRow,
  ): { tipo: TipoDesconto; valor: number } | null {
    const desconto = decimalToCents(row.desconto);
    if (desconto <= 0) {
      return null;
    }
    return { tipo: TipoDesconto.VALOR, valor: desconto };
  }

  private mapError(error: unknown): Result<void> {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Unique `numero` collision backstop (the sequence makes this practically
      // unreachable, but the constraint is authoritative).
      if (error.code === 'P2002') {
        return Result.fail(VendaError.SALE_ALREADY_FINALIZED);
      }
    }
    throw error;
  }
}
