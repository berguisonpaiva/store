/// Minimal projection of a catalog variation as seen by `vendas` at add-item time.
/// `preco` is the current unit price in cents — snapshotted into
/// `ItemVenda.precoUnitario` and never re-read afterwards (RN10).
export interface VariacaoParaVenda {
  variacaoId: string
  preco: number
  ativa: boolean
}

/// Port CONSUMED by `vendas` to resolve a variation when adding an item (RN10).
/// Declared here in the domain (design D1); the backend adapter binds it to the
/// catalog variation reader. The domain never imports the catalog module.
export interface VariacaoGateway {
  /// Returns the variation projection, or `null` when `variacaoId` does not resolve.
  /// The use case fails with `VARIACAO_NAO_ENCONTRADA` (null) or `VARIACAO_INATIVA`
  /// (`ativa === false`) before any stock check.
  buscarParaVenda(variacaoId: string): Promise<VariacaoParaVenda | null>
}
