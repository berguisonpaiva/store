## Context

`apps/mobile` is a Flutter Clean Architecture app (get_it, go_router, flutter_bloc, fpdart, dio, secure storage) with auth wired (`mobile-auth`): the shared `HttpClient` attaches the bearer and refreshes on 401, and the router is guarded by `AuthSessionCubit`. The catalog API (`catalog-backend`) is live. This change adds the catalog feature, **read/PDV oriented** (authoring stays on web for the MVP).

## Goals / Non-Goals

**Goals:**

- Catalog domain contract + use cases (`Either<Failure, T>`), free of Flutter/infra.
- Data layer against the backend, authenticated via the shared `HttpClient`.
- Products list (search/filter/pagination), product detail, and PDV variation lookup by SKU/barcode.
- DI + routing + navigation, behind the auth session.
- Follow the Flutter skills (feature-workflow, domain, data, ui-mvvm, core, testing).

**Non-Goals:**

- No product/category authoring on mobile (web admin).
- No full sales/PDV checkout, no inventory, no camera-scanner package (lookup takes a code string).

## Decisions

### 1. Read-first scope; lookup takes a code string

The mobile catalog is consumption-focused: browse + resolve a variation by SKU/barcode. The lookup accepts a typed/entered code; integrating a camera scanner is deferred to a later change (keeps deps and permissions out of scope). Flagged in Open Questions.

### 2. Layers mirror the auth feature

- `domain/catalog/`: `ProductEntity` (+ `VariationEntity` list), `CategoryEntity`, `CatalogRepository`, `CatalogFailure`s, use cases (`ListProducts`, `GetProduct`, `FindVariationBySku`, `FindVariationByBarcode`, `ListCategories`).
- `data/catalog/`: `CatalogRemoteDataSource(Impl)` over `HttpClient`, DTOs + mappers, `CatalogRepositoryImpl` (AppException→CatalogFailure).
- `ui/catalog/`: `ProductsCubit`/state (list+filters+pagination), product detail widget, `VariationLookupCubit`/state (PDV). Explicit-bloc, cubits resolved from get_it, no `BlocProvider`, no Flutter imports in cubits.

### 3. Pagination + filters in the Cubit

`ProductsCubit` holds query state (name, categoryId, active, page) and exposes `search`/`filter`/`loadMore`. It calls `ListProducts`, which maps to a `PaginatedResult` DTO from the backend. URL state is N/A on mobile; the cubit is the source of truth.

### 4. Authenticated calls reuse the existing transport

All catalog requests go through the shared `HttpClient`, so they automatically carry the bearer and benefit from the 401→refresh interceptor from `mobile-auth`. No catalog-specific auth handling.

### 5. Failures

`CatalogFailure` subtypes: `ProductNotFoundFailure`, `VariationNotFoundFailure`, `CatalogNetworkFailure`. The repository maps `NetworkException`/`UnauthorizedException` accordingly; not-found (404) maps to the specific not-found failure.

## Skills to use

`flutter-feature-workflow` (end-to-end), `flutter-domain-layer` (entities/use cases/failures), `flutter-data-drift-layer` (datasource/repository/DTOs — remote only here), `flutter-core-layer` (reuse `HttpClient`), `flutter-ui-mvvm` + `flutter-design-system` (list/detail/lookup screens), `flutter-app-composition` (DI, route, nav), `flutter-testing`.

## Risks / Trade-offs

- [No camera scanner yet] → lookup accepts a code; UX is a text field for now (Open Question).
- [Large product lists] → paginate via the backend; `loadMore` appends; avoid loading everything.
- [Price/cents formatting] → format integer cents to currency in the UI layer only.

## Migration Plan

1. Add `domain/catalog` (entities, contract, failures, use cases).
2. Add `data/catalog` (datasource, DTOs, mappers, repository impl).
3. Add `ui/catalog` (products list + detail + PDV lookup, cubits + states) and l10n.
4. Register DI, add route + nav entry.
5. `flutter analyze` + `flutter test` green; manual verify against the backend.

Rollback: remove the catalog `domain`/`data`/`ui` dirs, DI entries, route, and nav entry.

## Open Questions

- Camera barcode scanner (e.g. `mobile_scanner`) now or later? Default: later; text/keyboard entry for the lookup in this change.
- Include product/category authoring on mobile eventually, or keep web-only? Default: web-only for MVP.
