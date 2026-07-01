/// Discount kind applied to a sale.
///
/// The `/vendas` HTTP edge expects the lowercase wire values `valor` and
/// `percentual` in the request body (`PATCH /vendas/:id/desconto`).
enum TipoDesconto {
  /// Absolute discount, expressed in integer cents.
  valor('valor'),

  /// Percentage discount in the `0..100` range.
  percentual('percentual');

  const TipoDesconto(this.wire);

  /// Value as sent over the wire.
  final String wire;
}
