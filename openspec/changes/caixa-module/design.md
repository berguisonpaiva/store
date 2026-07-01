## Context

The Atos Store monorepo already ships an `estoque` (inventory) vertical that establishes the house pattern: a framework-free domain in `modules/*`, a NestJS+Prisma backend in `apps/backend/src/modules/*`, Next.js web in `apps/frontend/src/modules/*`, and a Flutter client, with cross-module integration done through an explicit port (`inventory-sales-port` / `EstoquePort`). The `caixa` (cash session) module is the PDV's cash-drawer control and is the natural counterpart to `estoque` for the upcoming `vendas` module: a sale needs both a stock exit (estoque port) and a cash entry (caixa port).

`caixa` has **no direct dependencies**. The only cross-module relationship is `vendas → caixa`, which must go through a port — never through public cash routes. This change is purely additive.

## Goals / Non-Goals

**Goals:**
- Model `SessaoCaixa` (aggregate root) + `MovimentacaoCaixa` as pure domain in `modules/caixa`, with `Result`-based validation and four domain error codes.
- Enforce the core invariants in code and at the database level: one `ABERTO` session per operator, no close with a pending sale, `VENDA` movements only via the port.
- Provide the expected-balance formula `esperado = abertura + suprimentos + vendas_em_dinheiro − sangrias` as the single shared contract across backend, web, and mobile.
- Expose a clean port (`caixaAbertoDoOperador`, `registrarVenda`) for `vendas`, mirroring `inventory-sales-port`.
- Deliver web (Next.js) and mobile (Flutter) flows that can be built in parallel once the API is contracted.

**Non-Goals:**
- Implementing the `vendas` module itself (it only declares the port it needs; binding happens here, consumption later).
- Multi-currency, multi-drawer-per-operator, or partial/blind-close reconciliation workflows.
- Reporting/analytics dashboards beyond the single-session `resumo`.
- Changing any existing `estoque`/`auth` behavior.

## Decisions

### D1 — Aggregate boundary: SessaoCaixa owns MovimentacaoCaixa
`MovimentacaoCaixa` has no independent lifecycle; it only exists inside a session and is always created through a session operation or the port. We keep it inside the `caixa` aggregate rather than as a separate aggregate so invariants (session must be `ABERTO`, movement `valor > 0`) are enforced in one consistency boundary.
- _Alternative considered_: separate ledger aggregate like `MovimentacaoEstoque`. Rejected because cash movements are not an independent immutable ledger consumed elsewhere — they are scoped to one session's reconciliation.

### D2 — Money as Decimal end-to-end
Monetary values use Prisma `Decimal` in persistence and are validated as non-negative/positive in the domain. No `float` anywhere. Domain holds values in a precise numeric VO; DTOs expose `number` at the HTTP edge only.
- _Rationale_: divergence math (`contado − esperado`) must be exact; float drift would create phantom divergences.

### D3 — Invariant "one open session per operator" enforced twice
The `abrir-caixa` use case checks for an existing `ABERTO` session, **and** a partial unique index `operadorId WHERE status = ABERTO` backs it at the DB level.
- _Rationale_: the use-case check alone loses to a race (two concurrent opens). The index is the authoritative guard; the use-case check gives a clean `CASH_SESSION_ALREADY_OPEN` for the common case, and a unique-violation is mapped to the same error.
- _Alternative considered_: serialize via app-level lock. Rejected — the partial index is simpler, DB-native, and correct under concurrency.

### D4 — Cross-module integration via a port owned-by-consumer
`vendas` declares the port in its own `provider/`; the `caixa` backend supplies an adapter delegating to use cases. `registrarVenda` and `caixaAbertoDoOperador` are the only surface. There is no public `registrar-venda` route.
- _Rationale_: matches the established `inventory-sales-port` pattern, keeps `caixa` from depending on `vendas`, and keeps sale-driven cash entries out of the public API.

### D5 — Transactional movement + balance change
Any operation that creates a movement runs inside `runInTransaction` / `TransactionManager`, so a failure rolls back atomically with no orphan movement. `registrarVenda` in particular writes the `VENDA` movement transactionally.

### D6 — Pending-sale check is the close gate
`fechar-caixa` consults sale state (via the integration the `vendas` side exposes) and returns `PENDING_SALE_IN_SESSION` when a sale is still `ABERTA`. The exact mechanism (port callback vs. query) is finalized when `vendas` lands; for this change the domain treats "has pending sale" as an injected predicate so it is testable with a fake.

### D7 — Read side via CaixaQuery (CQRS-lite)
`resumo-sessao`, `caixa-aberto-do-operador`, and `listar-movimentacoes` go through a `CaixaQuery` projection, separate from `CaixaRepository`, following the `inventory-balance-queries` split. This keeps the expected-balance aggregation out of the write model.

### D8 — Shared formula, three implementations, one source of truth
The expected-balance formula is specified once (spec) and implemented in backend (authoritative, returned by `/resumo`), web (live close preview), and mobile (live close preview). Web/mobile recompute only for instant UX; the backend value is authoritative on submit.

## Risks / Trade-offs

- **Pending-sale coupling to an unbuilt `vendas` module** → Model the check as an injected predicate/port now; bind the real source when `vendas` lands. Domain tests use a fake, so the invariant is covered without `vendas`.
- **Formula duplicated across three clients drifting** → Single spec scenario as the contract; backend value is authoritative on submit so a client-side drift can only mislead the live preview, never the stored result.
- **Partial unique index portability** → Targeted at the project's Postgres (Prisma); the migration is hand-written SQL. Mitigation: keep the use-case check so behavior degrades gracefully if the index is ever absent in a non-prod DB.
- **Decimal at the HTTP/DTO edge** → DTOs expose `number`; ensure serialization rounds to 2 decimals and parsing rebuilds the Decimal to avoid reintroducing float error at the boundary.
- **Parallel web/mobile work before API freeze** → Gate parallelism on the controller/DTO contract (this design + cash-session-api spec); both clients code against the documented routes/DTOs, not the implementation.

## Migration Plan

1. Land the domain (`modules/caixa`) first — entities, use cases, contracts, error codes — with full unit tests (blocking for all other layers).
2. Add Prisma models + versioned SQL migration (including the partial unique index) and run `prisma generate`; implement the `*.prisma.ts` adapter and the cash port adapter; wire `CaixaModule`.
3. Build web and mobile in parallel against the frozen API contract.
4. Rollback: the change is additive and isolated; drop `CaixaModule` wiring and revert the migration (no existing data depends on `caixa`).

## Open Questions

- Final mechanism for the pending-sale gate (D6): does `caixa` query `vendas`, or does `vendas` block the close before delegating? Resolve when `vendas` is designed.
- Permission model granularity for who may open/close vs. register sangria/suprimento — assumed "authenticated operator" for now; confirm against the staff-authentication roles.
