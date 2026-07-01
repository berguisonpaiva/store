## Context

TurboRepo monorepo with a shared domain kernel in `packages/shared` (`Entity`, `Result`, `UseCase`, `CrudRepository`, pagination DTOs, value objects). Business modules live under `modules/<module>` and are scaffolded by `module-aggregate`. The `auth` module (single package, multiple aggregates) set the precedent. This change adds the `catalog` domain module — **business rules only**, no infrastructure.

## Goals / Non-Goals

**Goals:**

- Create `modules/catalog` (`@repo/catalog`) with aggregates `product` (root owning `variation` entities) and `category`, English naming, per `module-aggregate`.
- Express RF-CAT-01..09 as use cases returning `Result<T>`, ports as interfaces, errors as stable codes.
- **Enforce every invariant in the domain** (VO → entity → policy/specification → use case); never rely on the DB.
- Reuse shared primitives; add module VOs only where shared lacks them.
- In-memory fakes + unit tests for every use case and invariant.

**Non-Goals:**

- No Prisma/persistence, HTTP, guards, UI.
- No inventory module (only expose `minStock` for it to read later).
- No deletion — deactivate only.

## Decisions

### 1. Single `catalog` module, two aggregates (`product` + `category`)

Mirrors the `auth` decision: one self-contained package with `src/product/` and `src/category/`. Scaffold with `module-aggregate` (`--module catalog --aggregate product`, then `--aggregate category`).

### 2. Variation is an entity inside the Product aggregate (not its own aggregate)

A product owns its variations (RF-CAT-02: ≥1 variation; consistency boundary). `Variation` is an entity nested in `Product`. SKU/barcode uniqueness is **global**, so `ProductsRepository` exposes `findBySku`/`findByBarcode` that search across all products' variations; the uniqueness rule is a domain specification fed by those reads.

- Alternative considered: Variation as a separate aggregate. Rejected — the ≥1-variation invariant and price/attribute consistency belong to the product boundary.

### 3. Cross-entity invariants live in domain services/policies

- **Unique SKU** → `UniqueSkuSpecification` (uses `findBySku`) → `SkuAlreadyInUse`.
- **Unique barcode (when present)** → `UniqueBarcodeSpecification` (uses `findByBarcode`) → `BarcodeAlreadyInUse`.
- **≥1 variation** → enforced in the `Product` entity (`tryCreate`/`removeVariation` guard) → `ProductMustHaveVariation`.
- **Unique category name** → `UniqueCategoryNameSpecification` (uses `findByName`) → `CategoryNameAlreadyInUse`.
- **Category exists** → checked in product use cases via `CategoriesRepository.findById` → `CategoryNotFoundForProduct`.

### 4. Module value objects

Add `Price` (decimal stored in the smallest unit or as a validated positive number, `> 0`), `Sku` (normalized, non-empty), `Barcode` (non-empty when present), `MinStock` (integer ≥ 0, default 0), `VariationAttributes` (validated key/value map), `ProductName` (≥2 chars), `CategoryName` (non-empty, normalized). Reuse shared `Id`, `NonNegative`/`PositiveInteger`, `Text`/`Description` where they fit. `Price`/`Money` representation is a decision: store as integer cents to avoid float drift (flagged in Open Questions).

### 5. No deletion — deactivate only

Products and variations expose `activate()`/`deactivate()`; there are no delete use cases. This preserves sales history (RF-CAT-06). Categories follow the same activate/deactivate pattern.

### 6. CQRS reads for listing and PDV lookups

`ProductsQuery.list` returns a paginated projection (name search + category/status filters). PDV lookups (`find-variation-by-sku`, `find-variation-by-barcode`) go through `ProductsRepository` reads and return the variation + its product context. Read DTOs never leak entities/ORM.

### 7. Domain errors as stable string codes

`PRODUCT_NOT_FOUND`, `VARIATION_NOT_FOUND`, `CATEGORY_NOT_FOUND`, `SKU_ALREADY_IN_USE`, `BARCODE_ALREADY_IN_USE`, `CATEGORY_NAME_ALREADY_IN_USE`, `PRODUCT_MUST_HAVE_VARIATION`, `CATEGORY_NOT_FOUND_FOR_PRODUCT`. Returned via `Result.fail(<CODE>)`; the API maps them to HTTP.

## Skills to use

`module-aggregate` (scaffold), `module-value-object` (Price/Sku/Barcode/etc.), `module-entity` (Product + nested Variation), `module-domain-service` (uniqueness specifications), `module-repository` (ports), `module-dto`, `module-query-cqrs` (listing + PDV reads), `module-use-case` (commands).

## Risks / Trade-offs

- [Money as float drifts] → Use integer cents in `Price`; document the unit. (Open Question.)
- [Global SKU/barcode uniqueness across nested variations is awkward to read] → `ProductsRepository.findBySku/findByBarcode` encapsulate it; the data layer can index later as a redundant safety net.
- [Variation nested in aggregate complicates partial updates] → use-case-level `add/update/activate/deactivate-variation` operate on the loaded product via `cloneWith`, re-validating invariants.

## Migration Plan

Greenfield. Scaffold `modules/catalog` (product, then category), implement VOs → entities → specifications → ports → DTOs → use cases (commands + queries), add in-memory fakes and unit tests, wire `src/index.ts`. Rollback = delete the module dir.

## Open Questions

- `Price`/`Money` representation: integer cents (default chosen) vs. decimal string?
- Should `minStock` live in catalog (default 0, read by inventory) or move to inventory later? Default: keep in catalog variation as the source for inventory to read.
- Are attributes free-form key/value (default) or constrained to a predefined attribute set? Default: free-form for MVP.
