# Tarefa: Implementar o módulo Auth (padrão do monorepo)

Fonte da verdade = as regras abaixo. Siga a arquitetura em camadas já usada no repo
(domínio puro em `modules/*`, casca NestJS em `apps/backend`, web em `apps/web`,
mobile em `apps/mobile`). Reutilize `@repo/shared` e os guards/decorators já existentes.
Código, pastas e nomes de erro SEMPRE em inglês. Cada pasta com `index.ts` de barrel.

Escopo: perfis ADMIN e OPERADOR apenas; single-tenant; senha só como hash.

## Ordem de execução (respeite as dependências)

### 1. Domínio — `modules/auth` (skills: module-value-object, module-entity, module-dto, module-repository, module-query-cqrs, module-domain-service, module-use-case)

Agregado `user` em `modules/auth/src/user/`:

- **model/**
  - `user-role.ts` — enum `UserRole = { ADMIN, OPERADOR }` (RN01).
  - `user.entity.ts` — `User` (Entity + Result) com: `name` (PersonName), `email` (Email),
    `password` (HashPassword — nunca texto puro, RN08), `role` (UserRole), `active` (bool).
    Reusar VOs de `@repo/shared`. Sem HTTP/DB/framework.
- **errors/** `user-error.ts` — `UserNotFound`, `EmailAlreadyInUse`, `CannotDeactivateSelf` (RN05).
- **dto/** `user.dto.ts` — saída `{ id, name, email, role, status }` (sem hash, RN08); filtros de listagem `{ status?, role? }`.
- **provider/** (ports = interfaces):
  - `user.repository.ts` — `UsersRepository`: `findByEmail`, `findById`, `create`, `save`, `list`.
  - `hash-generator.ts` — `HashGenerator.hash(plain)`.
  - `hash-comparer.ts` — `HashComparer.compare(plain, hash)`.
- **service/** `unique-email.specification.ts`, `role-authorization.policy.ts` (só ADMIN opera CRUD, RN04/RN07),
  regra "não desativar a si mesmo" (RN05).
- **use-case/** (cada um retorna `Result`, mapeando falhas para os erros acima):
  - `create-user.use-case.ts` — ADMIN. in `{name,email,password,role}` → `{userId}`. usa findByEmail + HashGenerator + create. Erro: `EmailAlreadyInUse`.
  - `update-user.use-case.ts` — ADMIN. in `{userId,name,email,role}`. Erros: `UserNotFound`, `EmailAlreadyInUse`.
  - `deactivate-user.use-case.ts` — ADMIN. in `{userId, requesterId}`. Erros: `UserNotFound`, `CannotDeactivateSelf`.
  - `activate-user.use-case.ts` — ADMIN.
  - `list-users.use-case.ts` — ADMIN. filtros opcionais `status`, `role`.
  - `find-user-by-id.use-case.ts` — retorna `{id,name,email,role,status}`. Erro: `UserNotFound`. (GetCurrentUser usa o userId do contexto autenticado.)

Agregado `auth` em `modules/auth/src/auth/`:

- **provider/** `token-service.ts` — port `Encrypter`: gera accessToken a partir de `{ userId, role }`.
- **errors/** `auth-error.ts` — `InvalidCredentials`, `UserInactive`.
- **use-case/** `login.use-case.ts` — in `{email, senha}` → `{ accessToken, {id,name,role} }`.
  usa UsersRepository.findByEmail + HashComparer + Encrypter.
  Erros: `InvalidCredentials` (email inexistente OU senha errada — mesmo erro genérico),
  `UserInactive` (RN02). Usuário inativo nunca autentica.

Cobrir com testes (jest) usando mocks in-memory no padrão de `modules/auth/test/mock/*`.
Exportar tudo pelos `index.ts` até `modules/auth/src/index.ts`.

### 2. Backend — `apps/backend/src/modules/{auth,users}` (skills: backend-controller, backend-prisma-data, config-shared-backend)

- **Adapters dos ports** em `adapters/`:
  - `user.prisma.repository.ts` (UsersRepository via Prisma/Postgres, mapeando toDomain/fromDomain).
  - `jwt-token-service.ts` (Encrypter), reusar `bcrypt-hash-generator.ts` / `bcrypt-hash-comparer.ts` de `shared/crypto`.
- **Prisma**: model `User` em `apps/backend/prisma/models/*.model.prisma` (id, name, email único, passwordHash, role, active, timestamps), migração e seed técnico de um ADMIN inicial.
- **Controllers + http DTOs** (`dto/*.http.dto.ts`, validação class-validator, Swagger `@ApiTags/@ApiOperation/@ApiResponse/@ApiBearerAuth`):
  - `auth.controller.ts`: `POST /auth/login` (marcado `@Public()`), `GET /auth/me` (usa `@CurrentUser`) → GetCurrentUser.
  - `users.controller.ts`: CRUD protegido com `@Roles('ADMIN')` (RN04/RN07): list, create, update, activate/deactivate.
- **Autorização real no backend** via `roles.guard.ts` — nunca confiar só na UI (RN07). Toda rota autenticada exceto login (RN06).
- Mapear erros de domínio → HTTP em `shared/errors/domain-error.mapper.ts` (InvalidCredentials/UserInactive → 401, EmailAlreadyInUse → 409, UserNotFound → 404, CannotDeactivateSelf → 400/422).
- Registrar em `auth.module.ts` / `users.module.ts` o binding port→adapter.

### 3. Web — `apps/web` (skills: config-frontend-layout, frontend-form-schema)

- Tela de **login** (form React Hook Form + Zod, schema `*.schema.ts`).
- Adicionar item **Usuários** na sidebar do layout admin existente; item **só aparece para ADMIN** (RN04) — ocultação é reforço, não segurança.
- Página de gestão de usuários: no load, checa permissão; se não for ADMIN, redireciona para a principal (RN07).
- Ações: listar, criar, editar, ativar/desativar (consumindo as rotas do backend).

### 4. Mobile — `apps/mobile` (Flutter; skills flutter-\*)

- Tela de **login** (funciona para qualquer role; foco OPERADOR).
- Persistência local do token de sessão + logout.
- Sem gestão de usuários neste MVP.

## Invariantes a garantir (checklist)

RN01 ADMIN/OPERADOR • RN02 inativo não autentica • RN03 single-tenant • RN04 só ADMIN gerencia
• RN05 não desativar a si mesmo • RN06 toda rota autenticada exceto login • RN07 autorização no backend
• RN08 senha só hash, nunca retornada.

> **IMPORTANTE — divida em subagents independentes, um por camada.**

### Estado atual (LEIA ANTES)

O módulo NÃO é greenfield. Já existem `modules/auth/src/{user,auth}`, os controllers/adapters
em `apps/backend/src/modules/{auth,users}` e os guards/decorators compartilhados.
REGRA: **alinhar e editar o que existe**, nunca recriar em paralelo. Antes de escrever,
cada subagent lê os arquivos da sua camada e faz diff mínimo contra estas RN.
Divergências a reconciliar: código atual tem `MASTER` (doc só ADMIN/OPERADOR) e casos de uso
extras (refresh-token, change-password, delete) — confirmar escopo antes de remover/alterar.

### Por que separar

- Contexto enxuto: cada agente carrega só a skill e os arquivos da sua camada.
- Paralelismo real: web e mobile são independentes.
- Fronteira de revisão clara: um diff coeso por camada, fácil de reverter.
- Respeita a dependência de build: domínio compila antes do backend consumir.

### Portão de cada subagent

Invoca a skill da camada → edita → `turbo build --filter=<pkg>` + `bun test` verdes → entrega diff.

### Ordem

1. **Subagent 1 — Domínio** (seção 1). Bloqueante: entidades, ports, contratos e erros. Testes jest verdes.
2. **Subagent 2 — Backend** (seção 2), depende de (1). Sub-ordem: schema Prisma + migração → adapters dos ports → controllers/DTOs. Bind port→adapter nos módulos.
3. **Subagent 3 — Web** e **Subagent 4 — Mobile** (seções 3 e 4): em paralelo assim que a API estiver contratada.
4. **Subagent 5 — Revisão**: valida o fluxo de login + CRUD de usuários ponta a ponta, autorização por role no backend (RN04/RN07), senha nunca retornada (RN08); roda build + testes + lint no monorepo.
