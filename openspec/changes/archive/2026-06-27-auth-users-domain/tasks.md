> Princípio: **todas as verificações ficam na regra de negócio** (VO → entidade → domain service/policy → use case). Nenhuma regra é delegada ao banco (sem unique index, check, FK ou trigger). **Sempre usar a skill indicada em cada grupo.**

## 1. Scaffold `users` module — skill `module-aggregate`

- [x] 1.1 Criar `modules/users` via script: `node .claude/skills/module-aggregate/scripts/create-aggregate.js --module users --aggregate user --mode crud`
- [x] 1.2 Verificar estrutura gerada (`src/user/{model,provider,use-case,dto}`, `src/index.ts`, `test/**`) e export de `./user` em `modules/users/src/index.ts`
- [x] 1.3 Registrar o package `users` no workspace (package.json, dependência de `packages/shared`, tsconfig) e garantir build + testes rodando

## 2. Value objects — skill `module-value-object`

- [x] 2.1 Reutilizar VOs do `packages/shared` (`PersonName`, `Email`, `StrongPassword`, `HashPassword`, `Id`); criar VO de módulo só se necessário, com `create`/`tryCreate` + `Result` e código de erro estático
- [x] 2.2 Confirmar que cada VO valida e normaliza no próprio VO (nada de validação adiada para use case/banco)

## 3. Entidade `User` — skill `module-entity`

- [x] 3.1 `UserRole` enum (`MASTER`, `ADMIN`, `OPERADOR`) em `src/user/model`
- [x] 3.2 Entidade `User` estendendo `Entity` com props name (`PersonName`), email (`Email`), passwordHash (`HashPassword`), role (`UserRole`), active (boolean); construtor privado, `tryCreate` com `Result.combine`
- [x] 3.3 Invariantes de identidade/estado na própria entidade; métodos de domínio `activate()` / `deactivate()` / `changeRole()` / `changePasswordHash()` reaplicando validação via `cloneWith`
- [x] 3.4 Garantir que a entidade nunca recebe/expõe senha em texto puro (apenas `HashPassword`)

## 4. Domain services / policies — skill `module-domain-service`

- [x] 4.1 `UniqueEmailSpecification` — decide unicidade a partir de `findByEmail` (regra no domínio, não no banco) → `EMAIL_ALREADY_IN_USE`
- [x] 4.2 `LastMasterPolicy` — decide se desativar/rebaixar é permitido a partir da contagem de MASTERs ativos → `OPERATION_NOT_ALLOWED_FOR_ROLE`
- [x] 4.3 `RoleAuthorizationPolicy` — avalia em memória se o ator (MASTER/ADMIN) pode criar/editar/alterar papel → `OPERATION_NOT_ALLOWED_FOR_ROLE`
- [x] 4.4 `CredentialsPolicy` (auth) — decide resultado de login a partir do `User` carregado + comparação de hash + flag `active`
- [x] 4.5 Serviços puros, sem I/O/framework; testes unitários cobrindo bordas

## 5. Ports (contratos) — skill `module-repository`

- [x] 5.1 `UsersRepository` estendendo `CrudRepository<User>` + leituras que alimentam o domínio: `findByEmail(email)` e `countActiveByRole(role)`
- [x] 5.2 `HashGenerator` (`hash(plain) -> HashPassword`) e `HashComparer` (`compare(plain, hash) -> boolean`) como interfaces
- [x] 5.3 Expor port de leitura estreito (find-by-email) em `modules/users/src/index.ts` para consumo do `auth`
- [x] 5.4 Sem qualquer implementação concreta de infra/banco no módulo

## 6. DTOs — skill `module-dto`

- [x] 6.1 Input DTOs: create-user, update-user, change-password, com o papel do ator quando exigir autorização
- [x] 6.2 Output/Query DTOs reusando paginação de `packages/shared`; sem vazar entidade/ORM

## 7. Commands (use cases) — skill `module-use-case`

- [x] 7.1 `create-user` — `RoleAuthorizationPolicy` → `UniqueEmailSpecification` → `HashGenerator.hash` → persistir (RF-USR-01, 02, 03, 09)
- [x] 7.2 `update-user` — autorizar → existir (`USER_NOT_FOUND`) → unicidade de email → atualizar via `cloneWith` (RF-USR-04, 02, 09)
- [x] 7.3 `activate-user` — `User.activate()` (RF-USR-05)
- [x] 7.4 `deactivate-user` — `LastMasterPolicy` antes de `User.deactivate()` (RF-USR-05, 06)
- [x] 7.5 `change-password` — verificar senha atual via `HashComparer` → validar nova com `StrongPassword` → `HashGenerator.hash` → persistir (RF-USR-07)
- [x] 7.6 Use cases só orquestram; invariantes ficam em VO/entidade/policy; falhas com `Result.fail(<CODE>)`

## 8. Queries (use cases) — skill `module-query-cqrs`

- [x] 8.1 `list-users` — paginado, filtros opcionais por papel e status ativo (RF-USR-08)
- [x] 8.2 `find-user-by-id` — retorna usuário ou `USER_NOT_FOUND`

## 9. Testes do `users` — skills `module-entity` / `module-use-case` / `module-domain-service`

- [x] 9.1 Fakes in-memory de `UsersRepository`, `HashGenerator`, `HashComparer` em `modules/users/test/**`
- [x] 9.2 Testes de entidade: criação válida/ inválida, senha-só-hash, transições de estado
- [x] 9.3 Testes de policy/specification: unicidade de email, último MASTER ativo, autorização por papel
- [x] 9.4 Testes de command e query cobrindo cada invariante e os códigos de erro

## 10. Scaffold `auth` module — skill `module-aggregate`

- [x] 10.1 Criar `modules/auth` via script (mode `example`/mínimo) e verificar `src/index.ts`
- [x] 10.2 Registrar package `auth` no workspace, dependendo de `packages/shared` e do port de leitura de `modules/users`

## 11. Ports e DTOs do `auth` — skills `module-repository` / `module-dto`

- [x] 11.1 `TokenService` (`generateAccessToken`, `generateRefreshToken`, `validateAccessToken`, `validateRefreshToken`) sobre tokens opacos
- [x] 11.2 Reutilizar `HashComparer` e o port de leitura (find-by-email) de `users`
- [x] 11.3 DTOs: login (in/out), refresh (in/out), e `AuthenticatedUser` (shared) na validação de token

## 12. Use cases do `auth` — skills `module-use-case` / `module-domain-service` / `module-query-cqrs`

- [x] 12.1 `login` — carregar por email → `CredentialsPolicy` (inativo → `USER_INACTIVE`; email desconhecido ou senha errada → `INVALID_CREDENTIALS` genérico) → emitir access + refresh (RF-AUTH-01, 02, 03)
- [x] 12.2 `refresh-token` — validar refresh via `TokenService` → novo access token; `INVALID_TOKEN` em falha (RF-AUTH-04)
- [x] 12.3 `validate-token` (query) — validar access via `TokenService` → `AuthenticatedUser` ou `INVALID_TOKEN`

## 13. Testes do `auth` — skill `module-use-case`

- [x] 13.1 Fakes de `TokenService`, `HashComparer` e port de leitura de `users` em `modules/auth/test/**`
- [x] 13.2 Login: sucesso, usuário inativo bloqueado, erro genérico idêntico para email desconhecido vs senha errada
- [x] 13.3 Refresh: token válido emite novo access; inválido/expirado falha
- [x] 13.4 Validação de token: válido retorna identidade; inválido falha

## 14. Wire-up e verificação

- [x] 14.1 Exportar contratos públicos em `modules/users/src/index.ts` e `modules/auth/src/index.ts`
- [x] 14.2 Confirmar ausência de código NestJS/HTTP/DB/JWT-lib/UI nos módulos (domínio puro) e que nenhuma regra depende do banco
- [x] 14.3 Rodar build do workspace + suítes de teste dos módulos; tudo verde
