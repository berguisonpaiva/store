/// Type of a cash-session movement. Mirrors the backend `TipoMovimentacao`.
enum CashMovementType {
  abertura('ABERTURA'),
  suprimento('SUPRIMENTO'),
  sangria('SANGRIA'),
  vendaDinheiro('VENDA_DINHEIRO'),
  fechamento('FECHAMENTO');

  const CashMovementType(this.wire);

  /// Value as sent/received over the wire.
  final String wire;

  static CashMovementType fromWire(String value) => values.firstWhere(
    (t) => t.wire == value,
    orElse: () => CashMovementType.suprimento,
  );
}
