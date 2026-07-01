import { Result, TransactionContext } from '@repo/shared'
import { Venda } from '../model/venda.entity'

/// Write/command repository for the `Venda` aggregate (loads and persists the whole
/// aggregate including items and payments). Reads for projections live in `VendasQuery`.
export interface VendasRepository {
  /// Persists a new aggregate.
  create(venda: Venda, tx?: TransactionContext): Promise<Result<void>>

  /// Persists changes to an existing aggregate (items, payments, discount, status).
  update(venda: Venda, tx?: TransactionContext): Promise<Result<void>>

  /// Loads the full aggregate by id, or `null` when it does not exist.
  findById(id: string): Promise<Result<Venda | null>>

  /// Reserves the next unique sequential sale number atomically.
  proximoNumero(tx?: TransactionContext): Promise<Result<number>>
}
