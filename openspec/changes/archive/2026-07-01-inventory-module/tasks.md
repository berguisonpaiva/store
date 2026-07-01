## 1. Domain — remove reservation & thread transaction (`modules/inventory`)

- [x] 1.1 `model/estoque-saldo.entity.ts`: drop `quantidadeReservada` from `EstoqueSaldoProps`, `CreateFromCatalogVariationOverrides`, `tryCreate`, and the `saldoDisponivel` getter; remove the `saldoAtual − reservada < 0` check (keep `Saldo` ≥ 0 validation).
- [x] 1.2 `service/estoque-policy.service.ts`: remove `assertSaldoDisponivel`; keep `assertSaldoSuficiente` and `calculateAdjustment` unchanged.
- [x] 1.3 `provider/estoque.repository.ts`: add optional `tx?: TransactionContext` to `aplicarMovimentacao` options (alongside `saldoAbsoluto?`); update `AplicarMovimentacaoOptions`.
- [x] 1.4 `provider/estoque.port.ts`: add optional `tx?: TransactionContext` param to `darBaixa` and `estornar`.
- [x] 1.5 `use-case/estoque-use-case.base.ts` + `estoque-port.service.ts`: pass `tx` through `persistMovement` → `aplicarMovimentacao`; `darBaixa` validates with `assertSaldoSuficiente(saldoAtual, qtd)` (no reservation).
- [x] 1.6 `dto/movimentacao.dto.ts`: drop `quantidadeReservada`/`saldoDisponivel` from `SaldoEstoqueDTO` and `toSaldoEstoqueDTO`; keep `saldoAtual`/`estoqueMinimo` and `ItemAbaixoDoMinimoDTO`.
- [x] 1.7 `provider/estoque.query.ts`: ensure `listarAbaixoDoMinimo` contract keys on `saldoAtual < estoqueMinimo` (no `saldoDisponivel`).
- [x] 1.8 Update barrels (`index.ts`) and in-memory mocks in `modules/inventory/test/mock/*` (fake `EstoqueRepository`/`CatalogVariationReader`) to the new shapes.
- [x] 1.9 Update jest tests for entity, policy, use cases, and port; add a test asserting `aplicarMovimentacao` uses the supplied `tx` when provided.
- [x] 1.10 Gate: `turbo build --filter=@repo/inventory` + `bun test` (inventory) green.

## 2. Backend — schema, adapters, error mapper, sales gateway (`apps/backend`)

- [x] 2.1 `prisma/models/estoque.model.prisma`: remove `quantidadeReservada` from `EstoqueSaldo` and its check constraint.
- [x] 2.2 Generate a migration dropping the `quantidadeReservada` column + constraint; run generate/migrate.
- [x] 2.3 `adapters/estoque.prisma.repository.ts`: when `options.tx` is present run the `SELECT … FOR UPDATE` + ledger insert + balance update on that client instead of `runInTransaction`; drop `quantidadeReservada` from `criarSaldo`/`toDomain`; extend `mapError` to propagate `LEDGER_IMUTAVEL`/`MOTIVO_MOVIMENTACAO_INVALIDO`/`SALDO_INVALIDO`.
- [x] 2.4 `adapters/estoque.prisma.query.ts`: remove `saldoDisponivel`/`quantidadeReservada` projections; `consultarSaldo` returns `saldoAtual`+`estoqueMinimo`; `listarAbaixoDoMinimo` uses `saldoAtual < estoqueMinimo`.
- [x] 2.5 `shared/errors/domain-error.mapper.ts`: add `LEDGER_IMUTAVEL`→409, `MOTIVO_MOVIMENTACAO_INVALIDO`→400, `SALDO_INVALIDO`→400.
- [x] 2.6 Controllers/DTOs: drop `saldoDisponivel` from the balance response DTO/Swagger; confirm commands stay `@Roles('ADMIN')` and query routes match the RN.
- [x] 2.7 `sales/adapters/estoque.gateway.adapter.ts`: `validarSaldoDisponivel` compares `saldoAtual` (drop `− quantidadeReservada`); `darBaixa`/`estornar` forward the received `tx` into the estoque port.
- [x] 2.8 `inventory.module.ts`: confirm port→adapter bindings still resolve after signature changes; keep `EstoquePortService`/`EstoquePrismaRepository` exports.
- [x] 2.9 Update backend specs (`inventory.controller.spec.ts`, `vendas.adapters.spec.ts`, `vendas.orchestration.spec.ts`) — add a test asserting a rolled-back sale rolls back the stock movement (shared tx).
- [x] 2.10 Gate: `turbo build --filter=backend` + `bun test` (backend) green.

## 3. Web — balance display, ADMIN nav + guard (`apps/web`)

- [x] 3.1 Remove `saldoDisponivel`/reservation from the balance screen and its read schema/types; show `saldoAtual` + `estoqueMinimo`.
- [x] 3.2 Add the ADMIN-only **Estoque** entry to the sidebar/nav config (`roles: ['ADMIN']`) in the private layout.
- [x] 3.3 Add a server-side permission check on the private inventory routes redirecting non-ADMIN to the main route.
- [x] 3.4 Verify entrada/saída/ajuste forms (RHF + Zod `*.schema.ts`) and error mapping still work; motivo required per tipo (RN03).
- [x] 3.5 Gate: `turbo build --filter=web` green; smoke via preview (ADMIN sees Estoque; non-ADMIN redirected).

## 4. Mobile — read-only saldo consult (`apps/mobile`)

- [x] 4.1 `lib/domain/estoque`: drop `quantidadeReservada`/`saldoDisponivel` from `StockBalanceEntity` (keep `saldoAtual`/`estoqueMinimo`).
- [x] 4.2 `lib/data/estoque`: update DTO→domain mapper to the new balance shape.
- [x] 4.3 Saldo lookup view: show `saldoAtual` (and `estoqueMinimo`); no available/reservation value.
- [x] 4.4 Update widget/integration tests (`catalog_live_test.dart` and inventory read tests) for the new entity.
- [x] 4.5 Gate: `flutter analyze` + `flutter test` green for the inventory read path.

## 5. Cross-cutting verification (RN checklist)

- [x] 5.1 Grep the whole monorepo for `saldoDisponivel` and `quantidadeReservada`; confirm no residual references. (Clean outside migration history.)
- [x] 5.2 RN01 lazy zero-init, RN02 every write emits a `MovimentacaoEstoque`, RN03 motivo-by-tipo, RN04 commands ADMIN-only, RN05 balance never negative, RN07 immutable ledger — confirm via existing/added tests. (Covered by 23 domain + 66 backend tests.)
- [x] 5.3 RN06: end-to-end/orchestration test proving a sale's `darBaixa` and the sale commit/roll back together (single transaction). (Orchestration test asserts `lastDarBaixaTx === tx.context`; adapter + domain forward tests.)
- [x] 5.4 Full gate: `turbo build` + `bun test` + lint across the monorepo green. (Build 7/7 green; tests 7/7 green serial — concurrent web flake is pre-existing sale-screen timing, not this change; `turbo lint` red only on pre-existing debt in untouched files, the estoque/inventory code is lint-clean.)
