## Why

Sales (PDV/online), purchasing, and replenishment all depend on knowing how much of each variation (SKU) is on hand — but no module owns stock today. `estoque` is the **heart of the MVP**: it owns `saldoAtual` and is the single source of truth for stock movement. This change delivers the **business rules only** (a self-contained domain module under `modules/*`), with no backend, persistence, web, or mobile wiring — establishing the contracts (ledger, commands, queries, ports, domain errors) that the API, the `vendas` module, and replenishment alerts will consume.

## What Changes

- Add a self-contained **`estoque`** domain module (`@repo/estoque`), 4-layer (`domain`/`application`/`presentation`/`infra`), CQRS (command+handler for writes, query+handler for reads).
- **`MovimentacaoEstoque`** — an **immutable ledger** entity (source of truth): `tipo` (ENTRADA/SAIDA), `motivo`, `quantidade`, `saldoResultante`, optional `origemVendaId`, `variacaoId`, timestamp. Enum `MotivoMovimentacaoEstoque`: `COMPRA`, `AJUSTE`, `DEVOLUCAO`, `VENDA_PDV`, `VENDA_ONLINE`, `PERDA`.
- **Fast-read fields on the variation**: `saldoAtual`, `quantidadeReservada`, `estoqueMinimo` (read projections kept by `estoque`; the `catalog` `VariacaoProduto` is read for `estoqueMinimo`).
- **Commands** (use cases): `registrar-entrada` (motivo COMPRA/DEVOLUCAO/AJUSTE), `registrar-saida` (motivo PERDA/AJUSTE), `ajustar-saldo` (set absolute balance for inventory correction, records the delta as a movement).
- **Single-transaction rule** (`EstoqueService` policy): every entry/exit (1) creates the `MovimentacaoEstoque` with `saldoResultante` and (2) updates the variation `saldoAtual` — both atomically or neither.
- **Queries**: `consultar-saldo` (saldoAtual + saldo disponível por variação), `listar-movimentacoes` (por variação/período), `listar-abaixo-do-minimo` (replenishment alerts).
- **Ports**: `EstoqueRepository` (ledger + saldo persistence contract) and `EstoqueQuery` (reads); plus the **exposed** `EstoquePort` with `darBaixa(variacaoId, qtd, origemVendaId)` and `estornar(...)` for the `vendas` module — the **sale-driven exit is NOT a public command**.
- **Invariants** (all in the domain, never the DB): `saldoAtual` never goes negative except via explicit `ajustar-saldo`; `saldoResultante = saldoAnterior ± quantidade`; sale-driven `darBaixa` validates available balance (`saldoAtual − quantidadeReservada`) before applying; `quantidade > 0`.
- **Domain errors**: `EstoqueInsuficiente`, `VariacaoNaoEncontrada`, `QuantidadeInvalida`.
- **Out of scope**: persistence/Prisma, HTTP/controllers, guards, UI/forms, and the `vendas` module itself (this only exposes `EstoquePort`).

## Capabilities

### New Capabilities

- `inventory-ledger`: The `MovimentacaoEstoque` immutable ledger, the `registrar-entrada` / `registrar-saida` / `ajustar-saldo` write commands, the single-transaction rule (ledger + `saldoAtual` together), the balance invariants and `saldoResultante` math, the `EstoqueRepository` write port, and the domain errors. (RF-EST-01..05)
- `inventory-balance-queries`: The read side — `consultar-saldo` (saldoAtual + saldo disponível), `listar-movimentacoes` (por variação/período), `listar-abaixo-do-minimo` (replenishment alert), and the `EstoqueQuery` port. (RF-EST-06..08)
- `inventory-sales-port`: The exposed `EstoquePort` (`darBaixa` / `estornar`) consumed by `vendas`, the available-balance validation (`saldoAtual − quantidadeReservada`) before a sale exit, and the rule that sale-driven exits are never a public command. (RF-EST-09)

### Modified Capabilities

<!-- None — new domain module. It reads catalog's `VariacaoProduto` but does not change catalog spec requirements. -->

## Impact

- **Dirs created**: `modules/estoque/**` (`@repo/estoque`) with `src/movimentacao/**` (`domain`/`application`/`presentation`/`infra`), `src/index.ts`, and `test/**`, following the `module-aggregate` scaffold convention.
- **Reused from `packages/shared`**: `Entity`, `Result`/`Either`, `UseCase`, repository/query base contracts, `PaginatedInputDTO`/`PaginatedResultDTO`, value objects (`Id`, `PositiveInteger`/`NonNegative`).
- **New module value objects**: `QuantidadeMovimentada` (> 0), `Saldo` (≥ 0), `SaldoResultante`; enums `TipoMovimentacao`, `MotivoMovimentacaoEstoque`.
- **Depends on**: `catalog-domain` applied (reads `VariacaoProduto` for `estoqueMinimo`); consumed later by `estoque-backend` (persistence + endpoints) and by the future `vendas` module via `EstoquePort`.
- **No runtime tech added**: pure TypeScript domain logic; no Prisma, no HTTP, no new env.
