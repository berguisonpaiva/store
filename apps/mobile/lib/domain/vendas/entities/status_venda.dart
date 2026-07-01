/// Lifecycle status of a sale (`venda`). Mirrors the backend `StatusVenda`.
enum StatusVenda {
  aberta('ABERTA'),
  concluida('CONCLUIDA'),
  cancelada('CANCELADA');

  const StatusVenda(this.wire);

  /// Value as sent/received over the wire.
  final String wire;

  static StatusVenda fromWire(String value) => values.firstWhere(
    (s) => s.wire == value,
    orElse: () => StatusVenda.aberta,
  );
}
