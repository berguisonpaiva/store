import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PaginatedResultDTO, Result } from '@repo/shared';
import {
  CanalVenda,
  emptyPorFormaPagamento,
  FormaPagamento,
  ListarVendasInputDTO,
  ResumoVendasDTO,
  ResumoVendasInputDTO,
  StatusVenda,
  VendaDTO,
  VendasQuery,
} from '@repo/sales';
import { PrismaService } from '../../../db/prisma.service';
import { decimalToCents } from './money';

type VendaRow = Prisma.VendaGetPayload<{
  include: { itens: true; pagamentos: true };
}>;

/// Read-side Prisma projection for the `Venda` aggregate (CQRS-lite). Returns DTOs
/// with money in integer cents (converted from the persisted `Decimal` reais).
@Injectable()
export class VendasPrismaQuery implements VendasQuery {
  constructor(private readonly prisma: PrismaService) {}

  async buscarPorId(vendaId: string): Promise<Result<VendaDTO | null>> {
    const row = await this.prisma.client.venda.findUnique({
      where: { id: vendaId },
      include: { itens: true, pagamentos: true },
    });

    if (!row) {
      return Result.ok(null);
    }

    return Result.ok(this.toDTO(row));
  }

  async listar(
    input: ListarVendasInputDTO,
  ): Promise<Result<PaginatedResultDTO<VendaDTO>>> {
    const where = this.toWhere(input);

    const [rows, total] = await Promise.all([
      this.prisma.client.venda.findMany({
        where,
        include: { itens: true, pagamentos: true },
        orderBy: { criadaEm: 'desc' },
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize,
      }),
      this.prisma.client.venda.count({ where }),
    ]);

    return Result.ok({
      data: rows.map((row) => this.toDTO(row)),
      meta: {
        page: input.page,
        pageSize: input.pageSize,
        total,
        totalPages: Math.ceil(total / input.pageSize),
      },
    });
  }

  async resumo(input: ResumoVendasInputDTO): Promise<Result<ResumoVendasDTO>> {
    const where = this.toWhere(input);

    const [aggregate, porForma] = await Promise.all([
      this.prisma.client.venda.aggregate({
        where,
        _count: { _all: true },
        _sum: { subtotal: true, desconto: true, total: true },
      }),
      // RF30: total sold per payment method for the same filtered sales. Payments
      // only exist on finalized sales, so the venda relation filter scopes it to
      // this session/period/status.
      this.prisma.client.pagamento.groupBy({
        by: ['forma'],
        where: { venda: where },
        _count: { _all: true },
        _sum: { valor: true },
      }),
    ]);

    const porFormaPagamento = emptyPorFormaPagamento();
    for (const group of porForma) {
      const entry = porFormaPagamento.find(
        (item) => item.forma === (group.forma as FormaPagamento),
      );
      if (entry) {
        entry.total = decimalToCents(group._sum.valor ?? new Prisma.Decimal(0));
        entry.quantidade = group._count._all;
      }
    }

    return Result.ok({
      quantidade: aggregate._count._all,
      subtotal: decimalToCents(aggregate._sum.subtotal ?? new Prisma.Decimal(0)),
      desconto: decimalToCents(aggregate._sum.desconto ?? new Prisma.Decimal(0)),
      total: decimalToCents(aggregate._sum.total ?? new Prisma.Decimal(0)),
      porFormaPagamento,
    });
  }

  private toWhere(input: ResumoVendasInputDTO): Prisma.VendaWhereInput {
    const where: Prisma.VendaWhereInput = {};

    if (input.usuarioId) {
      where.usuarioId = input.usuarioId;
    }
    if (input.sessaoCaixaId) {
      where.sessaoCaixaId = input.sessaoCaixaId;
    }
    if (input.status) {
      where.status = input.status;
    }
    if (input.startDate || input.endDate) {
      where.criadaEm = {};
      if (input.startDate) {
        where.criadaEm.gte = input.startDate;
      }
      if (input.endDate) {
        where.criadaEm.lte = input.endDate;
      }
    }

    return where;
  }

  private toDTO(row: VendaRow): VendaDTO {
    const subtotal = decimalToCents(row.subtotal);
    const desconto = decimalToCents(row.desconto);
    const total = decimalToCents(row.total);

    return {
      id: row.id,
      numero: row.numero,
      canal: row.canal as CanalVenda,
      status: row.status as StatusVenda,
      usuarioId: row.usuarioId,
      sessaoCaixaId: row.sessaoCaixaId,
      subtotal,
      desconto,
      total,
      itens: row.itens.map((item) => ({
        id: item.id,
        variacaoId: item.variacaoId,
        quantidade: item.quantidade,
        precoUnitario: decimalToCents(item.precoUnitario),
        total: decimalToCents(item.total),
      })),
      pagamentos: row.pagamentos.map((pagamento) => ({
        id: pagamento.id,
        forma: pagamento.forma as FormaPagamento,
        valor: decimalToCents(pagamento.valor),
      })),
      concluidaEm: row.concluidaEm,
      canceladaEm: row.canceladaEm,
      criadoEm: row.criadaEm,
    };
  }
}
