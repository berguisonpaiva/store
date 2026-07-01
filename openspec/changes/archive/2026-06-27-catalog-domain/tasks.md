> Princípio: **todas as verificações na regra de negócio** (VO → entidade → policy/specification → use case). Nada delegado ao banco. **Sempre usar a skill indicada em cada grupo.** Sem deleção — apenas ativar/desativar.

## 1. Scaffold do módulo — skill `module-aggregate`

- [x] 1.1 Criar package `modules/catalog` (`@repo/catalog`) espelhando `@repo/auth` (package.json, tsconfig, jest.config, src/index.ts)
- [x] 1.2 `node .claude/skills/module-aggregate/scripts/create-aggregate.js --module catalog --aggregate product --mode crud`
- [x] 1.3 `node .claude/skills/module-aggregate/scripts/create-aggregate.js --module catalog --aggregate category --mode crud`
- [x] 1.4 Registrar no workspace e garantir build + testes do scaffold

## 2. Value objects — skill `module-value-object`

- [x] 2.1 `Price` (> 0; cents inteiros), `Sku` (normalizado, não vazio), `Barcode` (não vazio quando presente)
- [x] 2.2 `MinStock` (inteiro ≥ 0, default 0), `VariationAttributes` (key/value validado)
- [x] 2.3 `ProductName` (≥2) e `CategoryName` (não vazio); reusar `Id`/`NonNegative`/`Text` do shared quando couber

## 3. Entidades — skill `module-entity`

- [x] 3.1 `Variation` (entity): sku, barcode?, attributes, price, minStock, active
- [x] 3.2 `Product` (aggregate root): name, description?, categoryId?, active, `variations` (≥1); métodos `activate/deactivate`, `addVariation`, `updateVariation`, `activateVariation/deactivateVariation`, `editProfile`
- [x] 3.3 Invariante ≥1 variação na entidade (`tryCreate` + remoção bloqueada) → `PRODUCT_MUST_HAVE_VARIATION`
- [x] 3.4 `Category` (aggregate): name (único via policy), active; `rename/activate/deactivate`
- [x] 3.5 Sem deleção; preço/minStock validados nos VOs

## 4. Specifications/policies — skill `module-domain-service`

- [x] 4.1 `UniqueSkuSpecification` (a partir de `findBySku`) → `SKU_ALREADY_IN_USE`
- [x] 4.2 `UniqueBarcodeSpecification` (só quando barcode presente) → `BARCODE_ALREADY_IN_USE`
- [x] 4.3 `UniqueCategoryNameSpecification` (a partir de `findByName`) → `CATEGORY_NAME_ALREADY_IN_USE`
- [x] 4.4 Serviços puros + testes de borda (testes na seção 9)

## 5. Ports — skill `module-repository`

- [x] 5.1 `ProductsRepository` (`create/update/findById/findBySku/findByBarcode`) — sem `delete`
- [x] 5.2 `ProductsQuery` (listagem paginada + busca por nome + filtros categoria/status)
- [x] 5.3 `CategoriesRepository` (`create/update/findById/findByName`) e `CategoriesQuery` (listagem)
- [x] 5.4 Sem implementação de infra no módulo

## 6. DTOs — skill `module-dto`

- [x] 6.1 Inputs: create/update product, add/update variation, set-active (product/variation), create/update/set-active category
- [x] 6.2 Output/query DTOs (produto com variações; variação para PDV; categoria) reusando paginação; sem vazar entidade

## 7. Commands (use cases) — skill `module-use-case`

- [x] 7.1 `create-product` (categoria existe? → variação inicial → unicidade SKU/barcode → persistir) (RF-CAT-01,02,03,04,05)
- [x] 7.2 `update-product` (existir → categoria existe → editar) (RF-CAT-01)
- [x] 7.3 `add-variation` / `update-variation` (unicidade SKU/barcode, preço>0) (RF-CAT-03,04,05)
- [x] 7.4 `activate-product`/`deactivate-product` e `activate-variation`/`deactivate-variation` (RF-CAT-06)
- [x] 7.5 `create-category`/`update-category`/`activate-category`/`deactivate-category` (RF-CAT-09)
- [x] 7.6 Use cases só orquestram; invariantes em VO/entidade/policy; falhas com `Result.fail(<CODE>)`

## 8. Queries (use cases) — skill `module-query-cqrs`

- [x] 8.1 `list-products` (paginado, busca por nome, filtro categoria/status) (RF-CAT-08)
- [x] 8.2 `find-product-by-id`
- [x] 8.3 `find-variation-by-sku` e `find-variation-by-barcode` (PDV) (RF-CAT-07)
- [x] 8.4 `list-categories`

## 9. Testes — skills `module-entity` / `module-use-case` / `module-domain-service`

- [x] 9.1 Fakes in-memory de `ProductsRepository`/`ProductsQuery`/`CategoriesRepository`/`CategoriesQuery`
- [x] 9.2 Entidade: criação válida/ inválida, ≥1 variação, preço>0, transições de estado
- [x] 9.3 Specifications: SKU/barcode/category-name únicos
- [x] 9.4 Commands e queries cobrindo invariantes, PDV (sku/barcode) e códigos de erro

## 10. Wire-up e verificação

- [x] 10.1 Exportar contratos públicos em `modules/catalog/src/index.ts`
- [x] 10.2 Confirmar ausência de NestJS/HTTP/DB/UI e que nenhuma regra depende do banco; sem use case de delete
- [x] 10.3 Build do workspace + suíte de testes do módulo verdes
