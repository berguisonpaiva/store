/// Reason for a stock movement. Mirrors the backend `MotivoMovimentacaoEstoque`.
/// Sale-driven reasons (`vendaPdv`/`vendaOnline`) are produced by the `vendas`
/// module and are never selectable in the inventory UI.
enum StockMovementReason {
  compra('COMPRA'),
  ajuste('AJUSTE'),
  devolucao('DEVOLUCAO'),
  vendaPdv('VENDA_PDV'),
  vendaOnline('VENDA_ONLINE'),
  perda('PERDA');

  const StockMovementReason(this.wire);

  /// Value as sent/received over the wire.
  final String wire;

  static StockMovementReason fromWire(String value) => values.firstWhere(
    (r) => r.wire == value,
    orElse: () => StockMovementReason.ajuste,
  );

  /// Reasons a user may pick when registering an entry.
  static const List<StockMovementReason> entryReasons = [
    compra,
    devolucao,
    ajuste,
  ];

  /// Reasons a user may pick when registering a manual exit.
  static const List<StockMovementReason> exitReasons = [perda, ajuste];
}
