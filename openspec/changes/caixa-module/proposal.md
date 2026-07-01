## Why

The PDV has no cash-drawer control: operators cannot open a cash session with a float, register manual cash movements (sangria/suprimento), or close the drawer with a counted amount and a divergence report. The `vendas` module also needs a way to attach each finished sale to the operator's open session and record a `VENDA` cash movement. This change introduces the `caixa` aggregate as the source of truth for cash sessions and exposes a port for `vendas` to consume — mirroring how `estoque` exposes `inventory-sales-port`.

## What Changes

- New domain aggregate `SessaoCaixa` (root) + `MovimentacaoCaixa` in `modules/caixa`, with pure business rules, value validation, and domain errors.
- Write use cases: `abrir-caixa`, `fechar-caixa` (computes divergence), `registrar-sangria`, `registrar-suprimento`.
- Read use cases / queries: `caixa-aberto-do-operador`, `resumo-sessao` (expected-balance formula), `listar-movimentacoes`.
- Provider contracts: `CaixaRepository`, `CaixaQuery`, and a **cash port** exposed to `vendas` (`caixaAbertoDoOperador`, `registrarVenda`).
- Backend: NestJS controllers (`/caixa/*`), In/Out DTOs, Prisma persistence (`Decimal` money), a **partial unique index** enforcing one `ABERTO` session per operator, transactional sale-registration, and the adapter that implements the port `vendas` declares.
- Web (Next.js): screens for cash status, open, active session, and close (with live expected/counted/divergence), Zod + RHF forms, API error mapping.
- Mobile (Flutter): domain/data/ui/app layers mirroring the same entities, use cases, `Failure` codes, and close-with-divergence flow.
- Invariants enforced everywhere: at most one open session per operator; no close while a sale is still `ABERTA` in the session; `VENDA` movements only enter via `vendas`.

No breaking changes — this is purely additive (`caixa` has no dependencies; `vendas` will later consume the new port).

## Capabilities

### New Capabilities

- `cash-session-management`: Domain core of the cash session — `SessaoCaixa`/`MovimentacaoCaixa` entities, value validation, write/read use cases, expected-balance formula, invariants, and domain error codes (`CASH_SESSION_ALREADY_OPEN`, `CASH_SESSION_NOT_FOUND`, `CASH_SESSION_ALREADY_CLOSED`, `PENDING_SALE_IN_SESSION`).
- `cash-session-api`: Backend HTTP surface, DTOs, Prisma persistence with `Decimal` money and the partial-unique-index invariant, transactional movement creation, and error→HTTP status mapping.
- `cash-sales-port`: Port exposed by `caixa` and consumed by `vendas` — `caixaAbertoDoOperador(usuarioId)` and `registrarVenda(sessaoId, valor)` (creates a `VENDA` movement); sale-driven movements are never a public route.
- `web-cash-session`: Web PDV screens and forms for opening, operating, and closing a cash session, with live divergence and API error handling.
- `mobile-cash-session`: Flutter (Clean Architecture / MVVM) cash-session feature mirroring backend invariants, error codes, and the close-with-divergence flow.

### Modified Capabilities

<!-- None. `caixa` is additive and has no direct dependencies; the future `vendas` consumption is via the new cash-sales-port. -->

## Impact

- **New module**: `modules/caixa` (domain), `apps/backend/src/modules/caixa` (NestJS + Prisma), `apps/frontend/src/modules/caixa` (Next.js), Flutter `lib/{domain,data,ui,app}` cash-session feature.
- **Prisma schema**: new `prisma/models/caixa.model.prisma` (`SessaoCaixa`, `MovimentacaoCaixa`), versioned SQL migration with partial unique index on `operadorId WHERE status = ABERTO`, `prisma generate`.
- **Composition roots**: wire `CaixaModule`; expose the cash port for `VendasModule` to bind later.
- **Cross-module contract**: `vendas` → `caixa` via the cash port (read open session, register `VENDA` on sale finish — RF-CX-05). No other module depends on `caixa`.
- **Shared formula**: `esperado = abertura + suprimentos + vendas_em_dinheiro − sangrias`, kept consistent across backend/web/mobile.
