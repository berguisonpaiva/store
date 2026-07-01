import 'package:get_it/get_it.dart';

import '../../core/auth/jwt_decoder.dart';
import '../../core/auth/jwt_decoder_impl.dart';
import '../../core/logging/app_logger.dart';
import '../../core/logging/app_logger_impl.dart';
import '../../core/network/http_client.dart';
import '../../core/network/http_client_impl.dart';
import '../../core/storage/secure_storage.dart';
import '../../core/storage/secure_storage_impl.dart';
import '../../core/time/clock.dart';
import '../../core/time/clock_impl.dart';
import '../config/app_config.dart';

/// Registers generic technical wrappers (no business knowledge).
void registerCoreModule(GetIt gi, AppConfig config) {
  gi.registerLazySingleton<AppLogger>(AppLoggerImpl.new);
  gi.registerLazySingleton<Clock>(() => const SystemClock());
  gi.registerLazySingleton<JwtDecoder>(() => const JwtDecoderImpl());
  gi.registerLazySingleton<SecureStorage>(SecureStorageImpl.new);
  gi.registerLazySingleton<HttpClient>(
    () => HttpClientImpl(baseUrl: config.apiBaseUrl),
  );
}
