import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Result } from '@repo/shared';
import {
  AplicarMovimentacaoOptions,
  EstoqueError,
  EstoqueRepository,
  EstoqueSaldo,
  MovimentacaoEstoque,
  TipoMovimentacao,
} from '@repo/inventory';
import {
  PrismaService,
  PrismaTransactionContext,
} from '../../../db/prisma.service';

type EstoqueSaldoRow = Prisma.EstoqueSaldoGetPayload<object>;

@Injectable()
export class EstoquePrismaRepository implements EstoqueRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findSaldoByVariacaoId(
    variacaoId: string,
  ): Promise<Result<EstoqueSaldo | null>> {
    const row = await this.prisma.client.estoqueSaldo.findUnique({
      where: { variacaoId },
    });

    if (!row) {
      return Result.ok(null);
    }

    return this.toDomain(row);
  }

  async aplicarMovimentacao(
    movimentacao: MovimentacaoEstoque,
    novoSaldo: EstoqueSaldo,
    options?: AplicarMovimentacaoOptions,
  ): Promise<Result<void>> {
    try {
      // RN06: when the caller (a sale-driven darBaixa/estornar) supplies its transaction
      // context, run the ledger + saldo write on that same client so it commits/rolls back
      // with the sale; otherwise open our own transaction (standalone ADMIN commands).
      const tx = options?.tx as PrismaTransactionContext | undefined;
      if (tx) {
        await this.applyOnClient(tx.client, movimentacao, novoSaldo, options);
      } else {
        await this.prisma.runInTransaction(({ client }) =>
          this.applyOnClient(client, movimentacao, novoSaldo, options),
        );
      }

      return Result.ok();
    } catch (error) {
      return this.mapError(error);
    }
  }

  private async applyOnClient(
    client: PrismaTransactionContext['client'],
    movimentacao: MovimentacaoEstoque,
    novoSaldo: EstoqueSaldo,
    options?: AplicarMovimentacaoOptions,
  ): Promise<void> {
    const locked = await client.$queryRaw<EstoqueSaldoRow[]>`
          SELECT *
          FROM "estoque_saldos"
          WHERE "variacaoId" = ${novoSaldo.variacaoId}::uuid
          FOR UPDATE
        `;

    const current = locked[0] ?? null;
    const currentSaldo = current?.saldoAtual ?? 0;

    let saldoAtualPersistido: number;
    let tipoPersistido: string;
    let quantidadePersistida: number;

    if (options?.saldoAbsoluto) {
      // Ajuste de inventário: `novoSaldo.saldoAtual` é o saldo absoluto contado.
      // Persiste o alvo diretamente e recalcula o delta do ledger contra o saldo
      // travado, mantendo a linha consistente mesmo sob movimentação concorrente.
      const target = novoSaldo.saldoAtual;
      if (target < 0) {
        throw new Error(EstoqueError.QUANTIDADE_INVALIDA);
      }

      const delta = target - currentSaldo;
      if (delta === 0) {
        // O saldo travado já é o alvo contado: nada a registrar.
        if (!current) {
          await this.criarSaldo(client, novoSaldo, target);
        }
        return;
      }

      saldoAtualPersistido = target;
      tipoPersistido =
        delta > 0 ? TipoMovimentacao.ENTRADA : TipoMovimentacao.SAIDA;
      quantidadePersistida = Math.abs(delta);
    } else {
      // Entrada/saída: delta relativo recalculado sobre o saldo travado.
      saldoAtualPersistido =
        movimentacao.tipo === TipoMovimentacao.ENTRADA
          ? currentSaldo + movimentacao.quantidade
          : currentSaldo - movimentacao.quantidade;

      if (saldoAtualPersistido < 0) {
        throw new Error(EstoqueError.ESTOQUE_INSUFICIENTE);
      }

      tipoPersistido = movimentacao.tipo;
      quantidadePersistida = movimentacao.quantidade;
    }

    await client.movimentacaoEstoque.create({
      data: {
        id: movimentacao.id,
        variacaoId: movimentacao.variacaoId,
        tipo: tipoPersistido,
        motivo: movimentacao.motivo,
        quantidade: quantidadePersistida,
        saldoResultante: saldoAtualPersistido,
        origemVendaId: movimentacao.origemVendaId,
        usuarioId: movimentacao.usuarioId,
        createdAt: movimentacao.criadoEm,
      },
    });

    if (current) {
      await client.estoqueSaldo.update({
        where: { variacaoId: novoSaldo.variacaoId },
        data: {
          saldoAtual: saldoAtualPersistido,
        },
      });
      return;
    }

    await this.criarSaldo(client, novoSaldo, saldoAtualPersistido);
  }

  private async criarSaldo(
    client: PrismaTransactionContext['client'],
    novoSaldo: EstoqueSaldo,
    saldoAtual: number,
  ): Promise<void> {
    const variation = await client.variation.findUnique({
      where: { id: novoSaldo.variacaoId },
      select: { minStock: true },
    });

    if (!variation) {
      throw new Error(EstoqueError.VARIACAO_NAO_ENCONTRADA);
    }

    await client.estoqueSaldo.create({
      data: {
        id: novoSaldo.id,
        variacaoId: novoSaldo.variacaoId,
        saldoAtual,
        estoqueMinimo: variation.minStock,
      },
    });
  }

  private toDomain(row: EstoqueSaldoRow): Result<EstoqueSaldo> {
    return EstoqueSaldo.tryCreate({
      id: row.id,
      variacaoId: row.variacaoId,
      saldoAtual: row.saldoAtual,
      estoqueMinimo: row.estoqueMinimo,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  private mapError(error: unknown): Result<void> {
    if (error instanceof Error) {
      if (
        error.message === EstoqueError.ESTOQUE_INSUFICIENTE ||
        error.message === EstoqueError.VARIACAO_NAO_ENCONTRADA ||
        error.message === EstoqueError.LEDGER_IMUTAVEL ||
        error.message === EstoqueError.MOTIVO_MOVIMENTACAO_INVALIDO ||
        error.message === EstoqueError.SALDO_INVALIDO ||
        error.message === EstoqueError.QUANTIDADE_INVALIDA
      ) {
        return Result.fail(error.message);
      }
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2003') {
        return Result.fail(EstoqueError.VARIACAO_NAO_ENCONTRADA);
      }
      if (error.code === 'P2002') {
        return Result.fail(EstoqueError.VARIACAO_NAO_ENCONTRADA);
      }
    }

    throw error;
  }
}
