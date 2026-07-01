import { Result } from '@repo/shared'
import { PendingSalePredicate } from '../../src/cash-session'

/// Fake `PendingSalePredicate` for close-guard tests. Defaults to "no pending
/// sale"; toggle `pending` to simulate an `ABERTA` sale blocking the close.
export class FakePendingSalePredicate implements PendingSalePredicate {
  pending = false
  failWith: string | null = null

  async hasPendingSale(_sessaoId: string): Promise<Result<boolean>> {
    if (this.failWith) {
      return Result.fail(this.failWith)
    }
    return Result.ok(this.pending)
  }
}
