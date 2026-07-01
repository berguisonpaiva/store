import { Injectable } from '@nestjs/common';
import { Result } from '@repo/shared';
import { PendingSalePredicate, StatusVenda } from '@repo/sales';
import { PrismaService } from '../../../../db/prisma.service';

/// Real pending-sale gate (design decision D6, Decision 5). A session with any
/// `ABERTA` sale still open is considered pending, so `fechar-caixa` is blocked
/// with `VENDA_PENDENTE_NO_FECHAMENTO`.
///
/// The vendas→caixa binding is resolved here at the backend/adapter layer (a
/// direct Prisma read over the `venda` table) rather than in the caixa domain, so
/// the caixa aggregate stays ignorant of venda internals and no module cycle is
/// introduced.
@Injectable()
export class VendasPendingSalePredicate implements PendingSalePredicate {
  constructor(private readonly prisma: PrismaService) {}

  async hasPendingSale(sessaoId: string): Promise<Result<boolean>> {
    const openSale = await this.prisma.client.venda.findFirst({
      where: { sessaoCaixaId: sessaoId, status: StatusVenda.ABERTA },
      select: { id: true },
    });
    return Result.ok(openSale !== null);
  }
}
