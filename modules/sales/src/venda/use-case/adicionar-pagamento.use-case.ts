import { Result, UseCase } from '@repo/shared'
import { AdicionarPagamentoInputDTO, toVendaDTO, VendaDTO } from '../dto'
import { VendaError } from '../errors'
import { VendasRepository } from '../provider'
import { VendaUseCaseBase } from './venda-use-case.base'

/// Registers a single incremental payment on an `ABERTA` sale. Only the sale's
/// owner may pay it (`ACESSO_NEGADO` otherwise). `forma`/`valor > 0` are validated
/// by the `Pagamento` entity (`INVALID_PAYMENT`), and the entity blocks non-open
/// sales (`SALE_ALREADY_FINALIZED`/`SALE_NOT_OPEN`).
///
/// Partial payments are fine here: `Σ pagamentos == total` is a CONCLUSION rule
/// (RN07) enforced only by `FinalizarVenda` (`PAYMENT_MISMATCH`), never at
/// registration time.
export class AdicionarPagamento extends VendaUseCaseBase implements UseCase<AdicionarPagamentoInputDTO, VendaDTO> {
  constructor(repository: VendasRepository) {
    super(repository)
  }

  async execute(input: AdicionarPagamentoInputDTO): Promise<Result<VendaDTO>> {
    const venda = await this.loadVenda(input.vendaId)
    if (venda.isFailure) {
      return venda.withFail
    }

    if (venda.instance.usuarioId !== input.usuarioId) {
      return Result.fail(VendaError.ACESSO_NEGADO)
    }

    const updated = await this.applyAndSave(
      venda.instance.adicionarPagamento({ forma: input.forma, valor: input.valor }),
    )
    if (updated.isFailure) {
      return updated.withFail
    }

    return Result.ok(toVendaDTO(updated.instance))
  }
}
