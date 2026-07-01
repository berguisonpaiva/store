## Why

With the inventory rules (`estoque-domain`) and API (`estoque-backend`) in place, the web admin still has no way to move or inspect stock. `estoque` is the heart of the MVP — it owns `saldoAtual` — and the operator needs screens to register entries/exits, correct balances by inventory, and consult on-hand/available balance, movement history, and low-stock alerts. This change adds the **inventory module to `apps/web`** (Next.js, simple layout), behind the existing NextAuth session, calling the backend with the authenticated HTTP client. No backend or mobile work.

## What Changes

- Add an **inventory area** under the `(private)` group: stock operations (Entrada de Estoque, Saída Manual, Ajuste de Saldo) and read screens (saldo por variação, histórico de movimentações, alertas de estoque mínimo).
- **Stock operation forms** (React Hook Form + Zod): each picks a `variacaoId` via SKU/nome search (the lookup pattern catalog-web established), validates client-side, and submits via **Server Actions** calling the command endpoints (`/api/inventory/entrada`, `/saida`, `/ajuste`).
  - Entrada: `quantidade > 0`, `motivo` COMPRA/DEVOLUCAO/AJUSTE, optional `observacao` (RF-EST-01).
  - Saída Manual: `quantidade > 0` e `≤ saldo`, `motivo` PERDA/AJUSTE, optional `observacao` (RF-EST-02, RF-EST-05).
  - Ajuste de Saldo: `novoSaldo ≥ 0`, `observacao` obrigatória (justificativa) (RF-EST-04).
- **Read screens**: consultar saldo (`saldoAtual` + `saldoDisponivel`) por variação; listar movimentações (`listar-movimentacoes`, filtro de período, paginado via `nuqs`); listar variações abaixo do mínimo (`listar-abaixo-do-minimo`).
- **Data layer**: server-side `apiFetch`/`apiJson` (existing `lib/http`, Bearer da sessão) for reads; **Server Actions** for the three mutations, mapping backend error codes (409 `ESTOQUE_INSUFICIENTE`, 404 `VARIACAO_NAO_ENCONTRADA`, 400 `QUANTIDADE_INVALIDA`) to field/toast feedback.
- **Navigation**: register an “Estoque” section/items in the `(private)` shell `NAVIGATION_SECTIONS` (additive).
- **No deletion** in the UI — the ledger is immutable; corrections happen via Ajuste de Saldo.
- **Out of scope**: backend/mobile, the PDV/sale-driven exit (consumes `EstoquePort` server-side, not a UI command), and any catalog management screens.

## Capabilities

### New Capabilities

- `web-inventory-movements`: The `(private)` routes for stock operations — Entrada de Estoque, Saída Manual, and Ajuste de Saldo forms (RHF + Zod, variação lookup by SKU/nome), and the Server Actions that submit them and map backend error codes to field/toast feedback. (RF-EST-01, RF-EST-02, RF-EST-04, RF-EST-05)
- `web-inventory-balance`: The read screens — consult saldo (`saldoAtual` + `saldoDisponivel`) by variation, the movement history list (period filter, paginated via `nuqs`), the low-stock alerts list, and the server-side read data layer (`apiFetch`/`apiJson`). (RF-EST-06, RF-EST-07, RF-EST-08)

### Modified Capabilities

<!-- None — first inventory UI; navigation registration is additive. -->

## Impact

- **Depends on**: `estoque-backend` reachable at `NEXT_PUBLIC_API_URL`, and `web-auth` (session + `lib/http`).
- **Files**: `apps/web/src/app/(private)/inventory/**`, `apps/web/src/modules/estoque/**` (components, data, schemas), and an additive edit to `private-shell.tsx` navigation.
- **Reused**: shadcn/ui components, `lib/http` (Bearer), `nuqs`, React Hook Form + Zod, `sonner` toasts, and the variação search/lookup pattern from catalog-web.
- **No new heavy deps** (RHF/nuqs/sonner already present).
