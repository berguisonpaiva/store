## Why

With the catalog API in place (`catalog-backend`), the web admin needs screens to manage products, variations, and categories. This change adds the **catalog module to `apps/web`** (Next.js, simple layout): list/search/filter products, create/edit products with variations, manage categories, and activate/deactivate — all behind the existing NextAuth session, calling the backend with the authenticated HTTP client. No backend or mobile work.

## What Changes

- Add a **catalog area** under the `(private)` group: `/products` (list + create/edit) and `/categories` (list + create/edit).
- **Product list** with URL-state search by name and filters by category/status, paginated (`nuqs`); rows link to edit and expose activate/deactivate.
- **Product form** (React Hook Form): name, description, category select (loaded from `/api/categories`), and a **variations editor** (≥1 row: SKU, barcode, attributes key/value, price, minStock) with inline validation (price > 0, minStock ≥ 0, name ≥ 2).
- **Category management**: list + create/edit form (unique name) + activate/deactivate.
- **Data layer**: server-side `apiFetch`/`apiJson` (existing `lib/http`) for reads; **Server Actions** for create/update/activate/deactivate, mapping backend error codes (409/400/404) to field/toast feedback.
- **Navigation**: register “Produtos” and “Categorias” items in the `(private)` shell `NAVIGATION_SECTIONS`.
- **No deletion** in the UI — only activate/deactivate (preserve history).
- **Out of scope**: backend/mobile, the PDV screen itself (this is catalog management; PDV is a later change), and the inventory UI.

## Capabilities

### New Capabilities

- `web-product-catalog`: The `/products` route(s), product list (search/filter/paginate), the product+variations form, activate/deactivate, and the catalog data layer (server reads + Server Action mutations) against the backend.
- `web-category-management`: The `/categories` route(s), category list, create/edit form (unique name), and activate/deactivate.

### Modified Capabilities

<!-- None — first catalog UI; navigation registration is additive. -->

## Impact

- **Depends on**: `catalog-backend` reachable at `NEXT_PUBLIC_API_URL`, and `web-auth` (session + `lib/http`).
- **Files**: `apps/web/src/app/(private)/products/**`, `apps/web/src/app/(private)/categories/**`, `apps/web/src/modules/catalog/**` (components, data, schemas), and an additive edit to `private-shell.tsx` navigation.
- **Reused**: shadcn/ui components, `lib/http` (Bearer), `nuqs`, RHF, `sonner` toasts.
- **No new heavy deps** (RHF/nuqs/sonner already present).
