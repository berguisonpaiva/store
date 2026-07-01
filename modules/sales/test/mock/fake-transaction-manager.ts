import { TransactionContext, TransactionManager } from '@repo/shared'

/// Sentinel transaction context handed to every gateway/repository call inside a
/// `runInTransaction` block. Identity is what matters — tests assert both gateways
/// received THIS exact object (RN09 single-transaction).
export const TX_SENTINEL: TransactionContext = { id: 'tx-sentinel' } as TransactionContext

/// Fake `TransactionManager` that runs the operation synchronously with a fixed
/// `tx`. No real rollback — the domain orchestration reverts effects explicitly,
/// which is what the tests observe.
export class FakeTransactionManager implements TransactionManager {
  runs = 0

  async runInTransaction<T>(operation: (context: TransactionContext) => Promise<T>): Promise<T> {
    this.runs += 1
    return operation(TX_SENTINEL)
  }
}
