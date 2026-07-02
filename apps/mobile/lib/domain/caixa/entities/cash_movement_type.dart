/// Type of a cash-session movement. Mirrors the backend `TipoMovimentacao`.
enum CashMovementType {
  abertura('ABERTURA'),
  suprimento('SUPRIMENTO'),
  sangria('SANGRIA'),
  venda('VENDA'),

  /// Fallback for wire values this app version does not know. Never sent by
  /// the backend; kept so unknown types are surfaced neutrally instead of
  /// being mislabeled as another movement type.
  desconhecido('DESCONHECIDO');

  const CashMovementType(this.wire);

  /// Value as sent/received over the wire.
  final String wire;

  /// Parses a wire value, falling back to [desconhecido] for unknown types so
  /// new backend values are never silently mislabeled.
  static CashMovementType fromWire(String value) => values.firstWhere(
    (t) => t.wire == value,
    orElse: () => CashMovementType.desconhecido,
  );
}
