/// Money conversion helpers for the cash-session wire format.
///
/// The backend speaks reais (`number`) at the HTTP edge, while the domain keeps
/// integer cents. These helpers convert at the data boundary, rounding to avoid
/// floating-point drift (e.g. `19.9` → `1990`).
abstract final class CashMoney {
  /// Reais (as a JSON `num`) to integer cents.
  static int reaisToCents(num reais) => (reais * 100).round();

  /// Integer cents to reais as a `double`, for request bodies.
  static double centsToReais(int cents) => cents / 100;
}
