# Skills Standards

## Package manager

Prefer the package manager declared by the target repository. Resolve it in this order:

1. `package.json > packageManager`
2. lockfile: `bun.lock`, `bun.lockb`, `pnpm-lock.yaml`, `yarn.lock`, `package-lock.json`
3. installed runtime preference: Bun, then pnpm, then npm

When Bun is detected, use Bun commands:

```bash
bun install
bun add <pkg>
bun add -d <pkg>
bun run <script>
```

Do not hardcode `npm` in generated instructions unless the target project explicitly uses npm.

## Backend baseline

NestJS backends should default to Fastify:

- `@nestjs/platform-fastify`
- `@fastify/cors`
- `@fastify/multipart`
- `trustProxy: true` for Traefik/Dokploy/proxy deployments
- global prefix `api`
- global `ValidationPipe` with whitelist, forbidNonWhitelisted, transform and implicit conversion
- OpenAPI docs exposed outside `/api`: Scalar at `/docs`, JSON at `/docs-json`, Swagger UI at `/swagger`

## Frontend baseline

Next.js projects should follow App Router conventions:

- Prefer Server Components by default.
- Use Server Actions for form mutations and simple server-side commands.
- Use URL search params for shareable list/filter/search state.
- Use `nuqs` when query string state needs typed parsing, defaults, serialization, or client ergonomics.
- Use Zustand for client-only state that is not URL state, not server cache, and needs to be shared across components.

## Docker baseline

Every generated web/backend app should include app-local Docker support:

- `apps/<web>/Dockerfile`
- `apps/<backend>/Dockerfile`
- `.dockerignore` at the repo root
- optional root `docker-compose.yml` wiring web and backend services

Dockerfiles must honor the detected package manager and use the monorepo root as build context.

## Skill product quality

Every skill that changes files or scaffolds code should include `evals/evals.json` with realistic prompts and objective expected outputs. Add assertions when the outcome can be checked with file existence, file content, command output, or generated JSON.
