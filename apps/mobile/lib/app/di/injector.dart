import 'package:get_it/get_it.dart';

import '../config/app_config.dart';
import 'core_module.dart';
import 'data_module.dart';
import 'domain_module.dart';
import 'ui_module.dart';

/// Global service locator.
final GetIt getIt = GetIt.instance;

/// Wires every layer module in dependency order: core → data → domain → ui.
Future<void> configureDependencies(AppConfig config) async {
  registerCoreModule(getIt, config);
  registerDataModule(getIt);
  registerDomainModule(getIt);
  registerUiModule(getIt);
}
