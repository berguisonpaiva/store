## Why

The store floor needs inventory in-hand: a clerk must check how much of a variation (SKU) is on stock, see its movement history, watch low-stock alerts, and perform the lightweight stock movements that happen on the floor (receive a purchase, write off a loss, correct an inventory count). With auth already wired (`mobile-auth`) and the inventory API coming from `estoque-backend`, this change adds the **inventory (estoque) feature to `apps/mobile`** following Clean Architecture: a domain contract, a data-layer implementation against the backend, and UI for the operational read + quick movements.

**Scope decision (operational read + quick movements).** Unlike `catalog-mobile` — which stayed read-only because product/category authoring belongs on the web admin — inventory movements (`registrar-entrada` / `registrar-saida` / `ajustar-saldo`) are **floor tasks done with the phone in hand**, so this change deliberately includes them. The mobile core is **consultar saldo (lookup by SKU/barcode), histórico de movimentações, and alertas de baixo estoque**, PLUS **quick stock movements**. Camera-scanner integration is **deferred** (the lookup accepts a typed/scanned code), exactly as `catalog-mobile` deferred it. Sale-driven exit (`darBaixa`/`estornar` via the gateway) stays out of mobile — it is not a public command (RF-EST-09).

## What Changes

- **Domain** (`lib/domain/estoque/`): entities (`StockBalanceEntity` — `saldoAtual`, `saldoDisponivel`, `quantidadeReservada`, `estoqueMinimo`; `StockMovementEntity` — `tipo`, `motivo`, `quantidade`, `saldoResultante`, timestamp; `LowStockItemEntity`), an `InventoryRepository` contract (consultar saldo by SKU/barcode, listar movimentações por variação/período, listar abaixo do mínimo, registrar entrada/saída, ajustar saldo), `InventoryFailure`s, and use cases — all `Either<Failure, T>`, free of Flutter/infra.
- **Data** (`lib/data/estoque/`): `InventoryRemoteDataSource` (Dio via the shared `HttpClient`) targeting the **query** endpoints (`GET /api/inventory/balance/by-sku/:sku`, `GET /api/inventory/balance/by-barcode/:barcode`, `GET /api/inventory/movements`, `GET /api/inventory/low-stock`) and the **command** endpoints (`POST /api/inventory/entrada`, `POST /api/inventory/saida`, `POST /api/inventory/ajuste`); DTOs + mappers; repository impl converting `AppException`→`InventoryFailure`. Authenticated via the existing bearer/refresh interceptor.
- **UI** (`lib/ui/estoque/`): a saldo-lookup screen (MVVM Cubit) resolving a variation by SKU/barcode and showing saldoAtual/disponível, a movement-history view (por variação/período), a low-stock alerts list, and quick-movement forms (entrada / saída / ajuste) with `AppToast` for `ESTOQUE_INSUFICIENTE` / `VARIACAO_NAO_ENCONTRADA` / `QUANTIDADE_INVALIDA`; l10n strings.
- **App wiring**: register the inventory data source/repository/use cases and cubits in get_it; add inventory routes and a navigation entry; guarded by the existing auth session.
- **Out of scope**: sale-driven exit (`darBaixa`/`estornar`, owned by `vendas` via the gateway), camera-scanner integration (the lookup accepts a code; a scanner package is a later change), and any inventory authoring beyond the three quick movements.

## Capabilities

### New Capabilities

- `mobile-inventory-balance`: The inventory domain contract (entities, `InventoryRepository` read methods, `InventoryFailure`s, `Either`), the data layer (`InventoryRemoteDataSource` over `HttpClient` hitting the balance/movements/low-stock endpoints, DTOs + mappers, `AppException`→`InventoryFailure`), and the read UI (saldo lookup by SKU/barcode, movement history, low-stock alerts list) wired into DI + routing. (RF-EST-06, RF-EST-07, RF-EST-08)
- `mobile-inventory-movements`: The use cases + MVVM Cubit UI for `registrar-entrada` / `registrar-saida` / `ajustar-saldo` against the command endpoints, with `AppToast` for `ESTOQUE_INSUFICIENTE` / `VARIACAO_NAO_ENCONTRADA` / `QUANTIDADE_INVALIDA`, and l10n strings. (RF-EST-01, RF-EST-02, RF-EST-04, RF-EST-05)

### Modified Capabilities

<!-- None — new mobile feature. -->

## Impact

- **Depends on**: `estoque-backend` reachable at `API_BASE_URL`, and `mobile-auth` (session, bearer, `HttpClient`).
- **Files**: `apps/mobile/lib/domain/estoque/**`, `apps/mobile/lib/data/estoque/**`, `apps/mobile/lib/ui/estoque/**`, DI module additions, new routes + nav entry, and l10n entries.
- **Reused**: `HttpClient` (bearer + 401 refresh), `AppToast`, theme, get_it, go_router, fpdart, flutter_bloc.
- **No new heavy deps** (camera scanner deferred).
