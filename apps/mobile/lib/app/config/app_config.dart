/// Global app configuration. `API_BASE_URL` points at the `@repo/backend` API
/// and can be overridden at build/run time via `--dart-define=API_BASE_URL=...`.
class AppConfig {
  const AppConfig({required this.apiBaseUrl});

  factory AppConfig.fromEnvironment() => const AppConfig(
    apiBaseUrl: String.fromEnvironment(
      'API_BASE_URL',
      defaultValue: 'http://localhost:4000',
    ),
  );

  final String apiBaseUrl;
}
