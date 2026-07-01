import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PaginatedResultDTO, Result } from '@repo/shared';
import {
  CaixaQuery,
  ListarMovimentacoesInputDTO,
  MovimentacaoCaixaDTO,
  ResumoSessaoDTO,
  SessaoCaixaDTO,
  StatusSessaoCaixa,
  StatusVenda,
  TipoMovimentacaoCaixa,
  TotalPorFormaDTO,
} from '@repo/sales';
import { PrismaService } from '../../../../db/prisma.service';
import { decimalToCents, nullableDecimalToCents } from './money';

/// Backend-only filter for the ADMIN `GET /caixa` list-all route (RN04). Not part
/// of the domain `CaixaQuery` port — it is an admin read over all operators.
export type ListarSessoesFiltro = {
  page: number;
  pageSize: number;
  usuarioId?: string;
  status?: StatusSessaoCaixa;
  from?: Date;
  to?: Date;
};

/// Read-side Prisma projection for the cash aggregate (CQRS-lite). Returns DTOs
/// with money in integer cents (converted from the persisted `Decimal` reais).
@Injectable()
export class CaixaPrismaQuery implements CaixaQuery {
  constructor(private readonly prisma: PrismaService) {}

  async caixaAbertoDoOperador(
    operadorId: string,
  ): Promise<Result<SessaoCaixaDTO | null>> {
    const row = await this.prisma.client.sessaoCaixa.findFirst({
      where: { operadorId, status: StatusSessaoCaixa.ABERTA },
    });

    if (!row) {
      return Result.ok(null);
    }

    return Result.ok(this.toSessaoDTO(row));
  }

  /// ADMIN list-all (RN04): every operator's sessions matching the filters.
  /// Backend-only — not part of the domain `CaixaQuery` port.
  async listarSessoes(
    filtro: ListarSessoesFiltro,
  ): Promise<Result<PaginatedResultDTO<SessaoCaixaDTO>>> {
    const where: Prisma.SessaoCaixaWhereInput = {};
    if (filtro.usuarioId) {
      where.operadorId = filtro.usuarioId;
    }
    if (filtro.status) {
      where.status = filtro.status;
    }
    if (filtro.from || filtro.to) {
      where.abertaEm = {};
      if (filtro.from) {
        where.abertaEm.gte = filtro.from;
      }
      if (filtro.to) {
        where.abertaEm.lte = filtro.to;
      }
    }

    const [rows, total] = await Promise.all([
      this.prisma.client.sessaoCaixa.findMany({
        where,
        orderBy: { abertaEm: 'desc' },
        skip: (filtro.page - 1) * filtro.pageSize,
        take: filtro.pageSize,
      }),
      this.prisma.client.sessaoCaixa.count({ where }),
    ]);

    return Result.ok({
      data: rows.map((row) => this.toSessaoDTO(row)),
      meta: {
        page: filtro.page,
        pageSize: filtro.pageSize,
        total,
        totalPages: Math.ceil(total / filtro.pageSize),
      },
    });
  }

  async resumoSessao(
    sessaoId: string,
  ): Promise<Result<ResumoSessaoDTO | null>> {
    const sessao = await this.prisma.client.sessaoCaixa.findUnique({
      where: { id: sessaoId },
    });

    if (!sessao) {
      return Result.ok(null);
    }

    const grouped = await this.prisma.client.movimentacaoCaixa.groupBy({
      by: ['tipo'],
      where: { sessaoId },
      _sum: { valor: true },
    });

    const totals = new Map<string, number>();
    for (const group of grouped) {
      totals.set(
        group.tipo,
        decimalToCents(group._sum.valor ?? new Prisma.Decimal(0)),
      );
    }

    const abertura = decimalToCents(sessao.valorAbertura);
    const suprimentos = totals.get(TipoMovimentacaoCaixa.SUPRIMENTO) ?? 0;
    const vendasDinheiro = totals.get(TipoMovimentacaoCaixa.VENDA) ?? 0;
    const sangrias = totals.get(TipoMovimentacaoCaixa.SANGRIA) ?? 0;
    const esperado = abertura + suprimentos + vendasDinheiro - sangrias;

    const contado = nullableDecimalToCents(sessao.valorFechamento);
    const divergencia = contado === null ? null : contado - esperado;

    // RN05: summarise the concluded sales of the session (count, total, and
    // per-payment-form breakdown) for the automatic close resumo.
    const [salesAggregate, porFormaGroups] = await Promise.all([
      this.prisma.client.venda.aggregate({
        where: { sessaoCaixaId: sessaoId, status: StatusVenda.CONCLUIDA },
        _count: { _all: true },
        _sum: { total: true },
      }),
      this.prisma.client.pagamento.groupBy({
        by: ['forma'],
        where: {
          venda: { sessaoCaixaId: sessaoId, status: StatusVenda.CONCLUIDA },
        },
        _sum: { valor: true },
      }),
    ]);

    const totalPorForma: TotalPorFormaDTO = {};
    for (const group of porFormaGroups) {
      totalPorForma[group.forma] = decimalToCents(
        group._sum.valor ?? new Prisma.Decimal(0),
      );
    }

    return Result.ok({
      sessaoId: sessao.id,
      status: sessao.status as StatusSessaoCaixa,
      abertura,
      suprimentos,
      vendasDinheiro,
      sangrias,
      esperado,
      contado,
      divergencia,
      totalVendas: decimalToCents(
        salesAggregate._sum.total ?? new Prisma.Decimal(0),
      ),
      qtdVendas: salesAggregate._count._all,
      totalPorForma,
    });
  }

  private toSessaoDTO(row: {
    id: string;
    operadorId: string;
    status: string;
    valorAbertura: Prisma.Decimal;
    valorFechamento: Prisma.Decimal | null;
    abertaEm: Date;
    fechadaEm: Date | null;
  }): SessaoCaixaDTO {
    return {
      id: row.id,
      operadorId: row.operadorId,
      status: row.status as StatusSessaoCaixa,
      valorAbertura: decimalToCents(row.valorAbertura),
      valorFechamento: nullableDecimalToCents(row.valorFechamento),
      abertaEm: row.abertaEm,
      fechadaEm: row.fechadaEm,
    };
  }

  async listarMovimentacoes(
    input: ListarMovimentacoesInputDTO,
  ): Promise<Result<PaginatedResultDTO<MovimentacaoCaixaDTO>>> {
    const where: Prisma.MovimentacaoCaixaWhereInput = {
      sessaoId: input.sessaoId,
    };

    const [rows, total] = await Promise.all([
      this.prisma.client.movimentacaoCaixa.findMany({
        where,
        orderBy: { criadaEm: 'desc' },
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize,
      }),
      this.prisma.client.movimentacaoCaixa.count({ where }),
    ]);

    return Result.ok({
      data: rows.map((row) => ({
        id: row.id,
        sessaoId: row.sessaoId,
        tipo: row.tipo as TipoMovimentacaoCaixa,
        valor: decimalToCents(row.valor),
        observacao: row.observacao,
        timestamp: row.criadaEm,
      })),
      meta: {
        page: input.page,
        pageSize: input.pageSize,
        total,
        totalPages: Math.ceil(total / input.pageSize),
      },
    });
  }
}
