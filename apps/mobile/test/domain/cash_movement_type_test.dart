import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/domain/caixa/entities/cash_movement_type.dart';

void main() {
  group('CashMovementType.fromWire', () {
    test('parses VENDA', () {
      expect(CashMovementType.fromWire('VENDA'), CashMovementType.venda);
    });

    test('parses ABERTURA', () {
      expect(CashMovementType.fromWire('ABERTURA'), CashMovementType.abertura);
    });

    test('parses SANGRIA', () {
      expect(CashMovementType.fromWire('SANGRIA'), CashMovementType.sangria);
    });

    test('parses SUPRIMENTO', () {
      expect(
        CashMovementType.fromWire('SUPRIMENTO'),
        CashMovementType.suprimento,
      );
    });

    test('falls back to desconhecido for unknown wire values', () {
      expect(
        CashMovementType.fromWire('VENDA_DINHEIRO'),
        CashMovementType.desconhecido,
      );
      expect(
        CashMovementType.fromWire('FECHAMENTO'),
        CashMovementType.desconhecido,
      );
      expect(CashMovementType.fromWire(''), CashMovementType.desconhecido);
    });
  });
}
