/// Direction of a stock movement. Mirrors the backend `TipoMovimentacao`.
enum StockMovementType {
  entrada('ENTRADA'),
  saida('SAIDA');

  const StockMovementType(this.wire);

  /// Value as sent/received over the wire.
  final String wire;

  static StockMovementType fromWire(String value) => values.firstWhere(
    (t) => t.wire == value,
    orElse: () => StockMovementType.entrada,
  );
}
