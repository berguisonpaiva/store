import 'package:logger/logger.dart';

import 'app_logger.dart';

/// [AppLogger] backed by the `logger` package.
class AppLoggerImpl implements AppLogger {
  AppLoggerImpl({Logger? logger}) : _logger = logger ?? Logger();

  final Logger _logger;

  @override
  void debug(String message, {Object? error, StackTrace? stackTrace}) =>
      _logger.d(message, error: error, stackTrace: stackTrace);

  @override
  void info(String message, {Object? error, StackTrace? stackTrace}) =>
      _logger.i(message, error: error, stackTrace: stackTrace);

  @override
  void warning(String message, {Object? error, StackTrace? stackTrace}) =>
      _logger.w(message, error: error, stackTrace: stackTrace);

  @override
  void error(String message, {Object? error, StackTrace? stackTrace}) =>
      _logger.e(message, error: error, stackTrace: stackTrace);
}
