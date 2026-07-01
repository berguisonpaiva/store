## 1. Project Scaffold

- [x] 1.1 Verificar Flutter/Dart SDK — Flutter 3.41.4 / Dart 3.11.1; sdk `^3.11.1` no pubspec
- [x] 1.2 Criar app Flutter em `apps/mobile` (org `com.store` → bundle `com.store.mobile`), android/ios
- [x] 1.3 `apps/mobile` excluído dos workspaces (`"!apps/mobile"` no root package.json)
- [x] 1.4 Camadas `lib/{app,core,domain,data,ui}` criadas + `analysis_options.yaml` com excludes de codegen

## 2. Dependencies

- [x] 2.1 `get_it`, `go_router`, `flutter_bloc`, `bloc`, `fpdart`
- [x] 2.2 `dio`, `flutter_secure_storage`, `logger`, `drift` (+ `sqlite3_flutter_libs`, `path_provider`, `path`)
- [x] 2.3 Dev: `flutter_test`, `bloc_test`, `mocktail`, `build_runner`, `drift_dev`

## 3. Composition Root (app/)

- [x] 3.1 `app/bootstrap.dart` (ensureInitialized → DI → root widget)
- [x] 3.2 DI get_it em módulos core/data/domain/ui na ordem correta (`app/di/*`)
- [x] 3.3 GoRouter com rota inicial `/` (`app/router/app_router.dart`)
- [x] 3.4 Root widget `AppWidget` (MaterialApp.router + tema + l10n)

## 4. Core Infrastructure (core/)

- [x] 4.1 `HttpClient` (interface) + `HttpClientImpl` (dio) com base URL e bearer token
- [x] 4.2 Logger, SecureStorage e Clock atrás de interfaces (`[name].dart` + `[name]_impl.dart`)
- [x] 4.3 Hierarquia técnica `AppException` (Network/Serialization/Storage/Unauthorized)

## 5. Design System (ui/)

- [x] 5.1 Tokens (cores/espaçamento/tipografia) + tema Material 3 light/dark
- [x] 5.2 `themeMode: ThemeMode.system` no AppWidget
- [x] 5.3 `PrimaryButton` + `AppToast` (feedback)
- [x] 5.4 l10n configurado (l10n.yaml + arb en/pt + `generate: true`, AppLocalizations gerado)

## 6. Auth Integration (domain + data)

- [x] 6.1 Contrato `AuthRepository` + entities + `AuthFailure` no domain (sem Flutter)
- [x] 6.2 Use cases retornando `Either<AuthFailure, T>` (signIn/getProfile/signOut)
- [x] 6.3 Data source + repo consumindo `/api/auth/login`, `/refresh`, `/logout`, `GET /api/auth/profile`
- [x] 6.4 Mappers DTO→domain + conversão Exception→Failure na fronteira do repositório
- [x] 6.5 Tokens persistidos via SecureStorage (sem telas de login)

## 7. Persistence Base (data/)

- [x] 7.1 Drift `AppDatabase` + `ExampleDao` (codegen gerado) + `openConnection()`

## 8. Testing Foundation (test/)

- [x] 8.1 Helper `pumpApp` + mocks com mocktail
- [x] 8.2 Teste de domínio (`SignInUseCase`) passando
- [x] 8.3 Teste de data (`AuthRepositoryImpl`, Exception→Failure + persistência) passando
- [x] 8.4 Teste de ui (`HomeCubit` com bloc_test) + widget test (`HomePage`) passando

## 9. Verify

- [x] 9.1 `flutter analyze` — No issues found!
- [x] 9.2 `flutter test` — All tests passed (6/6)
- [x] 9.3 Boot path (bootstrap→DI→GoRouter→HomePage) coberto pelo widget test; run em device real fica fora do escopo desta sessão
