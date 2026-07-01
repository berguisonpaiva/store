## Context

The catalog stack already exists across all layers and is mostly compliant: pure domain `@repo/catalog` with `category` and `product` (owning the `Variation` child entity) aggregates, VOs (`ProductName`, `Sku`, `Barcode`, `Price` as integer cents >0, `MinStock`, `VariationAttributes`), CQRS queries, and uniqueness specifications; backend `categories`/`products`/`variations` controllers (ADMIN-gated, PDV lookups ADMIN+OPERADOR) with Prisma adapters; a web catalog module (list/forms/variation fields); and a mobile read layer. `Variation` is exported from `@repo/catalog` and consumed by the `CatalogVariationReader` port in `@repo/inventory` (backend adapter `catalog-variation.prisma.reader.ts`).

A verification pass (see proposal) found the RN mostly satisfied — soft-delete only, price>0 cents, ≥1 variation, ADMIN-only, reader wiring. The single genuine behavioral gap is **RN02/RN03**: `create-product`/`update-product` only check that a referenced category *exists* (`CATEGORY_NOT_FOUND_FOR_PRODUCT`), never that it is *active*. Secondary gaps are error-taxonomy drift from the RN names and web nav/route gating for ADMIN. Confirmed decision: **`categoryId` stays optional/nullable** — RN01 means "when set, the category must exist and be active," not "every product must have a category." That keeps the entity, DTO, Prisma model, and migrations untouched.

Constraints: English code/folders/error-names; `index.ts` barrels; pure domain (no HTTP/DB/framework); reuse `@repo/shared`; package manager `bun`; per-package gate `turbo build --filter=<pkg>` + `bun test`.

## Goals / Non-Goals

**Goals:**
- Enforce RN02/RN03 in the domain: a referenced category must exist and be active on product create/update.
- Align error names to the RN (`CategoryAlreadyExists`, `CategoryInactive`, `InvalidPrice`) and map them correctly to HTTP.
- Gate the web Catálogo nav + category/product routes to ADMIN (reinforcement).
- Keep everything already-compliant untouched; keep the cross-module `Variation` reader intact.
- All gates green (jest domain, backend tests, web/mobile build).

**Non-Goals:**
- Making `categoryId` required (explicitly rejected — no not-null migration).
- Any Prisma schema/migration change.
- Adding delete anywhere (soft-delete only stands).
- Changing the PDV lookup authorization (ADMIN+OPERADOR is intended).
- Mobile feature work (catalog read already exists; verify only).

## Decisions

**D1 — Active-category rule as a pure specification.**
Add `product/service/active-category.specification.ts` exposing e.g. `ensureUsable(category: Category | null): Result<void>` → `CategoryNotFound` when null, `CategoryInactive` when `!category.active`, ok otherwise. `create-product` and `update-product` call it only when a `categoryId` is supplied (categoryId stays optional). This keeps the rule pure and unit-testable, mirroring `unique-sku`/`unique-barcode`. Alternative (inline checks in each use case) rejected: duplicates logic and dodges the specification pattern the module already uses.

**D2 — Reuse category errors instead of a product-scoped category error.**
Remove `CATEGORY_NOT_FOUND_FOR_PRODUCT` from `product-error.ts`; the product flow returns the category module's `CategoryNotFound` and the new `CategoryInactive`. Rationale: one canonical name per concept; matches the RN error list; the backend mapper then needs only one mapping per code.

**D3 — Rename duplicate-name error to `CategoryAlreadyExists`.**
`CATEGORY_NAME_ALREADY_IN_USE` → `CATEGORY_ALREADY_EXISTS` across `category-error.ts`, `unique-category-name.specification.ts`, the backend mapper, and the web error-message map. Mechanical find-replace; the concept and 409 mapping are unchanged.

**D4 — Surface price failure as a Result, not a throw.**
Add `INVALID_PRICE` to `product-error.ts`. Where `Price.tryCreate` currently throws on `value ≤ 0`, the variation/product construction path MUST convert that into `Result.fail(InvalidPrice)` so use cases return a clean failure (RN08). Keep the VO's own guard; just ensure the aggregate boundary returns a Result rather than propagating a thrown error.

**D5 — Error → HTTP mapping in one place.**
`shared/errors/domain-error.mapper.ts`: `CATEGORY_ALREADY_EXISTS`/`SKU_ALREADY_IN_USE`/`BARCODE_ALREADY_IN_USE` → 409; `CATEGORY_NOT_FOUND`/`PRODUCT_NOT_FOUND`/`VARIATION_NOT_FOUND` → 404; `CATEGORY_INACTIVE`/`INVALID_PRICE`/`PRODUCT_MUST_HAVE_VARIATION` → 422. Update `domain-error.mapper.spec.ts`.

**D6 — Web gating reuses the role-filtered nav.**
The `(private)` shell already filters nav items by session role (added for user-management). Tag the Produtos/Categorias items (grouped under “Catálogo”) with `roles: ['ADMIN']`, and add an on-load `session.user.role !== 'ADMIN'` → `redirect('/dashboard')` guard to `/categories`, `/products`, `/products/new`, `/products/[id]`. UI only — the backend `@Roles('ADMIN')` remains authoritative.

**D7 — Layer ordering.**
Domain first (blocking: the error renames + active-category rule change the `@repo/catalog` contract the backend imports), then backend (mapper + any error-name references; reconfirm the inventory reader still builds), then web and mobile in parallel, then review.

## Risks / Trade-offs

- **[Renaming errors breaks references across layers]** → Do the domain rename first and run `turbo build --filter=@repo/catalog`; the compiler flags every stale reference in the backend mapper and web message map before those layers are edited.
- **[`Price.tryCreate` throwing is relied upon elsewhere]** → Audit call sites before changing the boundary; keep the VO guard, only wrap construction so the aggregate returns `InvalidPrice`. Existing tests that expect a throw must be updated to expect a failed `Result`.
- **[Active-category rule could reject previously-valid products on edit]** → The rule fires only when a `categoryId` is supplied on create/update; editing name/description without touching the category, or clearing it, is unaffected. Existing products linked to a now-inactive category are not retro-validated.
- **[Cross-module reader regression]** → The `Variation` export and `CatalogVariationReader` are untouched; reconfirm with `turbo build --filter=@repo/inventory` and `--filter=@repo/backend` after the domain change.
- **[Web gating mistaken for security]** → Specs and comments state the backend guard is authoritative; the route adds an on-load redirect independent of the hidden menu items.

## Migration Plan

1. **Domain** (`@repo/catalog`): rename duplicate-name error → `CategoryAlreadyExists`; add `CategoryInactive`; add `InvalidPrice` + Result-based price failure; add `active-category.specification.ts`; wire it into `create-product`/`update-product`; drop `CATEGORY_NOT_FOUND_FOR_PRODUCT`. Update tests/mocks. Gate: `turbo build --filter=@repo/catalog` + `bun test`.
2. **Backend**: update `domain-error.mapper.ts` (+ spec) and any error-name references; controllers/DTOs unchanged. Gate: `turbo build --filter=@repo/backend` (+ `--filter=@repo/inventory`) + backend tests.
3. **Web + Mobile** (parallel): web — group Produtos/Categorias under an ADMIN-gated “Catálogo”, add on-load redirects, surface new errors; mobile — verify catalog read still builds/tests. Gate: `turbo build --filter=@repo/web`; mobile `flutter analyze`/`test`.
4. **Review**: category + product/variation CRUD, active-category rejection (RN02/RN03), soft-delete, price>0 and ≥1 variation, ADMIN-only backend, and the `Variation` reader consumed by inventory/sales. Run monorepo build + tests + lint.

**Rollback**: revert per-layer commits; no schema/migration to undo since `categoryId` stays nullable.

## Open Questions

- None outstanding — `categoryId` optionality was confirmed. (If products already linked to categories that later go inactive should be flagged in listings, that is a separate reporting concern, out of scope here.)
