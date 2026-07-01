## Why

The Flutter app needs the catalog to power browsing and the PDV (point-of-sale) barcode/SKU scan. With auth already wired (`mobile-auth`) and the catalog API live (`catalog-backend`), this change adds the **catalog feature to `apps/mobile`** following Clean Architecture: a domain contract, a data-layer implementation against the backend, and read-oriented UI (product list with search/filter + variation lookup by SKU/barcode for the PDV). Product/category authoring stays on the web admin for the MVP.

## What Changes

- **Domain** (`lib/domain/catalog/`): entities (`ProductEntity`, `VariationEntity`, `CategoryEntity`), a `CatalogRepository` contract (list products with search/filter, get product, find variation by SKU, find variation by barcode, list categories), `CatalogFailure`s, and use cases — all `Either<Failure, T>`, free of Flutter/infra.
- **Data** (`lib/data/catalog/`): `CatalogRemoteDataSource` (Dio via the shared `HttpClient`) targeting `GET /api/products`, `GET /api/products/:id`, `GET /api/variations/by-sku/:sku`, `GET /api/variations/by-barcode/:barcode`, `GET /api/categories`; DTOs + mappers; repository impl converting `AppException`→`CatalogFailure`. Authenticated via the existing bearer/refresh interceptor.
- **UI** (`lib/ui/catalog/`): a products list screen (MVVM Cubit) with name search and category/status filter + pagination, a product detail view, and a **PDV lookup** entry (enter/scan a barcode or SKU → resolve variation). `AppToast` for not-found; l10n strings.
- **App wiring**: register the catalog data source/repository/use cases and cubits in get_it; add a catalog route and a navigation entry; guarded by the existing auth session.
- **Out of scope**: product/category create/edit on mobile (web admin), the full sales/PDV checkout flow, inventory, and camera-scanner integration (the lookup accepts a code; wiring a scanner package is a later change).

## Capabilities

### New Capabilities

- `mobile-product-catalog`: The catalog domain contract + use cases, the data-layer implementation against the backend (incl. SKU/barcode lookup), and the read-oriented UI (product list with search/filter/pagination, product detail, PDV variation lookup), wired into DI and routing.

### Modified Capabilities

<!-- None — new mobile feature. -->

## Impact

- **Depends on**: `catalog-backend` reachable at `API_BASE_URL`, and `mobile-auth` (session, bearer, `HttpClient`).
- **Files**: `apps/mobile/lib/domain/catalog/**`, `apps/mobile/lib/data/catalog/**`, `apps/mobile/lib/ui/catalog/**`, DI module additions, a new route + nav entry, and l10n entries.
- **Reused**: `HttpClient` (bearer + 401 refresh), `AppToast`, theme, get_it, go_router, fpdart, flutter_bloc.
- **No new heavy deps** (camera scanner deferred).
