/// Payment method for a sale. Mirrors the backend `FormaPagamento`.
enum FormaPagamento {
  dinheiro('DINHEIRO'),
  cartaoDebito('CARTAO_DEBITO'),
  cartaoCredito('CARTAO_CREDITO'),
  pix('PIX');

  const FormaPagamento(this.wire);

  /// Value as sent/received over the wire.
  final String wire;

  static FormaPagamento fromWire(String value) => values.firstWhere(
    (f) => f.wire == value,
    orElse: () => FormaPagamento.dinheiro,
  );
}
