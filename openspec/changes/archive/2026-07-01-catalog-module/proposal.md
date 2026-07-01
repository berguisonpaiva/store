## Why

The catalog stack (`@repo/catalog` domain, backend `categories`/`products`/`variations`, web catalog module, mobile read layer) already exists and is largely compliant with the target rules. However, one business rule was never enforced: **a product may be linked to an inactive or non-existent category** — the create/update use cases only check that the category *exists* (`CATEGORY_NOT_FOUND_FOR_PRODUCT`), never that it is *active* (RN02/RN03). This change closes that gap, aligns the error taxonomy to the RN names, and gates the web Catálogo navigation to ADMIN — without the disruptive churn of making `categoryId` required (confirmed: it stays optional).

## What Changes

- **Domain (RN02/RN03)** — Add `product/service/active-category.specification.ts`: when a product create/update supplies a `categoryId`, the category MUST exist and be active. `create-product` and `update-product` now fail with `CategoryNotFound` (missing) or `CategoryInactive` (inactive), replacing the single `CATEGORY_NOT_FOUND_FOR_PRODUCT`.
- **Domain (error taxonomy)** — Add `CategoryInactive` to `category-error.ts`; rename `CATEGORY_NAME_ALREADY_IN_USE` → `CategoryAlreadyExists` to match the RN. Remove `CATEGORY_NOT_FOUND_FOR_PRODUCT` from `product-error.ts` (superseded by the category errors); add `InvalidPrice` and surface a price-rule failure as a `Result.fail(InvalidPrice)` rather than a thrown error (RN08).
- **Backend** — Update `shared/errors/domain-error.mapper.ts`: `CategoryAlreadyExists`/`SkuAlreadyInUse`/`BarcodeAlreadyInUse` → 409, `*NotFound` → 404, `InvalidPrice`/`CategoryInactive`/`ProductMustHaveVariation` → 422. Keep the existing `@Roles('ADMIN')` on management routes and the ADMIN+OPERADOR PDV lookups. No Prisma schema or migration change (categoryId stays nullable).
- **Web (RN07)** — Add an ADMIN-only **Catálogo** grouping (Produtos, Categorias) to the sidebar using the role-gated nav mechanism, and add an on-load ADMIN redirect guard to the category/product pages (reinforcement, not the security boundary). Surface `CategoryInactive`/`CategoryAlreadyExists`/`InvalidPrice` in the web error-message map.
- **Verify-only (already compliant)** — Soft-delete only (repositories compose Create/Update/FindById, no delete), price>0 integer cents, ≥1 variation, `Variation` exported from `@repo/catalog`, and the `CatalogVariationReader` port (in `@repo/inventory`) + its backend Prisma adapter consumed by inventory/sales. Mobile catalog read (list/search/filter, variation lookup by SKU/barcode) is verified, not changed.

## Capabilities

### New Capabilities
<!-- None — all catalog capabilities already exist; this change modifies existing ones. -->

### Modified Capabilities
- `product-catalog`: product create/update enforce category exists **and is active** (`CategoryNotFound`/`CategoryInactive`); price failure surfaced as `InvalidPrice`.
- `category-management`: unique-name violation renamed to `CategoryAlreadyExists`; `CategoryInactive` error added to the category error set.
- `product-catalog-api`: domain-error mapping updated for `CategoryInactive` (422), `CategoryAlreadyExists` (409), `InvalidPrice` (400/422); role protection unchanged.
- `category-management-api`: domain-error mapping updated for the renamed `CategoryAlreadyExists` (409) and `CategoryInactive`.
- `web-product-catalog`: Catálogo/Produtos nav gated to ADMIN; product pages redirect non-ADMIN on load; new error messages surfaced.
- `web-category-management`: Categorias nav gated to ADMIN; category page redirects non-ADMIN on load.

## Impact

- **Domain** `modules/catalog/`: `category/errors/category-error.ts`, `product/errors/product-error.ts`, new `product/service/active-category.specification.ts` (+ barrel), `product/use-case/{create-product,update-product}.use-case.ts`, `product/model/price.vo.ts` (return vs throw), `category/service/unique-category-name.specification.ts` (error name), and jest tests/mocks.
- **Backend** `apps/backend/src/`: `shared/errors/domain-error.mapper.ts` (+ spec); `modules/{categories,products}` controllers/DTOs unchanged except any error-name references.
- **Web** `apps/web/src/`: `(private)/private-shell.tsx` (nav roles), `(private)/categories` + `(private)/products` pages (on-load guard), `modules/catalog/data/error-messages.ts`.
- **Mobile** `apps/mobile/lib/`: none (verify catalog read still builds/tests green).
- **Cross-module**: `@repo/inventory` `CatalogVariationReader` and backend `catalog-variation.prisma.reader.ts` unchanged — reconfirm they still resolve `Variation` from `@repo/catalog`.
- **No Prisma migration** — `categoryId` remains nullable.
