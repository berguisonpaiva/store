import { Injectable } from '@nestjs/common';
import { Result } from '@repo/shared';
import { PendingSalePredicate } from '@repo/sales';

/// PLACEHOLDER pending-sale gate (design decision D6).
///
/// `caixa` has no knowledge of sales yet. Until the `vendas` module lands, this
/// stub always reports "no pending sale" so `fechar-caixa` is never blocked by a
/// sale that cannot exist. When `VendasModule` is implemented it MUST provide the
/// real `PendingSalePredicate` binding (querying open sales for the session) and
/// this stub MUST be removed from `CaixaModule`.
@Injectable()
export class StubPendingSalePredicate implements PendingSalePredicate {
  async hasPendingSale(_sessaoId: string): Promise<Result<boolean>> {
    return Result.ok(false);
  }
}
