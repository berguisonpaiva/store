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
  TipoMovimentacaoCaixa,
} from '@repo/sales';
import { PrismaService } from '../../../../db/prisma.service';
import { decimalToCents, nullableDecimalToCents } from './money';

/// Read-side Prisma projection for the cash aggregate (CQRS-lite). Returns DTOs
/// with money in integer cents (converted from the persisted `Decimal` reais).
@Injectable()
export class CaixaPrismaQuery implements CaixaQuery {
  constructor(private readonly prisma: PrismaService) {}

  async caixaAbertoDoOperador(
    operadorId: string,
  ): Promise<Result<SessaoCaixaDTO | null>> {
    const row = await this.prisma.client.sessaoCaixa.findFirst({
      where: { operadorId, status: StatusSessaoCaixa.ABERTO },
    });

    if (!row) {
      return Result.ok(null);
    }

    return Result.ok({
      id: row.id,
      operadorId: row.operadorId,
      status: row.status as StatusSessaoCaixa,
      valorAbertura: decimalToCents(row.valorAbertura),
      valorFechamento: nullableDecimalToCents(row.valorFechamento),
      abertaEm: row.abertaEm,
      fechadaEm: row.fechadaEm,
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
      totals.set(group.tipo, decimalToCents(group._sum.valor ?? new Prisma.Decimal(0)));
    }

    const abertura = decimalToCents(sessao.valorAbertura);
    const suprimentos = totals.get(TipoMovimentacaoCaixa.SUPRIMENTO) ?? 0;
    const vendasDinheiro = totals.get(TipoMovimentacaoCaixa.VENDA) ?? 0;
    const sangrias = totals.get(TipoMovimentacaoCaixa.SANGRIA) ?? 0;
    const esperado = abertura + suprimentos + vendasDinheiro - sangrias;

    const contado = nullableDecimalToCents(sessao.valorFechamento);
    const divergencia = contado === null ? null : contado - esperado;

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
    });
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
