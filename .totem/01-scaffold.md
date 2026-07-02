# Tarefa: Scaffold do monorepo Totem (projeto NOVO — rode PRIMEIRO)

Fonte da verdade = [00-fundacao.md](00-fundacao.md). Este é o **primeiro doc executável**: cria o monorepo e a fundação de cada app num repo **vazio**. Nenhum doc de contexto (`03`+) funciona sem ele — todos usam skills (`config-new-module`, `module-*`, `flutter-domain-layer`…) que **pressupõem** esta infraestrutura. Tudo em inglês; sem regra de negócio aqui.

Escopo: monorepo TurboRepo + 3 apps + shared-contracts + tooling de teste/portões funcionando de ponta a ponta ("hello world" buildável em cada app).

## Ordem de execução

### 1. Monorepo (skill: config-project)

- TurboRepo com workspaces; package manager Bun (`packageManager` + `bun.lock`); tasks `build`/`test`/`lint` no `turbo.json`.
- `apps/api` — NestJS sobre **Fastify**; `apps/admin` — Next.js (App Router); `.env.example` por app.

### 2. API base — `apps/api` (skills: config-prisma, config-shared-backend)

- **config-prisma**: schema modular por domínio (`prisma/models/{device,catalog,order}.model.prisma` vazios/mínimos), `prisma.config.ts`, Docker Compose do Postgres compatível com `DATABASE_URL` do `.env`, seed técnico em `prisma/seed/main.ts`, `DbModule` + `PrismaService` com `TransactionManager`/`runInTransaction`.
- **config-shared-backend**: camada `src/shared/` — tratamento centralizado de erros, JWT (passport), guards, decorators em inglês. Os guards serão especializados em [02-auth.md](02-auth.md) (device token × usuário admin).
- Global prefix `api`; `ValidationPipe` global; OpenAPI (Scalar `/docs`, Swagger `/swagger`).

### 3. Totem base — `apps/totem` (skills: flutter-clean-architecture, flutter-app-composition)

- `flutter create` desktop **Windows**; estrutura por bounded context (`lib/{device,catalog,order,payment,printing,sync}/{domain,data,ui}` + `lib/app` + `lib/core`).
- **flutter-app-composition**: composition root com **get_it manual** (módulos DI por contexto, na ordem `device → catalog → order → payment/printing → sync`), router (GoRouter), `bootstrap()` que futuramente inicia o `SyncQueueWorker` **fora da árvore de UI** (I5, ver [08-sync.md](08-sync.md)).
- `lib/core`: wrappers técnicos genéricos (HTTP client com interceptor de auth plugável — usado em [02-auth.md](02-auth.md) —, clock, logger, storage seguro do Windows).
- Drift/SQLite configurado (banco local + migrações) — os contextos criam suas tabelas depois.

### 4. Admin base — `apps/admin` (skills: config-frontend-layout, tailwind-v4-shadcn)

- Shell do painel: layout com sidebar, tema dark, tokens shadcn/ui; rotas `(public)`/`(private)` preparadas para o guard de sessão de [02-auth.md](02-auth.md).

### 5. Contratos — `packages/shared-contracts`

- DTOs espelhados totem↔api (sem bridge TS/Dart): **JSON Schema como fonte** (`order`, `catalog`, `device`, `heartbeat`), tipos TS gerados/escritos + classes Dart espelhadas.
- **Teste de schema dos dois lados**: na API (jest valida DTOs contra os schemas) e no totem (teste Dart valida os modelos contra os mesmos schemas via fixtures). Divergiu → CI quebra.

## Invariantes desta etapa

- Cada app builda e testa vazio: os **portões dos docs `03`+ dependem disso**.
- Nada de regra de negócio; apenas fundação, DI, tooling e contratos.

> **IMPORTANTE — divida em subagents independentes, um por app.**

### Estado atual (LEIA ANTES)

Repo **vazio** (greenfield confirmado). Este doc não tem pré-requisitos. Se algum scaffold parcial existir, **alinhar e editar**, nunca recriar em paralelo.

### Por que separar

- api, totem, admin e shared-contracts são independentes entre si neste estágio.
- Fronteira de revisão clara: um diff coeso por app.
- shared-contracts precisa dos dois lados existirem — vai por último.

### Portão de cada subagent

api: `turbo build --filter=api && bun test`; totem: `flutter analyze && flutter test`; admin: `bun run build && bun run lint`; contracts: testes de schema verdes nos dois lados.

### Ordem

1. **Subagent 1 — Monorepo** (bloqueante, seção 1).
2. **Subagent 2 — API base**, **Subagent 3 — Totem base**, **Subagent 4 — Admin base** em paralelo (seções 2–4).
3. **Subagent 5 — shared-contracts** (seção 5), depende de 2 e 3.
4. **Subagent 6 — Revisão**: monorepo builda do zero (`turbo build` + testes + lint em tudo); estrutura por contexto confere com [00-fundacao.md](00-fundacao.md).
