# TurboRepo Web+Backend Bootstrap Contract

## Goal

Padronizar o bootstrap de um monorepo TurboRepo para:

- `<frontendAppPath>` (Next.js)
- `<backendAppPath>` (NestJS Fastify sem git interno)

Com defaults obtidos de `skills.config.json`:

- `namespace` (padrão: `@namespace`)
- `frontendAppPath` (padrão: `apps/frontend`)
- `backendAppPath` (padrão: `apps/backend`)
- `frontendPort` (padrão: `3000`)
- `backendPort` (padrão: `4000`)
- `frontendApiUrlEnvVar` (padrão: `NEXT_PUBLIC_API_URL`)
- `backendPortEnvVar` (padrão: `PORT`)

## Steps Applied

1. Detectar ausência/incompletude da estrutura Turbo na pasta atual e, quando necessário, executar `npx create-turbo@latest` para gerar o template oficial.
2. Reconciliar no repositório atual apenas arquivos/pastas ausentes vindos do template Turbo (sem sobrescrever arquivos já existentes), incluindo:
   - `.gitignore`
   - `.npmrc`
   - `packages/eslint-config`
   - `packages/typescript-config`
   - demais estruturas padrão faltantes
   - se `.git` já existir no root, rodar scaffold com `--no-git` para evitar recriação de repositório git
3. Antes de criar os apps customizados, remover os projetos padrão do Turbo (`apps/docs`, `apps/frontend` e `packages/ui`) quando detectados como template original.
4. Criar `<frontendAppPath>` com `npx create-next-app@latest <frontendName> --yes --src-dir` e flag do package manager detectado (`--use-bun`, `--use-pnpm`, `--use-yarn` ou `--use-npm`) somente se o app Next.js ainda não existir.
5. Criar `<backendAppPath>` com `nest new <backendName> --skip-git --package-manager <pm>` (ou fallback via `npx @nestjs/cli@latest`) somente se o app NestJS ainda não existir.
6. Garantir `name` de todos os projetos do workspace (`apps/*` e `modules/*`) com namespace:
   - frontend: `<namespace>/<frontendName>`
   - backend: `<namespace>/<backendName>`
7. Instalar apenas dependências faltantes:
   - root: `turbo` (dev dependency)
   - root: `ts-node` (dev dependency)
   - root: `prettier` (dev dependency)
   - backend: `dotenv`, `@nestjs/platform-fastify`, `@fastify/cors`, `@fastify/multipart`, `@nestjs/swagger`, `@scalar/nestjs-api-reference`, `class-transformer`, `class-validator`
8. Atualizar `package.json` root:
   - `name` preenchido (default: `<namespace>/workspace`)
   - `scripts.test = "turbo run test"`
   - `scripts.format = "prettier --write \"**/*.{ts,tsx,md}\""` quando ausente
   - `private = true`
   - `workspaces` contendo `apps/*` e `modules/*`
   - `devDependencies.turbo` presente
   - `devDependencies.ts-node` presente
   - `devDependencies.prettier` presente
9. Garantir `.prettierrc` na raiz com configuração padrão de formatação do workspace.
10. Atualizar `turbo.json`:

- `tasks.test.cache = false`
- `tasks.build.outputs` contendo `dist/**`

11. Atualizar `<frontendAppPath>/next.config.ts|js|mjs` de forma incremental para garantir:

- `images.remotePatterns` contendo regras para `https` e `http` com `hostname: "**"` (liberação de imagens remotas).

12. Atualizar env files via upsert (preservando chaves extras):

- `<frontendAppPath>/.env` e `.env.example` com:
  - `<frontendApiUrlEnvVar>=http://localhost:<backendPort>`
  - `PORT=<frontendPort>`
  - `<backendAppPath>/.env` e `.env.example` com:
  - `<backendPortEnvVar>=<backendPort>`
  - `CORS_ORIGIN=http://localhost:<frontendPort>`
  - `DATABASE_URL`
  - `JWT_SECRET`

13. Atualizar `<backendAppPath>/src/main.ts` com bootstrap Fastify:

- `import "dotenv/config"`
- `FastifyAdapter({ trustProxy: true })`
- `@fastify/cors` com métodos explícitos
- `@fastify/multipart` com limites conservadores
- prefixo global `/api`, excluindo `docs`, `docs-json` e `swagger`
- `ValidationPipe` global
- `setupDocs(app)`

14. Criar `<backendAppPath>/src/core/config/env.config.ts` e `<backendAppPath>/src/core/docs/setup-docs.ts`.

15. Criar Dockerfiles e compose:

- `<frontendAppPath>/Dockerfile`
- `<backendAppPath>/Dockerfile`
- `.dockerignore`
- `docker-compose.yml`

## Notes

- O script é idempotente: ao executar novamente, ele pula etapas já atendidas.
- O script só remove automaticamente diretórios existentes quando detectar que são projetos padrão originais do Turbo (`apps/docs`, `apps/frontend` e `packages/ui`).
- Se um diretório de frontend/backend já existir mas não corresponder ao tipo esperado (Next/Nest), o processo falha para evitar sobrescrita acidental.
- O package manager deve ser detectado pelo `packageManager`, lockfile e runtime disponível; Bun tem preferência quando o projeto estiver em Bun.
