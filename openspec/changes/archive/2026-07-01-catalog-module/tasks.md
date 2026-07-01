## 1. Domain — `modules/catalog` (`@repo/catalog`) — BLOCKING

- [x] 1.1 `category/errors/category-error.ts`: rename `CATEGORY_NAME_ALREADY_IN_USE` → `CATEGORY_ALREADY_EXISTS`; add `CATEGORY_INACTIVE`; keep `CATEGORY_NOT_FOUND`; update the errors barrel.
- [x] 1.2 `category/service/unique-category-name.specification.ts`: return `CATEGORY_ALREADY_EXISTS` instead of the old name.
- [x] 1.3 `product/errors/product-error.ts`: add `INVALID_PRICE`; remove `CATEGORY_NOT_FOUND_FOR_PRODUCT`; keep `PRODUCT_NOT_FOUND`, `VARIATION_NOT_FOUND`, `SKU_ALREADY_IN_USE`, `BARCODE_ALREADY_IN_USE`, `PRODUCT_MUST_HAVE_VARIATION`; update barrel.
- [x] 1.4 Add `product/service/active-category.specification.ts` (`ensureUsable(category): Result<void>` → `CategoryNotFound` when null, `CategoryInactive` when inactive); export from the service barrel.
- [x] 1.5 `product/use-case/create-product.use-case.ts`: when `categoryId` is provided, run the active-category specification → `CategoryNotFound`/`CategoryInactive` (already depended on `CategoriesRepository`); categoryId stays optional.
- [x] 1.6 `product/use-case/update-product.use-case.ts`: same active-category check when `categoryId` is supplied. (Added the missing update-product test.)
- [x] 1.7 Price failure surfaced as `Result`: `Price.tryCreate` now returns `Result.fail(INVALID_PRICE)` (no throw escapes); `Price.INVALID_PRICE` aliases `ProductError.INVALID_PRICE`.
- [x] 1.8 Verified unchanged/compliant: soft-delete only (no delete port), ≥1-variation invariant, `Sku`/`Barcode` uniqueness specs, `find-variation-by-sku`/`find-variation-by-barcode`, `list-products` filters (`name`, `categoryId`, `active`).
- [x] 1.9 Confirmed `modules/catalog/src/index.ts` still exports `Variation` plus the new `ActiveCategorySpecification` and error codes.
- [x] 1.10 Updated tests/mocks: category error-name assertions; active-category cases in create/update-product; price-≤0 asserts `INVALID_PRICE`; added `ActiveCategorySpecification` spec tests.
- [x] 1.11 Gate: `turbo build --filter=@repo/catalog` + `bun test` (10 suites / 69 tests) green; deliver diff.

## 2. Backend — `apps/backend/src/modules/{categories,products}` (depends on 1)

- [x] 2.1 `shared/errors/domain-error.mapper.ts`: `CATEGORY_ALREADY_EXISTS` → 409 (replacing `CATEGORY_NAME_ALREADY_IN_USE`); `CATEGORY_NOT_FOUND` → 404; `CATEGORY_INACTIVE` → 422; `INVALID_PRICE` → 422; kept `SKU_/BARCODE_ALREADY_IN_USE` → 409, `PRODUCT_/VARIATION_NOT_FOUND` → 404, `PRODUCT_MUST_HAVE_VARIATION` → 422 (moved from 400); removed `CATEGORY_NOT_FOUND_FOR_PRODUCT`.
- [x] 2.2 Updated `domain-error.mapper.spec.ts` for the renamed/added codes.
- [x] 2.3 Grepped backend; updated `category.prisma.repository.ts` (P2002 fallback) + mapper; post-edit grep = zero matches for both old codes.
- [x] 2.4 Reconfirmed `catalog-variation.prisma.reader.ts` imports only `Variation`/`AttributeMap` from `@repo/catalog` — no error coupling, no change; `@repo/inventory` builds clean.
- [x] 2.5 No Prisma/schema/migration change (categoryId nullable stays); management routes `@Papeis(ADMIN)`, PDV lookups `@Papeis(ADMIN, OPERADOR)` already correct.
- [x] 2.6 Gate: `turbo build --filter=@repo/backend` (6/6) + `--filter=@repo/inventory` (3/3) + backend tests (8 suites / 66) green.

## 3. Web — `apps/web` (parallel with 4, after API contract)

- [x] 3.1 Grouped “Produtos” and “Categorias” under a new “Catálogo” nav section in `(private)/private-shell.tsx`, tagged `roles: ['ADMIN']` (reused `SidebarMenuItem.roles` + `filterSectionsByRole`).
- [x] 3.2 Added on-load ADMIN guard (redirect non-ADMIN → `/dashboard`, mirroring `usuarios/page.tsx`) to `/categories`, `/products`, `/products/new`, `/products/[id]`.
- [x] 3.3 `error-messages.ts`: added `CATEGORY_ALREADY_EXISTS`, `CATEGORY_INACTIVE`, `INVALID_PRICE`; removed `CATEGORY_NAME_ALREADY_IN_USE`/`CATEGORY_NOT_FOUND_FOR_PRODUCT`; product form surfaces `CATEGORY_NOT_FOUND`/`CATEGORY_INACTIVE` field-level on the category selector.
- [x] 3.4 Confirmed forms (RHF + Zod, price cents via `react-number-format`, category combobox) and activate/deactivate actions still work; only error-code references adjusted.
- [x] 3.5 Gate: `turbo build --filter=@repo/web` green; zero new lint findings vs the pre-existing baseline.

## 4. Mobile — `apps/mobile` (Flutter; parallel with 3)

- [x] 4.1 Verify catalog read features build and are consistent: product list + search + filter by category, and variation lookup by SKU/barcode (`lib/domain/catalog`, `lib/data/catalog`). No write features in this MVP. (Read DTOs match unchanged payloads.)
- [x] 4.2 Confirm no error-name coupling to the renamed domain codes on the read path. (Zero matches; read path maps by HTTP status only — no change needed.)
- [x] 4.3 Gate: `flutter analyze` (No issues) + `flutter test` (149 pass, 4 live-skipped) green.

## 5. Review — end-to-end (after 1–4)

- [x] 5.1 Verified via domain suite (catalog 69 tests: category commands, product+variation commands/queries) + green build; CRUD paths intact.
- [x] 5.2 RN02/RN03 verified: create/update-product missing category → `CategoryNotFound` (mapper 404), inactive → `CategoryInactive` (mapper 422); covered by domain tests + `domain-error.mapper.spec`.
- [x] 5.3 RN06: zero `@Delete` routes in categories/products controllers, no delete port. RN08: price ≤ 0 → `InvalidPrice`, ≥1 variation → `ProductMustHaveVariation` (domain tests).
- [x] 5.4 RN07: backend `@Papeis(ADMIN)` on management routes, `@Papeis(ADMIN, OPERADOR)` on PDV lookups; web Catálogo nav + `/categories`+`/products*` routes gated to ADMIN.
- [x] 5.5 `@repo/inventory` builds + 23 tests pass (reader imports `Variation` from `@repo/catalog`). Monorepo `turbo build` 7/7 + `turbo test` 7/7 green; lint at pre-existing baseline (no new findings). Note: `INVALID_PRICE`→422 also applies to `@repo/sales` (shared code, intended alignment).
