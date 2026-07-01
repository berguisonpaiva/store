/// Sales channel. Mirrors the backend `CanalVenda`. The mobile PDV only ever
/// creates `PDV` sales.
enum CanalVenda {
  pdv('PDV');

  const CanalVenda(this.wire);

  /// Value as sent/received over the wire.
  final String wire;

  static CanalVenda fromWire(String value) => values.firstWhere(
    (c) => c.wire == value,
    orElse: () => CanalVenda.pdv,
  );
}
