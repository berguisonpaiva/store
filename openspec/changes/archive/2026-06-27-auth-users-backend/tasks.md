> Backend-only. Toda regra de negócio permanece no domínio (pacote `@repo/auth`, em `modules/auth`, com aggregates `user` + `auth`); este change só adapta infraestrutura e apresentação. **Sempre usar a skill indicada em cada grupo.** Constraints de banco entram apenas como rede de segurança redundante.

## 1. Pré-requisitos

- [x] 1.1 Confirmar que `auth-users-domain` foi aplicado e que o pacote `@repo/auth` (`modules/auth`, aggregates `user` + `auth`) existe e compila
- [x] 1.2 Adicionar `@repo/auth` às dependências de `apps/backend/package.json`
- [x] 1.3 Adicionar deps `bcrypt` + `@types/bcrypt` ao backend

## 2. Infra Prisma — skill `config-prisma`

- [x] 2.1 `node .claude/skills/config-prisma/scripts/init-prisma-backend.js --apply --install` e depois `--module users`
- [x] 2.2 Conferir `apps/backend/src/db/{db.module.ts,prisma.service.ts}` com `TransactionManager`/`runInTransaction`
- [x] 2.3 Conferir `prisma.config.ts`, scripts (`db:start`, `prisma:*`) e `docker-compose.yml` alinhados ao `DATABASE_URL`
- [x] 2.4 Definir env: `DATABASE_URL`, `JWT_SECRET`, `JWT_ACCESS_TTL`, `JWT_REFRESH_SECRET`, `JWT_REFRESH_TTL` em `.env` e `.env.example`

## 3. Schema e persistência — skill `backend-prisma-data`

- [x] 3.1 `users.model.prisma`: model `User` (id, name, email com índice único como rede de segurança, role, active, timestamps) + model `UserPassword` 1:1 (userId, hash, timestamps) — sem coluna de senha em texto puro
- [x] 3.2 Gerar migration + `prisma:generate`
- [x] 3.3 `UserPrismaRepository` implementando `UserRepository` de `@repo/auth` (`create/update/findById/delete/findByEmail/countActiveByRole`)
- [x] 3.4 Mapeamento `toDomain`/`fromDomain` reconstruindo `User` + `HashPassword`, escrevendo as duas tabelas em `runInTransaction`
- [x] 3.5 `UserPrismaQuery` implementando `UserQuery` de `@repo/auth` para `list-users` (paginado + filtros papel/ativo), retornando `UserDTO` sem hash; `find-user-by-id` via repositório
- [x] 3.6 Mapear violação do índice único de email de volta para `EMAIL_ALREADY_IN_USE` (não vazar erro do Prisma)

## 4. Implementações dos ports — skills `backend-prisma-data` / `config-shared-backend`

- [x] 4.1 `BcryptHashGenerator` implementando `HashGenerator` (gera hash compatível com `HashPassword`)
- [x] 4.2 `BcryptHashComparer` implementando `HashComparer` (compare + dummy-compare para email desconhecido)
- [x] 4.3 `JwtTokenService` implementando `TokenService` via `@nestjs/jwt`: access token curto (`JWT_SECRET`/`JWT_ACCESS_TTL`) + refresh (`JWT_REFRESH_SECRET`/`JWT_REFRESH_TTL`), e validação de ambos retornando `AuthenticatedUser`

## 5. Guard de papéis — skill `config-shared-backend`

- [x] 5.1 Criar `RolesGuard` em `apps/backend/src/shared/auth/` lendo o papel exigido via metadata
- [x] 5.2 Criar decorator `@Papeis(...UserRole)` (usando o enum `UserRole` do domínio)
- [x] 5.3 Estender `JwtPayload`/`JwtStrategy`/`SharedModule` para carregar `role` no token (acesso curto) e ajustar `expiresIn` para o access TTL
- [x] 5.4 Registrar `RolesGuard` no `SharedModule` (exportável); manter `JwtGuard`/`@Public`/`@CurrentUser`

## 6. Mapeamento de erros — skill `backend-controller`

- [x] 6.1 Mapper de código de domínio → HTTP: `EMAIL_ALREADY_IN_USE`→409, `USER_NOT_FOUND`→404, `OPERATION_NOT_ALLOWED_FOR_ROLE`→403, `INVALID_CREDENTIALS`→401, `INVALID_TOKEN`→401, `USER_INACTIVE`→403, validação→400
- [x] 6.2 Helper para traduzir `result.isFailure` em `HttpException` coerente

## 7. UsersModule (backend) — skills `config-new-module` / `backend-controller`

- [x] 7.1 Scaffold `apps/backend/src/modules/users/` (module, controller, provider de wiring, dtos)
- [x] 7.2 DTOs HTTP + `class-validator` (create, update, change-password, query de listagem)
- [x] 7.3 `UsersController`: `POST /api/users`, `PATCH /:id`, `PATCH /:id/activate`, `PATCH /:id/deactivate`, `PATCH /:id/password`, `GET /` (paginado/filtros), `GET /:id`
- [x] 7.4 Aplicar `@UseGuards(JwtGuard, RolesGuard)` + `@Papeis(MASTER, ADMIN)` nas rotas restritas; `change-password` para o próprio usuário
- [x] 7.5 Wiring DI: instanciar use cases de `@repo/auth` (`CreateUser`, `UpdateUser`, `ActivateUser`, `DeactivateUser`, `ChangePassword`, `FindUserById`, `ListUsers`) com `UserPrismaRepository`, `UserPrismaQuery`, `BcryptHashGenerator`, `BcryptHashComparer`
- [x] 7.6 Swagger/OpenAPI (`@ApiTags`, `@ApiOperation`, `@ApiResponse`, `@ApiBearerAuth`) em todos os endpoints

## 8. AuthModule (backend) — skills `config-new-module` / `backend-controller`

- [x] 8.1 Scaffold `apps/backend/src/modules/auth/` (module, controller, wiring, dtos)
- [x] 8.2 DTOs HTTP: login (email, senha), refresh (refreshToken), respostas de token
- [x] 8.3 `AuthController`: `POST /api/auth/login` e `POST /api/auth/refresh` com `@Public()`
- [x] 8.4 Wiring DI: use cases `Login`/`RefreshToken`/`ValidateToken` de `@repo/auth` com `JwtTokenService`, `BcryptHashComparer` e o `UserReader` (find-by-email), implementado pelo `UserPrismaRepository`
- [x] 8.5 Swagger/OpenAPI documentando endpoints públicos e formato de erro genérico do login

## 9. Registro e seed

- [x] 9.1 Registrar `UsersModule` e `AuthModule` em `apps/backend/src/app.module.ts` (e `DbModule` se ausente)
- [x] 9.2 Seed técnico criando 1 MASTER ativo (credenciais via `SEED_MASTER_EMAIL`/`SEED_MASTER_PASSWORD` com fallback local), hash em `UserPassword`

## 10. Verificação — skill `verify`

- [ ] 10.1 `prisma:migrate:dev` + `prisma:generate` + `prisma:seed` locais sem erro
- [x] 10.2 Build do backend verde
- [ ] 10.3 Subir o backend e validar via `/docs`: login → access+refresh, refresh, rota protegida exige papel (401 sem token, 403 papel errado)
- [x] 10.4 Conferir que nenhum controller/adapter contém regra de domínio e que a senha só existe como hash na tabela `UserPassword`
