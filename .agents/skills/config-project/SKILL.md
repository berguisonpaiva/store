---
name: config-project
description: Inicializar ou continuar um projeto no padrão TurboRepo com frontend (Next.js) e backend (NestJS Fastify sem git interno), criando/reconciliando a estrutura base via `npx create-turbo@latest` no diretório atual quando necessário e aplicando setup idempotente por `skills.config.json` (com override via CLI). Detecta Bun/pnpm/npm pelo `packageManager`/lockfile e usa o package manager do projeto. Também gera Docker por app, docs API Scalar/Swagger e base de evals. Usar quando o pedido envolver bootstrap de monorepo web+backend, setup inicial Next+Nest, Bun, Docker, Fastify, documentação API ou padronização das tasks de `test/build` no Turbo.
---

# Config Project

## Overview

Executar um script determinístico e idempotente para bootstrap web+backend no padrão do monorepo.
O fluxo usa `npx create-turbo@latest` para gerar a base padrão do TurboRepo (incluindo configs compartilhadas e `.gitignore`) e reconcilia apenas o que estiver faltando na pasta atual.
O package manager é detectado por `package.json > packageManager`, lockfile e runtime disponível; quando Bun é detectado, usar `bun install`, `bun add` e `bun run`.
Se `.git` já existir no diretório atual, o scaffold é executado com `--no-git` para evitar recriação de repositório git.
Depois cria frontend/backend apenas quando necessário, aplica namespace do `skills.config.json` nos pacotes e atualiza somente os arquivos pendentes.
As configurações padrão são lidas de `skills.config.json` (em `.Codex/skills/.env`, `.Codex/skills/.env` ou `.env/` no repositório de skills).

## Workflow

1. Ler defaults de `namespace`, `frontendAppPath`, `backendAppPath`, `frontendPort`, `backendPort` e env vars no `skills.config.json`.
2. Detectar gaps da estrutura Turbo na pasta atual; quando necessário, executar `npx create-turbo@latest` e reconciliar somente os arquivos/pastas ausentes (`packages/eslint-config`, `packages/typescript-config`, `.gitignore`, `.npmrc`, configs base).
3. Antes de criar apps customizados, remover os projetos padrão do Turbo (`apps/docs`, `apps/frontend` e `packages/ui`) quando detectados como template original.
4. Criar app frontend com `create-next-app --src-dir` somente se `frontendAppPath` ainda não existir como app Next.js, garantindo estrutura `src/` no frontend.
5. Criar app backend com `nest new --skip-git` somente se `backendAppPath` ainda não existir como app NestJS.
6. Garantir namespace em todos os projetos do workspace (`apps/*`, `modules/*` e `packages/*`), incluindo frontend/backend, usando `namespace` do config (ou `--scope`).
7. Instalar apenas dependências faltantes com o package manager detectado (`turbo`, `ts-node` e `prettier` no root, `dotenv`, Fastify, Swagger, Scalar e validação no backend).
8. Atualizar `package.json` root, garantir `.prettierrc` no root e atualizar `turbo.json` de forma incremental.
9. Ajustar `next.config.ts|js|mjs` do frontend para garantir `images.remotePatterns` liberando imagens remotas em `http` e `https` com `hostname: "**"` (idempotente).
10. Atualizar `.env` e `.env.example` de frontend/backend via upsert (sem apagar chaves extras existentes).
11. Ajustar `main.ts` do backend para NestJS Fastify com `trustProxy`, `@fastify/cors`, `@fastify/multipart`, prefixo global `/api`, `ValidationPipe`, Scalar em `/docs`, OpenAPI JSON em `/docs-json` e Swagger em `/swagger`.
12. Criar `src/core/config/env.config.ts` e `src/core/docs/setup-docs.ts` no backend.
13. Gerar Docker por app: `<frontend>/Dockerfile`, `<backend>/Dockerfile`, `.dockerignore` e `docker-compose.yml`.
14. Registrar execução em `.log/skills.log` com título da skill e lista simples dos comandos/ações relevantes (sem timestamps e sem status), garantindo `.log/` no `.gitignore`.
15. Formatar todos os arquivos do projeto com Prettier executando `<package-manager> run format` na raiz do monorepo.

## Backend HTTP padrão

O backend NestJS deve usar Fastify por padrão:

- `FastifyAdapter({ trustProxy: true })`
- `@fastify/cors` com `origin: env.corsOrigin`, `credentials: true` e métodos `GET,POST,PUT,PATCH,DELETE,OPTIONS`
- `@fastify/multipart` com limites conservadores
- `app.setGlobalPrefix('api')` excluindo `docs`, `docs-json` e `swagger`
- `ValidationPipe` global com `whitelist`, `forbidNonWhitelisted`, `transform` e `enableImplicitConversion`
- `setupDocs(app)` criando Scalar em `/docs`, Swagger em `/swagger` e JSON em `/docs-json`

## Frontend Next.js padrão

Para frontend Next.js App Router:

- usar Server Components por padrão;
- usar Server Actions para formulários/mutações simples;
- usar `searchParams`/`useSearchParams` para estado compartilhável de busca/filtro/paginação;
- usar `nuqs` quando search params precisarem de parsing tipado, defaults e serialização;
- usar Zustand apenas para estado client-only compartilhado que não pertence à URL nem ao servidor.

## Docker padrão

Cada app gerado deve ter Dockerfile próprio usando a raiz do monorepo como contexto:

- `<frontendAppPath>/Dockerfile`
- `<backendAppPath>/Dockerfile`
- `.dockerignore`
- `docker-compose.yml`

O Dockerfile deve respeitar o package manager detectado, com preferência para Bun quando o projeto estiver em Bun.

## Evals da skill

Manter `evals/evals.json` para esta skill com prompts realistas e checks objetivos. Evals mínimos:

- bootstrap em repositório vazio com Bun;
- reaplicação idempotente sem duplicar Dockerfiles/env/scripts;
- backend gerado contém Fastify, docs e prefixo `/api`;
- frontend gerado documenta uso de Server Actions, `nuqs` e Zustand onde aplicável.

## Commands

Fluxo padrão:

```bash
node .Codex/skills/config-project/scripts/project-init.mjs
```

> Se o repositório estiver instalado em `.Codex/skills`, ajuste o caminho dos comandos.

Pular instalação global do Nest CLI (forçar `npx`):

```bash
node .Codex/skills/config-project/scripts/project-init.mjs --skip-global-nest
```

Customizar paths e portas:

```bash
node .Codex/skills/config-project/scripts/project-init.mjs \
  --frontend-path apps/frontend \
  --backend-path apps/api \
  --frontend-port 3000 \
  --backend-port 4000
```

Customizar nomes das env vars de porta/url:

```bash
node .Codex/skills/config-project/scripts/project-init.mjs \
  --frontend-api-env-var NEXT_PUBLIC_API_URL \
  --backend-port-env-var PORT
```

Sobrescrever namespace por CLI:

```bash
node .Codex/skills/config-project/scripts/project-init.mjs --scope @namespace
```

## Resources

- `scripts/project-init.mjs`: script principal de bootstrap.
- `evals/evals.json`: prompts e expectativas objetivas para validar a skill como produto.
- `references/bootstrap-contract.md`: contrato dos arquivos e alterações que o bootstrap aplica.
- Log local de execução: `.log/skills.log` (não versionado; `.log/` é adicionado ao `.gitignore` automaticamente, sem metadados extras).

## Risk Logging Guardrails

- Registrar fatos de execucao em `.log/skills.log` com marcador no inicio da linha.
- Marcadores minimos esperados: `[CMD]`, `[FILE_CREATE]`, `[FILE_UPDATE]`, `[FILE_DELETE]`, `[DIR_CREATE]`, `[RISK]`, `[FAIL]`, `[AI]`.
- Sempre registrar `[RISK]` quando houver sobrescrita, exclusao, rename/move, ou fallback forcado em arquivos/pastas.
- Toda falha inesperada deve gerar `[FAIL]` com descricao factual curta do evento.
- Operacoes de terminal e alteracoes de arquivos devem passar pelos utilitarios compartilhados em `../utils` para manter rastreabilidade consistente.

## Global Standards

- Consultar `../skills-standards.md` para package manager, Docker, Fastify, Next.js e evals.
