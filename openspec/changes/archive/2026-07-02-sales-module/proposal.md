## Why

The `sales` module (PDV: `cash-session`/caixa + `venda`) already exists in the **domain** (`modules/sales/src/{cash-session,venda}`) and **backend** (`apps/backend/src/modules/sales`, with a nested `cash-session/`) layers, in Portuguese and keyed by `variacaoId`, orchestrating `inventory` (baixa/estorno) and `catalog` (variation price/active). But it has no rules of record in OpenSpec and it drifted from the intended RN: the caixa aggregate uses **English-ish vocabulary** (`StatusSessaoCaixa = {ABERTO, FECHADO}`, `CASH_SESSION_ALREADY_OPEN`…) instead of the repo's Portuguese convention; **owner/admin scoping (RN02/RN03/RN04) is not enforced** (no `NAO_E_DONO_DO_CAIXA`/`ACESSO_NEGADO`, no ADMIN list-all); the **pending-sale guard is a stub** (`StubPendingSalePredicate`), so closing a caixa with an open sale is not actually blocked; and the **`CaixaPort` is under-specified** — it lacks `isSessaoAberta`/`estornarVenda` and a `tx?` on `registrarVenda`, so the gateway adapter reaches into the repository directly and RN09's single transaction cannot flow through the sealed port. The **web** (ADMIN "Caixas" panel) and **mobile** (PDV core) layers do not exist yet. This change captures the RN as specs and reconciles the code — keeping the rich model already built, not rebuilding it.

## What Changes

- **Adopt the rich `venda` lifecycle as the rule of record.** Confirm `ABERTA → CONCLUIDA | CANCELADA`, split payments (`Pagamento` child entity; concluding requires `Σ pagamentos == total`, else `PAYMENT_MISMATCH`), `Desconto` (VALOR/PERCENTUAL, capped at subtotal), sangria/suprimento, and cancel-with-estorno. The original "venda imutável / uma forma de pagamento" doc is superseded; only `CONCLUIDA` is immutable, `ABERTA` is mutable, `CANCELADA` reverses (RN11).
- **BREAKING (internal vocabulary): rename the caixa aggregate to Portuguese.** `StatusSessaoCaixa = {ABERTA, FECHADA}`; `CaixaError = {CAIXA_NAO_ENCONTRADO, CAIXA_JA_ABERTO, CAIXA_JA_FECHADO, NAO_E_DONO_DO_CAIXA, ACESSO_NEGADO, VENDA_PENDENTE_NO_FECHAMENTO, VALOR_INVALIDO}`. Venda errors stay English (`SALE_NOT_FOUND`, `PAYMENT_MISMATCH`, …) per the module contract.
- **Enforce owner/admin scoping (RN02/RN03/RN04).** Only the owner opens/closes/moves a caixa (`NAO_E_DONO_DO_CAIXA`); an operator's reads are scoped to their own sessions/sales (`ACESSO_NEGADO` on cross-access); ADMIN sees all via a new `GET /caixa` (`@Papeis(ADMIN)`) listing.
- **Make the pending-sale guard real.** Replace `StubPendingSalePredicate` with a `PendingSalePredicate` backed by vendas, so `fechar-caixa` fails with `VENDA_PENDENTE_NO_FECHAMENTO` when the session has an `ABERTA` sale (RN blocked-close).
- **Complete the sealed `CaixaPort` and thread the transaction (RN09).** Add `isSessaoAberta(id)` and `estornarVenda(sessaoId, valor, tx?)`, and add `tx?` to `registrarVenda`, so the `CaixaGateway` adapter goes through the port and `finalizar`/`cancelar` commit the sale + stock baixa/estorno + caixa movement in **one** transaction; a failure rolls back / reverses everything.
- **Complete the HTTP error mapper** for the renamed `CaixaError` codes (409/422 for conflicts, 403 for owner/access, 404 for not-found, 400/422 for invalid input) alongside the existing `VendaError` codes.
- **Confirm the Prisma model + RN01 index.** `SessaoCaixa`, `MovimentacaoCaixa`, `Venda`, `ItemVenda`, `Pagamento` exist; ensure the **partial unique index `UNIQUE(operadorId) WHERE status='ABERTA'`** (RN01) is present in a migration (enum value rename touches its predicate).
- **Web (new): ADMIN read-only "Caixas" panel.** Sidebar entry + page guard (RN04); list all sessions with operator/period/status filters; session detail with abertura/fechamento, sangrias/suprimentos, the automatic resumo (RN05), and linked sales.
- **Mobile (new): PDV core.** Abrir caixa (blocked if one is open, RN01) with valor de abertura; sangria/suprimento; PDV (lookup variation, build items, apply discount, split payments, finalize with stock baixa RN09, cancel with estorno); fechar caixa showing the automatic resumo (RN05) with pending-sale block; history of the operator's own sessions/sales (RN03).

## Capabilities

### New Capabilities
- `cash-session-management`: caixa aggregate — abrir/fechar with automatic resumo (RN05), sangria/suprimento, one-open-per-operator (RN01), owner-only writes (RN02), closed-session immutability (RN06), blocked-close on pending sale.
- `sale-lifecycle`: venda aggregate — `ABERTA → CONCLUIDA | CANCELADA`, items (priced from the active variation, RN10), discount, split payments with `Σ pagamentos == total` (RN12), `CONCLUIDA` immutability (RN11).
- `sale-cash-stock-transaction`: the orchestration ports (`CaixaGateway`/`EstoqueGateway` bound to `CaixaPort`/`EstoquePort`) that finalize/cancel a sale by moving stock and cash in a single transaction (RN07/RN08/RN09).
- `cash-session-api`: backend HTTP surface for caixa (CQRS commands/queries) with owner/admin scoping and error mapping.
- `sale-api`: backend HTTP surface for vendas (CQRS commands/queries) with owner/admin scoping and error mapping.
- `web-cash-session-admin`: ADMIN-only web "Caixas" panel — list/filter all sessions and view session detail with resumo and linked sales (read-only, RN04).
- `mobile-pdv`: mobile PDV — abrir/fechar caixa with resumo, sangria/suprimento, sell (items/discount/split payments/finalize/cancel), and own-history (RN01/RN03/RN05/RN09).

### Modified Capabilities
<!-- none — sales only *consumes* the existing `inventory-sales-port` (`darBaixa`/`estornar`/`validarSaldoDisponivel`); that consumption is specified in `sale-cash-stock-transaction`. The inventory port's own rules are owned by the `inventory-module` change, so no delta is created here to avoid an overlapping modification. -->
- _None._

## Impact

- **Domain** `modules/sales/src/cash-session`: rename `StatusSessaoCaixa` (`ABERTA/FECHADA`) and `CaixaError` codes; extend `CaixaPort` (`isSessaoAberta`, `estornarVenda`, `registrarVenda(tx?)`); real `PendingSalePredicate`; owner/access checks in `fechar/sangria/suprimento` and read use cases; jest mocks/tests.
- **Domain** `modules/sales/src/venda`: confirm lifecycle/split-payment/discount invariants and cover RN09 rollback, RN11 write-block, `PAYMENT_MISMATCH` in orchestration tests. Barrels to `modules/sales/src/index.ts`.
- **Backend** `apps/backend/src/modules/sales` (+ `cash-session/`): rename propagation in adapters/DTOs; new `GET /caixa` (ADMIN); wire the real pending-sale predicate (vendas→caixa binding); route `finalizar`/`cancelar` through `TransactionManager` with `tx` reaching both gateways; owner/role scoping from JWT (`@CurrentUser`, `@Papeis`); `shared/errors/domain-error.mapper.ts` for `CaixaError`; `prisma/models/{caixa,vendas}.model.prisma` + migration (RN01 partial unique index on `status='ABERTA'`).
- **Web** `apps/web`: sidebar/nav "Caixas" (ADMIN) + private-shell guard; `(private)/caixas/**` list + detail pages; read schemas / query-string filters.
- **Mobile** `apps/mobile`: new `lib/domain/{caixa,venda}` + `lib/data/{caixa,venda}` + PDV/caixa UI (MVVM), get_it modules, routes; widget/integration tests.
- **Shared**: `@repo/shared` `TransactionManager`/`TransactionContext` already present; `AuthenticatedUser` role context reused.
