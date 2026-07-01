## Context

`apps/mobile` is a Flutter Clean Architecture app (get_it, go_router, flutter_bloc, fpdart, dio, secure storage) with auth wired (`mobile-auth`): the shared `HttpClient` attaches the bearer and refreshes on 401, and the router is guarded by `AuthSessionCubit`. The inventory API comes from `estoque-backend` (consumed via `/api/inventory/...`). Inventory is the heart of the MVP: the variation owns the fast-read fields (`saldoAtual`, `quantidadeReservada`, `estoqueMinimo`) and `MovimentacaoEstoque` is the immutable ledger. This change adds the inventory feature to mobile.

## Goals / Non-Goals

**Goals:**

- Inventory domain contract + use cases (`Either<Failure, T>`), free of Flutter/infra.
- Data layer against the backend, authenticated via the shared `HttpClient`.
- Read UI: saldo lookup by SKU/barcode, movement history (por variação/período), low-stock alerts list.
- Write UI: quick stock movements (registrar-entrada / registrar-saida / ajustar-saldo) with domain-error toasts.
- DI + routing + navigation, behind the auth session.
- Follow the Flutter skills (feature-workflow, domain, data, ui-mvvm, core, testing).

**Non-Goals:**

- No sale-driven exit (`darBaixa`/`estornar`) — owned by `vendas` via the gateway, never a public command (RF-EST-09).
- No camera-scanner package (lookup takes a code string).
- No backend or web work; no inventory authoring beyond the three quick movements.

## Decisions

### 1. Scope: operational read PLUS quick movements (diverges from catalog-mobile)

`catalog-mobile` was read-only because product/category **authoring** belongs on the web admin. Inventory is different: receiving a purchase, writing off a loss, and correcting a count are **floor tasks done with the phone in hand**, so this change includes `registrar-entrada` / `registrar-saida` / `ajustar-saldo` (RF-EST-01/02/04/05) alongside the read core (RF-EST-06/07/08). Alternative considered: keep mobile read-only and mirror catalog exactly — rejected, since the movements are precisely the operational tasks mobile is best for. Sale-driven exit stays out (it is not a public command).

### 2. Two capabilities (separate specs)

Read and write are split into `mobile-inventory-balance` (contract + data + read UI) and `mobile-inventory-movements` (write use cases + movement UI). This keeps each spec focused and lets the read side ship/verify independently of the write forms.

### 3. Lookup takes a code string; scanner deferred

The saldo lookup accepts a typed/entered SKU or barcode; integrating a camera scanner (e.g. `mobile_scanner`) is deferred to a later change (keeps deps and permissions out of scope) — exactly as `catalog-mobile` deferred it. Flagged in Open Questions.

### 4. Layers mirror the catalog/auth features

- `domain/estoque/`: `StockBalanceEntity` (saldoAtual, saldoDisponivel, quantidadeReservada, estoqueMinimo), `StockMovementEntity` (tipo, motivo, quantidade, saldoResultante, criadoEm), `LowStockItemEntity`; `InventoryRepository`; `InventoryFailure`s; use cases (`GetBalanceBySku`, `GetBalanceByBarcode`, `ListMovements`, `ListLowStock`, `RegisterEntry`, `RegisterExit`, `AdjustBalance`).
- `data/estoque/`: `InventoryRemoteDataSource(Impl)` over `HttpClient`, DTOs + mappers, `InventoryRepositoryImpl` (AppException→InventoryFailure).
- `ui/estoque/`: `BalanceLookupCubit`/state, `MovementsCubit`/state, `LowStockCubit`/state, `StockMovementCubit`/state (entrada/saida/ajuste). Explicit-bloc, cubits resolved from get_it, no `BlocProvider`, no Flutter imports in cubits.

### 5. Authenticated calls reuse the existing transport

All inventory requests go through the shared `HttpClient`, so they automatically carry the bearer and benefit from the 401→refresh interceptor from `mobile-auth`. No inventory-specific auth handling.

### 6. Failures map domain error codes to toasts

`InventoryFailure` subtypes: `VariationNotFoundFailure` (`VARIACAO_NAO_ENCONTRADA`), `InsufficientStockFailure` (`ESTOQUE_INSUFICIENTE`), `InvalidQuantityFailure` (`QUANTIDADE_INVALIDA`), and `InventoryNetworkFailure`. The repository maps `NetworkException`/`UnauthorizedException` and the backend error codes accordingly; 404 / business errors map to the specific failure, surfaced via `AppToast` in the write flows.

## Skills to use

`flutter-feature-workflow` (end-to-end), `flutter-domain-layer` (entities/use cases/failures), `flutter-data-drift-layer` (datasource/repository/DTOs — remote only here), `flutter-core-layer` (reuse `HttpClient`), `flutter-ui-mvvm` + `flutter-design-system` (lookup/history/alerts/forms screens), `flutter-app-composition` (DI, routes, nav), `flutter-testing`.

## Risks / Trade-offs

- [No camera scanner yet] → lookup accepts a code; UX is a text field for now (Open Question).
- [Stale balance after a movement] → after a successful movement, re-fetch the variation balance so the lookup/history reflect the new `saldoAtual`.
- [Negative-balance protection] → `registrar-saida` surfaces `ESTOQUE_INSUFICIENTE` from the backend; `ajustar-saldo` is the only flow allowed to override, and the UI labels it as inventory correction.
- [Quantity formatting] → quantities are integers; validate `> 0` (entrada/saida) and `>= 0` (ajuste novoSaldo) in the form before calling the use case, and still rely on the backend as source of truth.

## Migration Plan

1. Add `domain/estoque` (entities, contract, failures, use cases).
2. Add `data/estoque` (datasource, DTOs, mappers, repository impl).
3. Add `ui/estoque` read screens (lookup + history + low-stock, cubits + states) and l10n.
4. Add `ui/estoque` movement forms (entrada/saida/ajuste, cubit + state) with domain-error toasts.
5. Register DI, add routes + nav entry.
6. `flutter analyze` + `flutter test` green; manual verify against the backend.

Rollback: remove the inventory `domain`/`data`/`ui` dirs, DI entries, routes, and nav entry.

## Open Questions

- Camera barcode scanner (e.g. `mobile_scanner`) now or later? Default: later; text/keyboard entry for the lookup in this change.
- Should the movement forms reuse the catalog variation lookup to pick the variation, or take a SKU/barcode directly? Default: take a SKU/barcode (consistent with the saldo lookup), resolving the variation server-side.
