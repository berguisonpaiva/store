## Context

`apps/web` is Next.js 16 (App Router, simple layout) with NextAuth wired (`web-auth`): `(private)`/`(public)` groups, `proxy.ts` guard, `lib/http` authenticated client, `PrivateShell` with `NAVIGATION_SECTIONS`. Forms use React Hook Form; list state uses `nuqs`; toasts use `sonner`. The inventory API (`estoque-backend`) exposes command endpoints (entrada/saída/ajuste) and query endpoints (saldo/movimentações/abaixo-do-mínimo) under `/api/inventory/...`. The variação search/lookup by SKU/nome was established by catalog-web. This change adds the inventory management UI — **frontend only**.

## Goals / Non-Goals

**Goals:**

- Inventory routes under `(private)`, guarded by the existing proxy.
- Three stock operation forms (Entrada, Saída Manual, Ajuste de Saldo) with variação lookup, RHF + Zod validation, and Server Action submission.
- Three read screens: consultar saldo (saldoAtual + saldoDisponivel), histórico de movimentações (filtro de período, paginado via `nuqs`), alertas de estoque mínimo.
- Server reads via `lib/http` (Bearer); mutations via Server Actions; backend error codes → field/toast.
- Follow `config-new-module` (web module layout), `config-frontend-layout` (nav), and `frontend-form-schema` (forms/Zod/Server Actions).

**Non-Goals:**

- No backend/mobile, no PDV/sale-driven exit (server-side `EstoquePort`, not a UI command), no catalog management screens, no deletion (immutable ledger; correction via Ajuste de Saldo).

## Decisions

### 1. Module + routes layout

Inventory UI lives in `src/modules/estoque/**` (components, `data/` server functions + Server Actions, `schemas/` Zod), with thin route files under `app/(private)/inventory/**` rendering the module pages (per `config-new-module`). Folder convention mirrors catalog-web's English route segment (`products` → `inventory`). Navigation entries are added non-destructively to `NAVIGATION_SECTIONS` in `private-shell.tsx`.

### 2. Reads on the server, mutations via Server Actions

Read screens are Server Components calling `apiJson` (Bearer from `auth()`). Entrada/Saída/Ajuste are Server Actions calling the backend with `apiFetch`, then `revalidatePath` of the affected saldo/movimentações reads. This keeps tokens server-side and matches the project's Server-Action preference.

### 3. List state in the URL with `nuqs`

For the movement history, `variacaoId`, `from`/`to` (period), `page`, and `pageSize` are URL search params (typed via `nuqs`), so the list is shareable and back/forward friendly.

### 4. Variação lookup reuse

All three forms and the saldo screen select a `variacaoId` via the SKU/nome search component/pattern catalog-web established (combobox-backed lookup), avoiding a second implementation.

### 5. Forms with Zod

Per the project's `frontend-form-schema` skill, each form has a `*.schema.ts` (Zod) consumed via `zodResolver`: Entrada (`quantidade > 0`, `motivo` enum COMPRA/DEVOLUCAO/AJUSTE), Saída (`quantidade > 0`, `motivo` enum PERDA/AJUSTE; `≤ saldo` checked client-side from the loaded saldo and authoritatively by the backend), Ajuste (`novoSaldo ≥ 0`, `observacao` required). The backend remains the source of truth.

### 6. Error mapping

Server Actions inspect the backend response: 409 `ESTOQUE_INSUFICIENTE` → field error on quantidade (Saída) or toast; 404 `VARIACAO_NAO_ENCONTRADA` → field error on the variação selector; 400 `QUANTIDADE_INVALIDA` → field error on quantidade/novoSaldo or form-level toast. Field errors inline, submission errors as `sonner` toasts (per `frontend-form-schema`).

## Risks / Trade-offs

- [Saída `≤ saldo` can race with concurrent movements] → client check is advisory; the backend `ESTOQUE_INSUFICIENTE` is authoritative and mapped to the field.
- [Variação lookup coupling to catalog-web] → reuse the shared lookup component/pattern; if it lives inside the catalog module, lift the reusable part rather than forking.
- [Next 16 specifics] → consult `node_modules/next/dist/docs` for Server Actions / `revalidatePath` before coding (per AGENTS.md).

## Migration Plan

1. Add `src/modules/estoque` (data + components + schemas).
2. Add routes under `(private)/inventory`.
3. Register the “Estoque” navigation section/items.
4. Implement reads (`apiJson`) + Server Actions (mutations + error mapping).
5. `next build` green; manual verify against the running backend.

Rollback: remove the estoque module, the inventory routes, and the nav entries.

## Open Questions

- Period filter granularity for movimentações (date range vs. preset windows)?
- Whether the saldo screen and the three forms share one combined page with tabs or stay as separate routes (default: separate routes per operation, one read hub).
