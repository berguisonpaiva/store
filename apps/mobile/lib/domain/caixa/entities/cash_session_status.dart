/// Lifecycle status of a cash session. Mirrors the backend `StatusCaixa`.
enum CashSessionStatus {
  aberto('ABERTO'),
  fechado('FECHADO');

  const CashSessionStatus(this.wire);

  /// Value as sent/received over the wire.
  final String wire;

  static CashSessionStatus fromWire(String value) => values.firstWhere(
    (s) => s.wire == value,
    orElse: () => CashSessionStatus.aberto,
  );
}
