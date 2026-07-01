## Context

TurboRepo monorepo with a shared domain kernel in `packages/shared` (`Entity`, `Result`/`Either`, `UseCase`, repository/query base contracts, pagination DTOs, value objects). Business modules live under `modules/<module>` and are scaffolded by `module-aggregate`; `auth` and `catalog` set the precedent (one self-contained package per module, English naming, 4 layers `domain`/`application`/`presentation`/`infra`, CQRS). This change adds the `estoque` domain module — **business rules only**, no infrastructure. It is Sprint 4 and the heart of the MVP: `estoque` owns `saldoAtual` and is the single source of truth for stock movement. It reads `catalog`'s `VariacaoProduto` (for `estoqueMinimo`/`minStock`) and is later consumed by `vendas` via an exposed port.

## Goals / Non-Goals

**Goals:**

- Create `modules/estoque` (`@repo/estoque`) with a `movimentacao` aggregate (the immutable ledger) plus the per-variation balance projection, per `module-aggregate`.
- Express RF-EST-01..09 as use cases returning `Result<T>`, ports as interfaces, errors as stable codes.
- **Enforce every invariant in the domain** (VO → entity → policy → use case); never rely on the DB.
- Model the single-transaction rule (ledger + `saldoAtual` together) as a port contract so the data layer can implement it atomically.
- Expose `EstoquePort` (`darBaixa`/`estornar`) for `vendas` without making sale-driven exits public commands.
- In-memory fakes + unit tests for every use case and invariant.

**Non-Goals:**

- No Prisma/persistence, HTTP/controllers, guards, UI/forms.
- No `vendas` module (only expose `EstoquePort` for it to call later).
- No changes to `catalog` domain rules (only reads `VariacaoProduto`).

## Decisions

### 1. Single `estoque` module, `movimentacao` aggregate + balance projection

Mirrors `auth`/`catalog`: one self-contained package. `src/movimentacao/` holds the `MovimentacaoEstoque` ledger entity and an `EstoqueSaldo` projection (per `variacaoId`: `saldoAtual`, `quantidadeReservada`, `estoqueMinimo`). Scaffold with `module-aggregate` (`--module estoque --aggregate movimentacao`).

- Alternative considered: model the balance as fields directly on catalog's `VariacaoProduto`. Rejected — `estoque` must **own** `saldoAtual`; catalog stays unaware of stock. `estoque` keeps its own fast-read projection keyed by `variacaoId`, seeded from catalog's `minStock`.

### 2. `MovimentacaoEstoque` is an immutable ledger (append-only)

The ledger is the source of truth; the balance is a derived fast-read. Movements are created with their `saldoResultante` and never edited or deleted — corrections are new movements (`ajustar-saldo` records the delta). `saldoResultante = saldoAnterior ± quantidade` is computed at creation and asserted in the entity.

- Alternative considered: store only the balance and mutate it. Rejected — loses auditability and the `saldoResultante` history needed for `listar-movimentacoes`.

### 3. Single-transaction rule as a repository port contract

`EstoqueRepository` exposes a transactional write (e.g. `aplicarMovimentacao(mov, novoSaldo)`) that persists the ledger entry and the new `saldoAtual` **atomically — both or neither** (RF-EST-03). The domain orchestrates; the data layer (later, in `estoque-backend`) implements it with `runInTransaction`. The use case computes `saldoResultante`/`novoSaldo` and hands both to the port in one call.

### 4. `EstoquePort` exposed to `vendas`; sale exits are not public commands

`vendas` removes stock for a sale **only** through the exposed `EstoquePort.darBaixa(variacaoId, qtd, origemVendaId)` / `estornar(...)`. There is no `registrar-saida-venda` public command. Internally `darBaixa` reuses the same single-transaction write, recording a `SAIDA` with motivo `VENDA_PDV`/`VENDA_ONLINE` and `origemVendaId`; `estornar` records a compensating `ENTRADA` linked to the same `origemVendaId`. This keeps cross-module communication to a single owned port.

### 5. Balance invariants live in a domain policy

- **Non-negative balance** → normal `registrar-saida`/`darBaixa` reject results that would go below 0 → `EstoqueInsuficiente`. Only `ajustar-saldo` may set an absolute value (still ≥ 0).
- **Available balance for sales** → `darBaixa` validates `saldoAtual − quantidadeReservada ≥ qtd` before applying → `EstoqueInsuficiente`.
- **Positive quantity** → `QuantidadeMovimentada` VO (`> 0`) → `QuantidadeInvalida`.
- **Variation exists / has a balance projection** → use cases check the projection/repository → `VariacaoNaoEncontrada`.

### 6. Module value objects and enums

Add `QuantidadeMovimentada` (integer `> 0`), `Saldo` (integer ≥ 0), `SaldoResultante` (integer ≥ 0 for normal flows), and enums `TipoMovimentacao` (`ENTRADA`/`SAIDA`) and `MotivoMovimentacaoEstoque` (`COMPRA`/`AJUSTE`/`DEVOLUCAO`/`VENDA_PDV`/`VENDA_ONLINE`/`PERDA`). Each command constrains the allowed `motivo` set (entry: COMPRA/DEVOLUCAO/AJUSTE; manual exit: PERDA/AJUSTE; port: VENDA_*). Reuse shared `Id`, `PositiveInteger`/`NonNegative` where they fit.

### 7. CQRS reads via `EstoqueQuery`

`consultar-saldo` (returns `saldoAtual` + `saldoDisponivel = saldoAtual − quantidadeReservada`), `listar-movimentacoes` (paginated, period filter), `listar-abaixo-do-minimo` (`saldoAtual < estoqueMinimo`) go through `EstoqueQuery` returning read DTOs — never the mutable entity.

### 8. Domain errors as stable string codes

`ESTOQUE_INSUFICIENTE`, `VARIACAO_NAO_ENCONTRADA`, `QUANTIDADE_INVALIDA`. Returned via `Result.fail(<CODE>)`; the API maps them to HTTP later.

## Skills to use

`module-aggregate` (scaffold), `module-value-object` (`QuantidadeMovimentada`/`Saldo`/`SaldoResultante` + enums), `module-entity` (`MovimentacaoEstoque` + `EstoqueSaldo` projection), `module-domain-service` (balance policy / available-balance validation), `module-repository` (`EstoqueRepository` transactional write + `EstoquePort`), `module-dto`, `module-query-cqrs` (`EstoqueQuery` reads), `module-use-case` (registrar-entrada/saida, ajustar-saldo, darBaixa/estornar).

## Risks / Trade-offs

- [Balance projection in `estoque` can drift from the ledger] → the single-transaction write keeps them in lockstep; `saldoResultante` lets a later job recompute/audit the balance from the ledger.
- [`estoqueMinimo` originates in catalog but is read here] → seed/sync the projection's `estoqueMinimo` from catalog's `minStock`; `estoque` treats it as a read input (no write back to catalog).
- [`quantidadeReservada` has no writer in this change] → reservations belong to `vendas`; for now it is a field on the projection (default 0) used only by available-balance math, with the reservation write deferred.
- [Concurrent movements on the same variation race on `saldoResultante`] → the transactional write must read-modify-write the balance under the same transaction (row lock); flagged for `estoque-backend`.

## Migration Plan

Greenfield. Scaffold `modules/estoque` (`movimentacao` aggregate), implement VOs/enums → `MovimentacaoEstoque` entity + `EstoqueSaldo` projection → balance policy → `EstoqueRepository`/`EstoqueQuery`/`EstoquePort` ports → DTOs → use cases (commands + queries + port operations), add in-memory fakes and unit tests, wire `src/index.ts` exporting the public commands, queries, and `EstoquePort`. Rollback = delete the module dir.

## Open Questions

- Should `EstoqueSaldo` (the per-variation balance projection) live in `estoque` (default chosen) or be added as fields on catalog's `VariacaoProduto`? Default: own it in `estoque`, seed `estoqueMinimo` from catalog.
- Is `quantidadeReservada` written in this change or deferred to `vendas`? Default: field present (default 0), reservation write deferred.
- `ajustar-saldo` direction when increasing: record as `ENTRADA`/AJUSTE vs. a dedicated adjustment type? Default: `ENTRADA`/`SAIDA` with motivo AJUSTE based on the delta sign.
