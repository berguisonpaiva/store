import { Result } from '@repo/shared'

/// Injected gate (design decision D6) that reports whether a session still has a
/// sale in `ABERTA` state. Modeled as a predicate so it is testable with a fake
/// before the `vendas` module lands. Resolves to `true` when a sale is pending.
export interface PendingSalePredicate {
  hasPendingSale(sessaoId: string): Promise<Result<boolean>>
}
