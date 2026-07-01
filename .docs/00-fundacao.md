# 00 · Fundação — Atos Store Backend

> Convenções de arquitetura comuns a todos os módulos. É a fonte única; os docs de módulo (`04`+) só repetem um resumo e apontam pra cá. Reflete os skills `module-*` / `backend-*` / `config-*` e o código real em `modules/auth` e `modules/catalog`.

## Monorepo

- TurboRepo + workspaces. Package manager **Bun** (`bun.lock`, `packageManager` no `package.json`).
- `modules/<m>` — domínio puro (regras de negócio), publicado como package `@repo/<m>`. Sem Nest, Fastify, Prisma ou qualquer SDK.
- `apps/backend` — NestJS sobre **Fastify** (`@nestjs/platform-fastify`). Liga o domínio ao mundo: HTTP, persistência, auth.
- `apps/web` — Next.js (App Router). `apps/mobile` — Flutter.
- `packages/shared` (`@repo/shared`) — `Result`, `Entity`, `ValueObject`, `UseCase`, ports de repositório genéricos (`CreateRepository`, `UpdateRepository`, `FindByIdRepository`, `CrudRepository`), `AuthenticatedUser`.

## Camadas reais (não "domain/application/presentation/infra")

O domínio de cada módulo é dividido **por agregado**, e cada agregado por pasta:

```
modules/<m>/src/<agregado>/
├── model/        # *.entity.ts  (Entity + Result)  ·  *.vo.ts (ValueObject)
├── provider/     # contratos: *.repository.ts (escrita) · *-query.ts (CQRS leitura) · ports externos
├── use-case/     # *.use-case.ts  (UseCase<In, Out> com .execute)
├── dto/          # *.dto.ts  (InputDTO / OutputDTO / filtros + mappers to*DTO)
├── errors/       # *-error.ts  (objeto const de códigos)
├── service/      # *.specification.ts / *.service.ts  (domain services, regras entre entidades)
└── index.ts      # barrel
```

A "presentation" e a "infra" ficam no **backend** (`apps/backend/src/modules/<m>/`): `*.controller.ts`, `dto/*.http.dto.ts`, `*.module.ts`, `adapters/*.prisma.repository.ts` + `*.prisma.query.ts`.

## Use cases (não command/handler)

- Escrita e leitura são **use cases** que implementam `UseCase<In, Out>` com um método `execute(input): Promise<Result<Out>>`.
- Escrita: `create-*`, `update-*`, `registrar-*`, `finalizar-*`, etc.
- Leitura (CQRS): use cases `find-*` / `list-*` apoiados num contrato `*-query.ts`, **separado** do `*.repository.ts` de escrita.
- O use case orquestra entidades, repositórios, queries e ports; não tem regra pura de negócio (isso vive na entidade/VO/service).

## Tratamento de erro — `Result`, nunca `throw`

- Todo retorno falível usa `Result<T>` de `@repo/shared`: `Result.ok(value)` / `Result.fail(CODE)`.
- Encadeamento: `if (x.isFailure) return x.withFail`; valor em `x.instance`.
- Códigos de erro = objeto const por contexto em `errors/<contexto>-error.ts`, em SCREAMING_SNAKE:

```ts
export const CategoryError = {
  CATEGORY_NOT_FOUND: 'CATEGORY_NOT_FOUND',
  CATEGORY_NAME_ALREADY_IN_USE: 'CATEGORY_NAME_ALREADY_IN_USE',
} as const
export type CategoryErrorCode = (typeof CategoryError)[keyof typeof CategoryError]
```

- O backend mapeia o código para HTTP (`BadRequestException`, `NotFoundException`, etc.) na camada de controller.

## Contratos e dependências (`provider/`)

- **Repositório** (`*.repository.ts`): contrato de escrita do agregado, composto dos ports genéricos do `@repo/shared`. Só inclui o que o módulo precisa (ex.: categorias desativam, não deletam → sem `CrudRepository`).
- **Query** (`*-query.ts`): contrato de leitura/projeção CQRS, devolve DTOs.
- **Dependência externa ou cross-módulo** = interface (port) na pasta `provider/` do módulo **consumidor**, descrevendo só o que ele consome. O módulo dono **não** "expõe um port" — expõe use cases; quem depende declara o contrato e o **backend** o implementa num `adapter`, ligando ao dono.
  - Ex.: `vendas` declara `EstoqueGateway` / `PagamentoGateway` / `CaixaGateway` no seu `provider/`; o backend implementa cada um chamando os use cases de `estoque` / `pagamentos` / `caixa`.
  - Ex. de port de infra: `auth` declara `TokenService`, `HashGenerator`, `HashComparer` no seu `provider/`, implementados em infra (JWT/bcrypt).

## Backend (Fastify)

- Global prefix `api`; `ValidationPipe` global (`whitelist`, `forbidNonWhitelisted`, `transform`).
- OpenAPI fora de `/api`: Scalar em `/docs`, JSON em `/docs-json`, Swagger UI em `/swagger`.
- Controller: aplica guards/permissões, faz bind de `@Body/@Param/@Query` (DTOs `*.http.dto.ts`), chama use cases e traduz `Result.fail(CODE)` → exceção HTTP.
- Persistência: Prisma com schema modular (`prisma/models/*.model.prisma`); adapters `*.prisma.repository.ts` / `*.prisma.query.ts` fazem `toDomain` / `fromDomain`.

## Naming — kebab-case dot-type

| Sufixo | Papel |
|---|---|
| `*.entity.ts` | Entidade / aggregate root |
| `*.vo.ts` | Value object |
| `*.repository.ts` | Contrato de escrita (provider) |
| `*-query.ts` | Contrato de leitura CQRS (provider) |
| `*.use-case.ts` | Use case (`UseCase<In, Out>`) |
| `*.dto.ts` | DTO de domínio + mappers |
| `*-error.ts` | Objeto const de códigos de erro |
| `*.specification.ts` / `*.service.ts` | Domain service / specification |
| `*.http.dto.ts` | DTO HTTP (backend) |
| `*.prisma.repository.ts` / `*.prisma.query.ts` | Adapter Prisma (backend) |

## Testes

- Cada módulo tem `test/` espelhando `src/`, com `test/mock/` (`in-memory-*.repository.ts`, builders, fakes).
- Domínio e use cases testados em isolamento com repositórios in-memory — sem banco. Padrão Jest.
