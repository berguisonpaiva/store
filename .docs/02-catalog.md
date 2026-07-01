# Tarefa: Implementar o módulo Catalog (padrão do monorepo)

Fonte da verdade = as regras abaixo. Siga a arquitetura em camadas já usada no repo
(domínio puro em `modules/*`, casca NestJS em `apps/backend`, web em `apps/web`,
mobile em `apps/mobile`). Reutilize `@repo/shared` e os guards/decorators já existentes.
Código, pastas e nomes de erro SEMPRE em inglês. Cada pasta com `index.ts` de barrel.

Escopo: categorias e produtos com variações; soft delete (sem exclusão física — só desativação);
CRUD só para ADMIN; expõe a **leitura de variação** consumida por `inventory` e `sales`.

## Modelo (leia antes — é o núcleo do catalog)

- `Product` é o **aggregate root** e **possui `Variation`s**. Invariante: pelo menos 1 variação.
- **Preço, SKU, barcode, minStock e atributos moram na `Variation`, nunca no `Product`.**
- `Product`: `name` (ProductName), `description?`, `categoryId?` (Id, nullable), `active`, `variations[]`.
- `Variation`: `sku` (Sku), `barcode?` (Barcode), `attributes` (VariationAttributes/AttributeMap),
  `price` (Price — inteiro em centavos, > 0, RN08), `minStock` (MinStock), `active`.

## Ordem de execução (respeite as dependências)

### 1. Domínio — `modules/catalog` (skills: module-value-object, module-entity, module-dto, module-repository, module-query-cqrs, module-domain-service, module-use-case)

Agregado `category` em `modules/catalog/src/category/`:

- **model/**
  - `category-name.vo.ts` — `CategoryName` VO.
  - `category.entity.ts` — `Category` (Entity + Result): `name` (CategoryName), `active`. Sem HTTP/DB/framework.
- **errors/** `category-error.ts` — `CategoryNotFound`, `CategoryAlreadyExists`, `CategoryInactive`.
- **dto/** `category.dto.ts` — saída `{ id, name, status }`; `ListCategoriesFilterDTO` `{ status? }`.
- **provider/**
  - `category.repository.ts` — `CategoriesRepository` (compõe Create/Update/FindById do shared, SEM delete): `findByName`, `list`.
  - `category-query.ts` — `CategoriesQuery` (CQRS): `list(filter)` → projeção paginada.
- **service/** `unique-category-name.specification.ts` (nome único), `role-authorization.policy.ts` (só ADMIN, RN07).
- **use-case/** (cada um retorna `Result`):
  - `create-category.use-case.ts` — ADMIN. in `{name}` → `{categoryId}`. Erro: `CategoryAlreadyExists`.
  - `update-category.use-case.ts` — ADMIN. in `{categoryId,name}`. Erros: `CategoryNotFound`, `CategoryAlreadyExists`.
  - `activate-category.use-case.ts` — ADMIN. Erro: `CategoryNotFound`.
  - `deactivate-category.use-case.ts` — ADMIN. Erro: `CategoryNotFound`.
  - `list-categories.use-case.ts` — filtros opcionais `status`.

Agregado `product` em `modules/catalog/src/product/`:

- **model/**
  - `product-name.vo.ts` — `ProductName`.
  - `sku.vo.ts` — `Sku`. `barcode.vo.ts` — `Barcode`. `price.vo.ts` — `Price` (inteiro em centavos, > 0, RN08).
    `min-stock.vo.ts` — `MinStock` (>= 0). `variation-attributes.vo.ts` — `VariationAttributes` (AttributeMap).
  - `variation.entity.ts` — `Variation` (Entity + Result), entidade **dona do `Product`** (não é aggregate root):
    `sku`, `barcode?`, `attributes`, `price`, `minStock`, `active`.
  - `product.entity.ts` — `Product` (aggregate root): `name`, `description?`, `categoryId?`, `active`, `variations[]`.
    Métodos: `editProfile`, `addVariation`, `updateVariation`, `activate/deactivate`,
    `activateVariation/deactivateVariation`. Invariante "≥ 1 variação". Sem HTTP/DB/framework.
- **errors/** `product-error.ts` — `PRODUCT_NOT_FOUND`, `PRODUCT_MUST_HAVE_VARIATION`, `VARIATION_NOT_FOUND`,
  `SKU_ALREADY_IN_USE`, `BARCODE_ALREADY_IN_USE`, `INVALID_PRICE` (RN08).
- **dto/** `product.dto.ts` — `ProductListItemDTO` `{ id, name, category, variations[], status }`;
  `ListProductsFilterDTO` `{ name?, categoryId?, status? }`.
- **provider/**
  - `product.repository.ts` — `ProductsRepository` (compõe Create/Update/FindById, SEM delete):
    `findBySku(sku)`, `findByBarcode(barcode)` (alimentam as specifications de unicidade e o PDV).
  - `product-query.ts` — `ProductsQuery` (CQRS): `list(filter)` → projeção paginada.
- **service/** `unique-sku.specification.ts`, `unique-barcode.specification.ts`,
  `active-category.specification.ts` (produto só vincula a categoria existente e ativa — RN02/RN03, usa `CategoriesRepository`).
- **use-case/** (cada um retorna `Result`):
  - `create-product.use-case.ts` — ADMIN. in `{name,description?,categoryId?,variations:[{sku,barcode?,attributes?,price,minStock?}]}` → `{productId}`.
    valida categoria ativa + unicidade sku/barcode. Erros: `CategoryNotFound`, `CategoryInactive`, `SkuAlreadyInUse`, `BarcodeAlreadyInUse`, `InvalidPrice`, `ProductMustHaveVariation`.
  - `update-product.use-case.ts` — ADMIN. in `{productId,name?,description?,categoryId?}` (perfil). Erros: `ProductNotFound`, `CategoryNotFound`, `CategoryInactive`.
  - `add-variation.use-case.ts` — ADMIN. in `{productId, sku, barcode?, attributes?, price, minStock?}`. Erros: `ProductNotFound`, `SkuAlreadyInUse`, `BarcodeAlreadyInUse`, `InvalidPrice`.
  - `update-variation.use-case.ts` — ADMIN. in `{productId, variationId, ...campos}`. Erros: `ProductNotFound`, `VariationNotFound`, `SkuAlreadyInUse`, `BarcodeAlreadyInUse`, `InvalidPrice`.
  - `activate-product.use-case.ts` / `deactivate-product.use-case.ts` — ADMIN. Soft delete (RN06). Erro: `ProductNotFound`.
  - `activate-variation.use-case.ts` / `deactivate-variation.use-case.ts` — ADMIN. Erros: `ProductNotFound`, `VariationNotFound`.
  - `find-product-by-id.use-case.ts` — retorna `{id,name,category,variations[],status}`. Erro: `ProductNotFound`.
  - `find-variation-by-sku.use-case.ts` / `find-variation-by-barcode.use-case.ts` — lookup do PDV.
  - `list-products.use-case.ts` — filtros opcionais `name`, `categoryId`, `status` (via `ProductsQuery`).

Cobrir com testes (jest) usando mocks in-memory no padrão de `modules/*/test/mock/*`.
Exportar tudo pelos `index.ts` até `modules/catalog/src/index.ts` — inclusive a entidade `Variation`,
que é reutilizada pelos readers de `inventory`/`sales`.
Este é o módulo **base** — não consome gateways de outros módulos.

### 2. Backend — `apps/backend/src/modules/{categories,products}` (skills: backend-controller, backend-prisma-data, config-shared-backend)

- **Adapters dos ports** em `adapters/` (repository + query, toDomain/fromDomain):
  - `category.prisma.repository.ts`, `category.prisma.query.ts`.
  - `product.prisma.repository.ts`, `product.prisma.query.ts`.
- **Prisma** em `prisma/models/*.model.prisma`, migração e seed opcional:
  - `Category` (id, name único, active, timestamps).
  - `Product` (id, name, description nullable, categoryId FK nullable, active, timestamps) — **sem preço/sku**.
  - `Variation` (id, productId FK, sku único, barcode nullable único, attributes Json, priceCents Int, minStock Int, active, timestamps).
- **Controllers + http DTOs** (`dto/*.http.dto.ts`, class-validator, Swagger `@ApiTags/@ApiOperation/@ApiResponse/@ApiBearerAuth`):
  - `categories.controller.ts`: CRUD com `@Roles('ADMIN')` (RN07): list, create, update, activate/deactivate.
  - `products.controller.ts`: CRUD do produto com `@Roles('ADMIN')`: list, get, create, update, activate/deactivate.
  - `variations.controller.ts`: `@Roles('ADMIN')`: add, update, activate/deactivate variação.
- **Leitura cross-módulo (NÃO é gateway exposto pelo catalog):** os módulos consumidores declaram o port —
  `CatalogVariationReader` em `@repo/inventory` e o equivalente em `sales`, com `findById(variationId) → Variation`.
  O backend implementa os adapters Prisma (`catalog-variation.prisma.reader.ts`, `variacao.prisma.reader.ts`)
  reusando `Variation.tryCreate` de `@repo/catalog`. Respeita a regra de dependência: o consumidor define o contrato.
- Mapear erros de domínio → HTTP em `shared/errors/domain-error.mapper.ts`
  (CategoryAlreadyExists/SkuAlreadyInUse/BarcodeAlreadyInUse → 409, \*NotFound → 404,
  InvalidPrice/CategoryInactive/ProductMustHaveVariation → 400/422).
- Registrar em `categories.module.ts` / `products.module.ts` o binding port→adapter.

### 3. Web — `apps/web` (skills: config-frontend-layout, frontend-form-schema)

- Adicionar item **Catálogo** na sidebar do layout admin existente; **só aparece para ADMIN** (RN07) — ocultação é reforço.
- Páginas fazem checkup de permissão no load; se não for ADMIN, redireciona para a principal.
- Categorias: listar, criar, editar, ativar/desativar (form React Hook Form + Zod, `*.schema.ts`).
- Produtos: listar (busca + filtro por nome/categoria/status), criar, editar, ativar/desativar;
  gerência de **variações** por produto (sku/barcode/preço/minStock/atributos). Campo de preço em centavos
  (`react-number-format`). Seleção de categoria com combobox.

### 4. Mobile — `apps/mobile` (Flutter; skills flutter-\*)

- Consulta de produtos: listagem + busca + filtro por categoria (leitura), base para o PDV do módulo `sales`.
- Lookup de variação por SKU/barcode (leitura).
- Sem cadastro/edição de produto, variação ou categoria neste MVP.

## Invariantes a garantir (checklist)

RN01 produto vinculado a categoria • RN02 categoria inativa não recebe produto • RN03 sem categoria inexistente/inativa
• RN04 campos de produto/variação válidos • RN05 produto/variação inativo não vende (checado em sales)
• RN06 sem exclusão física — soft delete • RN07 só ADMIN gerencia • RN08 preço > 0 (centavos) • ≥ 1 variação por produto.

> **IMPORTANTE — divida em subagents independentes, um por camada.**

### Estado atual (LEIA ANTES)

O módulo NÃO é greenfield. Já existem `modules/catalog/src/{category,product}` (com `Variation`,
VOs `*.vo.ts`, CQRS query e specifications), os controllers/adapters em
`apps/backend/src/modules/{categories,products}`, os readers em `inventory`/`sales`, e os
guards/decorators compartilhados. REGRA: **alinhar e editar o que existe**, nunca recriar em paralelo.
Antes de escrever, cada subagent lê os arquivos da sua camada e faz diff mínimo contra estas RN.
Divergência a reconciliar: no código atual `categoryId` é **opcional/nullable** — se RN01 exige
categoria obrigatória, confirmar antes de tornar o campo not-null (impacta entidade, DTO, Prisma e migração).

### Por que separar

- Contexto enxuto: cada agente carrega só a skill e os arquivos da sua camada.
- Paralelismo real: web e mobile são independentes.
- Fronteira de revisão clara: um diff coeso por camada, fácil de reverter.
- Respeita a dependência de build: domínio compila antes do backend consumir.

### Portão de cada subagent

Invoca a skill da camada → edita → `turbo build --filter=<pkg>` + `bun test` verdes → entrega diff.

### Ordem

1. **Subagent 1 — Domínio** (seção 1). Bloqueante: entidades (Product+Variation), ports, contratos, CQRS e erros. Testes jest verdes.
2. **Subagent 2 — Backend** (seção 2), depende de (1). Sub-ordem: schema Prisma (Category/Product/Variation) + migração → adapters repository/query → readers cross-módulo → controllers/DTOs. Bind port→adapter nos módulos.
3. **Subagent 3 — Web** e **Subagent 4 — Mobile** (seções 3 e 4): em paralelo assim que a API estiver contratada.
4. **Subagent 5 — Revisão**: valida CRUD de categoria e de produto+variações ponta a ponta, soft delete com vínculo (RN06), preço > 0 e invariante "≥ 1 variação" (RN08), autorização ADMIN no backend (RN07), e a leitura de `Variation` consumida por `inventory`/`sales`; roda build + testes + lint no monorepo.
