import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Result, TransactionContext } from '@repo/shared';
import {
  CaixaError,
  CaixaRepository,
  MovimentacaoCaixa,
  SessaoCaixa,
  StatusSessaoCaixa,
  TipoMovimentacaoCaixa,
} from '@repo/sales';
import {
  PrismaService,
  PrismaTransactionContext,
} from '../../../../db/prisma.service';
import {
  centsToDecimal,
  decimalToCents,
  nullableDecimalToCents,
} from './money';

type SessaoCaixaRow = Prisma.SessaoCaixaGetPayload<object>;
type MovimentacaoCaixaRow = Prisma.MovimentacaoCaixaGetPayload<object>;

/// Write-side Prisma adapter for the cash aggregate. Money is persisted as
/// `Decimal` (reais) and converted to/from integer cents at this boundary so the
/// domain keeps its precise cents representation with no floating-point drift.
@Injectable()
export class CaixaPrismaRepository implements CaixaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findSessaoAbertaByOperador(
    operadorId: string,
  ): Promise<Result<SessaoCaixa | null>> {
    const row = await this.prisma.client.sessaoCaixa.findFirst({
      where: { operadorId, status: StatusSessaoCaixa.ABERTA },
    });

    if (!row) {
      return Result.ok(null);
    }

    return this.toDomain(row);
  }

  async findSessaoById(sessaoId: string): Promise<Result<SessaoCaixa | null>> {
    const row = await this.prisma.client.sessaoCaixa.findUnique({
      where: { id: sessaoId },
    });

    if (!row) {
      return Result.ok(null);
    }

    return this.toDomain(row);
  }

  async abrirSessao(sessao: SessaoCaixa): Promise<Result<SessaoCaixa>> {
    try {
      const row = await this.prisma.client.sessaoCaixa.create({
        data: this.fromDomain(sessao),
      });
      return this.toDomain(row);
    } catch (error) {
      return this.mapError(error);
    }
  }

  async fecharSessao(sessao: SessaoCaixa): Promise<Result<SessaoCaixa>> {
    try {
      const row = await this.prisma.runInTransaction(({ client }) =>
        client.sessaoCaixa.update({
          where: { id: sessao.id },
          data: {
            status: sessao.status,
            valorFechamento: centsToDecimal(sessao.valorFechamento),
            fechadaEm: sessao.fechadaEm,
          },
        }),
      );
      return this.toDomain(row);
    } catch (error) {
      return this.mapError(error);
    }
  }

  async registrarMovimentacao(
    movimentacao: MovimentacaoCaixa,
    tx?: TransactionContext,
  ): Promise<Result<MovimentacaoCaixa>> {
    try {
      // RN09: when a `tx` is passed (a sale-driven `VENDA` movement), the write
      // joins the sale's transaction; otherwise it opens its own.
      const create = (client: PrismaTransactionContext['client']) =>
        client.movimentacaoCaixa.create({
          data: {
            id: movimentacao.id,
            sessaoId: movimentacao.sessaoId,
            tipo: movimentacao.tipo,
            valor: centsToDecimal(movimentacao.valor),
            observacao: movimentacao.observacao,
            criadaEm: movimentacao.criadaEm,
          },
        });

      const txContext = tx as PrismaTransactionContext | undefined;
      const row = txContext
        ? await create(txContext.client)
        : await this.prisma.runInTransaction(({ client }) => create(client));
      return this.toMovimentacaoDomain(row);
    } catch (error) {
      return this.mapMovimentacaoError(error);
    }
  }

  async estornarVenda(
    sessaoId: string,
    valor: number,
    tx?: TransactionContext,
  ): Promise<Result<void>> {
    // The reversal of a prior `VENDA` is recorded as a compensating `SANGRIA`
    // (cash leaving the drawer) of the same value, so it nets the sale's cash to
    // zero in the session summary (`vendasDinheiro - sangrias`). Threads `tx` so
    // it commits/rolls back with the cancel/finalize-rollback transaction.
    const movimentacao = MovimentacaoCaixa.criar(
      TipoMovimentacaoCaixa.SANGRIA,
      {
        sessaoId,
        valor,
        observacao: 'Estorno de venda cancelada',
      },
    );
    if (movimentacao.isFailure) {
      return movimentacao.withFail;
    }

    const persisted = await this.registrarMovimentacao(
      movimentacao.instance,
      tx,
    );
    if (persisted.isFailure) {
      return persisted.withFail;
    }

    return Result.ok();
  }

  private fromDomain(
    sessao: SessaoCaixa,
  ): Prisma.SessaoCaixaUncheckedCreateInput {
    return {
      id: sessao.id,
      operadorId: sessao.operadorId,
      status: sessao.status,
      valorAbertura: centsToDecimal(sessao.valorAbertura),
      valorFechamento: centsToDecimal(sessao.valorFechamento),
      abertaEm: sessao.abertaEm,
      fechadaEm: sessao.fechadaEm,
    };
  }

  private toDomain(row: SessaoCaixaRow): Result<SessaoCaixa> {
    return SessaoCaixa.restore({
      id: row.id,
      operadorId: row.operadorId,
      status: row.status as StatusSessaoCaixa,
      valorAbertura: decimalToCents(row.valorAbertura),
      valorFechamento: nullableDecimalToCents(row.valorFechamento),
      abertaEm: row.abertaEm,
      fechadaEm: row.fechadaEm,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  private toMovimentacaoDomain(
    row: MovimentacaoCaixaRow,
  ): Result<MovimentacaoCaixa> {
    const props = {
      id: row.id,
      sessaoId: row.sessaoId,
      valor: decimalToCents(row.valor),
      observacao: row.observacao,
      criadaEm: row.criadaEm,
    };

    return row.tipo === TipoMovimentacaoCaixa.VENDA
      ? MovimentacaoCaixa.criarVenda(props)
      : MovimentacaoCaixa.criar(
          row.tipo as
            | TipoMovimentacaoCaixa.SUPRIMENTO
            | TipoMovimentacaoCaixa.SANGRIA,
          props,
        );
  }

  private mapError(error: unknown): Result<SessaoCaixa> {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Partial unique index on (operadorId WHERE status = 'ABERTA') — the
      // concurrency backstop for "one open session per operator" (RN01).
      if (error.code === 'P2002') {
        return Result.fail(CaixaError.CAIXA_JA_ABERTO);
      }
    }
    throw error;
  }

  private mapMovimentacaoError(error: unknown): Result<MovimentacaoCaixa> {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2003') {
        return Result.fail(CaixaError.CAIXA_NAO_ENCONTRADO);
      }
    }
    throw error;
  }
}
