import { VariacaoGateway, VariacaoParaVenda } from '../../src/venda'

/// In-memory `VariacaoGateway` for use-case tests. Unknown ids resolve to `null`
/// (VARIACAO_NAO_ENCONTRADA at the use case); seeded ids carry `preco`/`ativa`.
export class FakeVariacaoGateway implements VariacaoGateway {
  readonly variacoes = new Map<string, VariacaoParaVenda>()

  async buscarParaVenda(variacaoId: string): Promise<VariacaoParaVenda | null> {
    return this.variacoes.get(variacaoId) ?? null
  }

  comVariacao(variacaoId: string, preco: number, ativa = true): this {
    this.variacoes.set(variacaoId, { variacaoId, preco, ativa })
    return this
  }

  inativa(variacaoId: string, preco = 1000): this {
    return this.comVariacao(variacaoId, preco, false)
  }
}
