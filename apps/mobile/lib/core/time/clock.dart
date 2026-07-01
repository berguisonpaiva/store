/// Abstraction over the current time, so business code is testable without
/// depending on `DateTime.now()` directly.
abstract interface class Clock {
  DateTime now();
}
