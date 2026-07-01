> Backend-only. Regra de negócio fica no domínio (`@repo/catalog`); este change só adapta infraestrutura e apresentação. **Sempre usar a skill indicada.** Constraints de banco entram só como rede de segurança redundante. Sem deleção.

## 1. Pré-requisitos

- [x] 1.1 Confirmar `catalog-domain` aplicado e `@repo/catalog` compilando
- [x] 1.2 Adicionar `@repo/catalog` às deps de `apps/backend/package.json`

## 2. Schema Prisma — skill `backend-prisma-data`

- [x] 2.1 `catalog.model.prisma`: `Category` (name único como rede de segurança, active, timestamps), `Product` (name, description?, categoryId? FK, active, timestamps), `Variation` (productId FK, sku único, barcode único-quando-presente, attributes JSON, priceCents int, minStock int, active, timestamps)
- [x] 2.2 Gerar migration + `prisma:generate`

## 3. Adapters de produto — skill `backend-prisma-data`

- [x] 3.1 `ProductPrismaRepository` (`create/update/findById/findBySku/findByBarcode`) com sync das variações em `runInTransaction`; sem hard-delete
- [x] 3.2 `toDomain`/`fromDomain` reconstruindo `Product` + `Variation[]`
- [x] 3.3 `ProductPrismaQuery` (listagem paginada + busca por nome + filtros categoria/status), sem vazar entidade
- [x] 3.4 Mapear `P2002` (sku/barcode) de volta para `SKU_ALREADY_IN_USE`/`BARCODE_ALREADY_IN_USE`

## 4. Adapters de categoria — skill `backend-prisma-data`

- [x] 4.1 `CategoryPrismaRepository` (`create/update/findById/findByName`) + `CategoryPrismaQuery` (listagem)
- [x] 4.2 Mapear `P2002` de nome para `CATEGORY_NAME_ALREADY_IN_USE`

## 5. Mapeamento de erros — skill `backend-controller`

- [x] 5.1 Estender `domain-error.mapper`: `PRODUCT_NOT_FOUND`/`VARIATION_NOT_FOUND`/`CATEGORY_NOT_FOUND`→404, `SKU_ALREADY_IN_USE`/`BARCODE_ALREADY_IN_USE`/`CATEGORY_NAME_ALREADY_IN_USE`→409, `PRODUCT_MUST_HAVE_VARIATION`/`CATEGORY_NOT_FOUND_FOR_PRODUCT`→400

## 6. ProductsModule — skills `config-new-module` / `backend-controller`

- [x] 6.1 Scaffold `apps/backend/src/modules/products/` (module, controllers, wiring, dtos)
- [x] 6.2 DTOs HTTP + `class-validator` (produto, variação aninhada com preço>0 e minStock≥0, query de listagem)
- [x] 6.3 `ProductsController`: `POST /api/products`, `PATCH /:id`, `PATCH /:id/activate|deactivate`, `GET /` (paginado/filtros), `GET /:id`
- [x] 6.4 `VariationsController`: `POST /api/products/:productId/variations`, `PATCH /api/products/:productId/variations/:variationId`, `PATCH /api/products/:productId/variations/:variationId/activate|deactivate`, `GET /api/variations/by-sku/:sku`, `GET /api/variations/by-barcode/:barcode` (rotas de gestão aninhadas sob o produto dono; PDV permanece plano)
- [x] 6.5 Guards: `@UseGuards(JwtGuard, RolesGuard)` + `@Papeis(MASTER, ADMIN)` na gestão; PDV (`by-sku`/`by-barcode`) com `@Papeis(MASTER, ADMIN, OPERADOR)`
- [x] 6.6 Wiring DI dos use cases de `@repo/catalog` com os adapters; Swagger/OpenAPI

## 7. CategoriesModule — skills `config-new-module` / `backend-controller`

- [x] 7.1 Scaffold `apps/backend/src/modules/categories/` (module, controller, wiring, dtos)
- [x] 7.2 `CategoriesController`: `POST /api/categories`, `PATCH /:id`, `PATCH /:id/activate|deactivate`, `GET /` — sem delete
- [x] 7.3 Wiring DI + Swagger/OpenAPI; `@Papeis(MASTER, ADMIN)`

## 8. Registro

- [x] 8.1 Registrar `ProductsModule` e `CategoriesModule` em `app.module.ts`

## 9. Verificação — skill `verify`

- [x] 9.1 `prisma:migrate:dev` + `prisma:generate` locais sem erro — migrations `0001_init` + `0002_catalog` aplicadas (Postgres local), `migrate status` = up to date, `prisma generate` ok
- [x] 9.2 Build do backend verde
- [x] 9.3 Via API: criada categoria/produto/variação, listagem com filtro de nome + variationCount, ativar/desativar (produto e variação), PDV by-sku/by-barcode; 401 sem token, 409 SKU/barcode/categoria duplicados, 400 sem variação/preço inválido, 403 OPERADOR na gestão e 200 OPERADOR no PDV
- [x] 9.4 Confirmar controllers/adapters sem regra de domínio e ausência de hard-delete
