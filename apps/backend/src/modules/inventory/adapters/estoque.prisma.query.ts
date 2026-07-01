import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PaginatedResultDTO, Result } from '@repo/shared';
import {
  EstoqueQuery,
  ItemAbaixoDoMinimoDTO,
  ListarMovimentacoesInputDTO,
  MovimentacaoEstoqueDTO,
  SaldoEstoqueDTO,
  TipoMovimentacao,
} from '@repo/inventory';
import { PrismaService } from '../../../db/prisma.service';

@Injectable()
export class EstoquePrismaQuery implements EstoqueQuery {
  constructor(private readonly prisma: PrismaService) {}

  async consultarSaldo(variacaoId: string): Promise<Result<SaldoEstoqueDTO | null>> {
    const row = await this.prisma.client.estoqueSaldo.findUnique({
      where: { variacaoId },
    });

    if (!row) {
      return Result.ok(null);
    }

    return Result.ok({
      variacaoId: row.variacaoId,
      saldoAtual: row.saldoAtual,
      quantidadeReservada: row.quantidadeReservada,
      saldoDisponivel: row.saldoAtual - row.quantidadeReservada,
      estoqueMinimo: row.estoqueMinimo,
    });
  }

  async listarMovimentacoes(
    input: ListarMovimentacoesInputDTO,
  ): Promise<Result<PaginatedResultDTO<MovimentacaoEstoqueDTO>>> {
    const where: Prisma.MovimentacaoEstoqueWhereInput = {
      variacaoId: input.variacaoId,
      ...(input.startDate || input.endDate
        ? {
            createdAt: {
              ...(input.startDate ? { gte: input.startDate } : {}),
              ...(input.endDate ? { lte: input.endDate } : {}),
            },
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.client.movimentacaoEstoque.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize,
      }),
      this.prisma.client.movimentacaoEstoque.count({ where }),
    ]);

    return Result.ok({
      data: rows.map((row) => ({
        id: row.id,
        variacaoId: row.variacaoId,
        tipo: row.tipo as TipoMovimentacao,
        motivo: row.motivo as any,
        quantidade: row.quantidade,
        saldoResultante: row.saldoResultante,
        origemVendaId: row.origemVendaId,
        usuarioId: row.usuarioId,
        timestamp: row.createdAt,
      })),
      meta: {
        page: input.page,
        pageSize: input.pageSize,
        total,
        totalPages: Math.ceil(total / input.pageSize),
      },
    });
  }

  async listarAbaixoDoMinimo(): Promise<Result<ItemAbaixoDoMinimoDTO[]>> {
    const rows = await this.prisma.client.estoqueSaldo.findMany({
      where: {
        saldoAtual: {
          lt: this.prisma.client.estoqueSaldo.fields.estoqueMinimo,
        },
      },
      orderBy: { saldoAtual: 'asc' },
    });

    return Result.ok(
      rows.map((row) => ({
        variacaoId: row.variacaoId,
        saldoAtual: row.saldoAtual,
        quantidadeReservada: row.quantidadeReservada,
        saldoDisponivel: row.saldoAtual - row.quantidadeReservada,
        estoqueMinimo: row.estoqueMinimo,
      })),
    );
  }
}
