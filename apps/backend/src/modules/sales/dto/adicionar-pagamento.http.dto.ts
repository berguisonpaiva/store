import { PagamentoInDTO } from './finalizar-venda.http.dto';

/// `POST /vendas/:id/pagamentos` body. Registers ONE incremental payment on an
/// `ABERTA` sale; `valor` is in reais (> 0). `Σ pagamentos == total` is only
/// enforced at finalize (RN07) — partial payments are fine here. Note that
/// `POST /vendas/:id/finalizar` REDEFINES the payment set with its own payload.
export class AdicionarPagamentoInDTO extends PagamentoInDTO {}
