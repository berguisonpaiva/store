import 'clock.dart';

/// System [Clock] implementation.
class SystemClock implements Clock {
  const SystemClock();

  @override
  DateTime now() => DateTime.now();
}
