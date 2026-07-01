> Flutter (`apps/mobile`), Clean Architecture + MVVM. Reaproveita o domain/data de auth existente, reconcilia o data layer com o backend real (`/login` + `/refresh`), e adiciona UI + guard + sessão. **Usar as skills indicadas em cada grupo.** Backend é a autoridade de credenciais; tokens em secure storage.

## 1. Core: decode de token e interceptor — skill `flutter-core-layer`

- [x] 1.1 `lib/core/auth/jwt_decoder.dart` (interface) + `jwt_decoder_impl.dart` decodificando o payload base64 do JWT (sem package) → `{ sub, name, email, role }`
- [x] 1.2 Interceptor Dio de auth: anexa bearer da secure storage; em `401`, faz 1 refresh e retry; em falha, sinaliza sessão `unauthenticated` (via callback/port, sem `core` importar `app`)
- [x] 1.3 Registrar `JwtDecoder` no core module

## 2. Domain: entidade e use cases — skill `flutter-domain-layer`

- [x] 2.1 Adicionar `role` a `AuthUserEntity` (decodificado do token; default seguro)
- [x] 2.2 `RestoreSessionUseCase` (envolve `currentSession` + usuário derivado do token)
- [x] 2.3 `RefreshSessionUseCase` (envolve `refresh`) para o interceptor/sessão
- [x] 2.4 Registrar os novos use cases no domain module

## 3. Data: reconciliar com o backend real — skill `flutter-data-drift-layer` (modifica `mobile-auth-integration`)

- [x] 3.1 `AuthSessionDto` → apenas `{ accessToken, refreshToken }`; parse do refresh aceita `{ accessToken }` reutilizando o refresh token armazenado
- [x] 3.2 `AuthRemoteDataSourceImpl`: manter só `/api/auth/login` e `/api/auth/refresh` (remover `/logout` e `/profile`)
- [x] 3.3 `AuthRepositoryImpl`: derivar `AuthUserEntity` via `JwtDecoder` no login e no `currentSession`; `signOut` limpa tokens localmente (sem chamada remota); `getProfile` deriva do token (ou remover se sem uso)
- [x] 3.4 Atualizar `auth_mapper`/DTOs conforme o novo shape

## 4. UI: tela de login — skills `flutter-ui-mvvm` / `flutter-design-system`

- [x] 4.1 `lib/ui/auth/view_model/login_state.dart` e `login_cubit.dart` (sem imports de Flutter); chama `SignInUseCase`; estados idle/loading/success/failure
- [x] 4.2 `lib/ui/auth/login_page.dart` (StatefulWidget) resolvendo `LoginCubit` via `getIt`, `dispose` fecha o cubit, explicit-bloc `BlocBuilder`/`BlocListener`, sem `BlocProvider`
- [x] 4.3 Form email+senha: validação inline; submit desabilitado em loading; usar `PrimaryButton` e tokens de tema
- [x] 4.4 Erro de credencial via `AppToast` (mensagem genérica, sem enumeração); sucesso atualiza a sessão
- [x] 4.5 Strings de login em `app_pt.arb` e `app_en.arb` (rodar `flutter gen-l10n`)

## 5. App: sessão, guard e startup — skill `flutter-app-composition`

- [x] 5.1 `AuthSessionCubit` (singleton) com `AuthStatus { unknown, authenticated, unauthenticated }`, atualizado em login/logout/restore/refresh
- [x] 5.2 `appRouter` vira factory recebendo o cubit; `redirect` (unauth→`/login`, auth em `/login`→home) + `refreshListenable: GoRouterRefreshStream(cubit.stream)`; adicionar rota `/login`
- [x] 5.3 `bootstrap`: restaurar sessão (`RestoreSessionUseCase`), anexar bearer (`HttpClient.setAuthToken`), setar `AuthStatus` inicial antes do primeiro frame
- [x] 5.4 `app_widget`: usar o router factory; estado neutro/splash enquanto `unknown`
- [x] 5.5 DI ui module: registrar `LoginCubit` (factory) e `AuthSessionCubit` (singleton); conferir ordem dos módulos
- [x] 5.6 Logout (via `SignOutUseCase`) limpa tokens + bearer, seta `unauthenticated` e roteia para `/login`

## 6. Testes — skill `flutter-testing`

- [x] 6.1 `LoginCubit`: sucesso, credenciais inválidas (toast/failure), validação (mocktail + bloc_test)
- [x] 6.2 `AuthSessionCubit`: transições unknown→authenticated/unauthenticated em login/logout/restore
- [x] 6.3 Repository: usuário derivado do token; `signOut` local; mapeamento de exceções→`AuthFailure`
- [x] 6.4 Widget test do `LoginPage` (form, validação, estado de loading) com `pumpApp` + l10n
- [x] 6.5 Interceptor: 401 dispara refresh+retry; falha de refresh → `unauthenticated`

## 7. Verificação — skill `verify`

- [x] 7.1 `flutter analyze` e `flutter test` verdes; `build_runner`/`gen-l10n` sem erro
- [ ] 7.2 Com o backend rodando: login com o MASTER do seed → vai para a home mostrando o usuário; credencial inválida → toast
- [ ] 7.3 Reabrir o app com sessão salva → restaura autenticado; logout → volta para `/login`
- [x] 7.4 Confirmar que `lib/ui` não tem regra de domínio, ViewModels sem imports de Flutter, e que o token é anexado às requisições autenticadas
