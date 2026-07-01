---
name: config-shared-backend
description: Reconstrói deterministicamente a camada compartilhada do backend NestJS em `apps/backend/src/shared/` com tratamento centralizado de erros, autenticação por JWT (passport), guard, decorators e tipos em inglês, compatível com a hierarquia de erros de `packages/shared`. Assume o backend moderno em Fastify com Scalar/Swagger gerado por `config-project`, usa o package manager detectado (Bun/pnpm/npm) e também adiciona `AuthenticatedUser` ao pacote compartilhado.
---

# Backend Nest Config

## Objetivo

Reconstruir deterministicamente a pasta `apps/backend/src/shared/` — a camada compartilhada do backend NestJS — usando os assets canônicos desta skill.

Essa skill garante que o projeto tenha:

- Filtro global de exceção (`ApiExceptionFilter`) compatível com `DomainError`, `ValidationError`, `ValidationErrors` e `HttpException`
- Guard JWT (`JwtGuard`) com suporte a rotas públicas via decorator `@Public()`
- Decorator `@CurrentUser()` para extrair o usuário autenticado do request
- Estratégia Passport JWT (`JwtStrategy`) que valida Bearer tokens e popula `request.user`
- Tipos: `JwtPayload`, `AuthenticatedRequest`, `ApiErrorResponse`
- Interface `AuthenticatedUser` em `packages/shared/src/dto/`
- `SharedModule` registrado globalmente no NestJS
- Compatibilidade com bootstrap Fastify/documentado: `FastifyAdapter`, `@fastify/cors`, `@fastify/multipart`, prefixo `/api`, Scalar em `/docs`, JSON em `/docs-json` e Swagger em `/swagger`

Todos os identificadores, nomes de arquivo e nomes de classe seguem **inglês**.

## Uso

Executar a partir da raiz do monorepo:

```bash
node .claude/skills/config-shared-backend/scripts/apply.js
```

Use `--force` para sobrescrever mesmo arquivos sem alteração:

```bash
node .claude/skills/config-shared-backend/scripts/apply.js --force
```

O script:

1. Lê o namespace do `skills.config.json` para resolver o nome do pacote shared
2. Instala dependências ausentes no workspace do backend com o package manager detectado (`@nestjs/jwt`, `@nestjs/passport`, `@nestjs/config`, `passport`, `passport-jwt`, `@types/passport-jwt`)
3. Remove arquivos legados com nomes em português (se existirem)
4. Copia `packages/shared/src/dto/authenticated-user.dto.ts`
5. Garante que `packages/shared/src/dto/index.ts` exporta `authenticated-user.dto`
6. Garante que `packages/shared/src/index.ts` exporta `./dto`
7. Copia `packages/shared/src/base/errors.ts` (`DomainError`, `ValidationError`, `ValidationErrors`)
8. Garante que `packages/shared/src/base/index.ts` exporta `./errors`
9. Executa `<package-manager> run build` no pacote shared para gerar os tipos compilados
10. Copia todos os arquivos de `apps/backend/src/shared/`
11. Formata todos os arquivos do projeto com Prettier executando `<package-manager> run format` na raiz do monorepo quando o fluxo chamador fizer formatação.

## Bootstrap HTTP esperado

Esta skill não deve rebaixar o backend para Express. O `main.ts` esperado no projeto moderno é:

- `NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter({ trustProxy: true }))`
- `@fastify/cors` com origem vinda de `loadEnv()`, credentials e métodos explícitos
- `@fastify/multipart` com limites de campos e arquivos
- `app.setGlobalPrefix('api')` excluindo `docs`, `docs-json` e `swagger`
- `setupDocs(app)` para Scalar/Swagger/OpenAPI JSON
- `ValidationPipe` global com whitelist/transform

Ao adicionar o `ApiExceptionFilter`, preserve esse bootstrap Fastify.

## Estrutura criada

```text
packages/shared/src/dto/
  authenticated-user.dto.ts    ← interface AuthenticatedUser { id, name, email }

packages/shared/src/base/
  errors.ts                    ← DomainError (abstract), ValidationError (abstract, 422), ValidationErrors

apps/backend/src/shared/
  auth/
    jwt.strategy.ts            ← JwtStrategy extends PassportStrategy(Strategy)
    jwt.guard.ts               ← JwtGuard extends AuthGuard('jwt'), respects @Public()
    auth-user.mapper.ts        ← mapPayloadToAuthenticatedUser(payload: JwtPayload)
    index.ts
  decorators/
    public.decorator.ts        ← @Public() marks open routes, PUBLIC_ROUTE token
    current-user.decorator.ts  ← @CurrentUser() and @CurrentUser('field')
    index.ts
  errors/
    api-exception.filter.ts    ← ApiExceptionFilter handles DomainError, ValidationError, ValidationErrors, HttpException
    api-error-response.type.ts ← ApiErrorResponse { statusCode, error, message, details?, path?, timestamp }
    index.ts
  types/
    jwt-payload.type.ts        ← JwtPayload { sub, name, email, iat?, exp? }
    authenticated-request.type.ts ← AuthenticatedRequest extends Request with user: AuthenticatedUser
    index.ts
  shared.module.ts             ← SharedModule @Global() with JwtStrategy, JwtGuard, JwtModule
```

## Integração manual pós-aplicação

O script **não altera** `app.module.ts` nem `main.ts`. Após aplicar, verificar e ajustar manualmente:

**`apps/backend/src/app.module.ts`** — importar `SharedModule`:

```ts
import { SharedModule } from './shared/shared.module'

@Module({
  imports: [SharedModule, ...],
})
export class AppModule {}
```

**`apps/backend/src/main.ts`** — registrar o filtro global preservando o bootstrap Fastify:

```ts
import { ApiExceptionFilter } from './shared/errors/api-exception.filter';

app.useGlobalFilters(new ApiExceptionFilter());
```

## Compatibilidade com packages/shared

O filtro `ApiExceptionFilter` importa diretamente do pacote shared (resolvido via `skills.config.json`):

- `DomainError` — retorna `statusCode` da própria exceção + `message: [code]`
- `ValidationError` — retorna 422 + `message: [code]`
- `ValidationErrors` — retorna 422 + `message: string[]` extraído de `toJSON().errors`
- `HttpException` — preserva status; `message` sempre `string[]`
- Erros inesperados — 500 sem vazar stack trace; `message` sempre `string[]`

`message` é **sempre** `string[]`, mesmo quando há apenas um erro — facilita o tratamento uniforme no frontend.

Não recria hierarquia de erros. Consome exclusivamente a de `packages/shared`.

## Guardrails

- Nunca importar de `modules/` dentro de `apps/backend/src/shared/`.
- Nunca alterar `AuthenticatedUser` para campos de um módulo específico.
- Nunca rebaixar `main.ts` para Express nem remover Fastify/docs.
- Nunca duplicar classes de erro que já existem em `packages/shared`.
- Usar o package manager do projeto; não assumir `npm`.

## Evals da skill

Manter `evals/evals.json` com pelo menos:

- aplicação em projeto Bun;
- preservação de `main.ts` Fastify com docs;
- adição idempotente de `SharedModule`;
- adição idempotente de `ApiExceptionFilter`.

## Referências internas

- `assets/` — arquivos canônicos em inglês prontos para cópia
- `scripts/apply.js` — script determinístico de aplicação
- `references/mandatory-readings.md` — checklist de leitura para ajustes manuais
