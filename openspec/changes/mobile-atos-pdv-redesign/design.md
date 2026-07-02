## Context

`apps/mobile` is a Flutter Clean-Architecture app (domain/data/ui/app) already wired to the backend via a shared `HttpClient`, with get_it DI and GoRouter. Its UI runs on a generic seed-derived Material 3 theme and exposes both operator (PDV/caixa/vendas) and management (inventory writes, product admin, caixa history) surfaces.

The "Atos Store" design brief redefines the mobile app as a focused **Operador PDV** with a distinct visual identity and a 9-screen flow. The stakeholder decisions for this change are: **(1) Operador-PDV only** — remove non-PDV screens; **(2) design system + layout** — introduce the Atos design system *and* restructure screen layout/flow to match the prototype, while keeping current ViewModels/Cubits, use cases, and backend routes.

The backend already exposes every route the flow needs: `POST /auth/login`; `caixa` (`abrir`, `:id/fechar`, `:id/sangria`, `:id/suprimento`, `aberto`, `minhas`, `:id/resumo`, `:id/vendas`); `vendas` (create, `:id/itens`, `:id/desconto`, `:id/pagamentos`, `:id/finalizar`); `variations/by-sku|by-barcode`; and `inventory/variations/:id/balance`. No backend change is in scope.

## Goals / Non-Goals

**Goals:**
- Establish an explicit Atos design system (`mobile-atos-design-language`) — brand tokens, Hanken Grotesk + IBM Plex Mono typography, tabular money components, and shared PDV primitives (ink header, card, status chip, primary button).
- Rebuild the operator PDV screens to the prototype layout/flow: login, abrir caixa, caixa hub, nova venda, pagamento, recibo, sangria/suprimento, fechar caixa (divergência), resumo da sessão, consulta de produto.
- Reduce the mobile surface to the operator PDV by removing inventory-write, product-admin, standalone inventory-read, and cross-session history screens/routes.
- Keep domain/data contracts and backend integration unchanged; the change is UI + routing only.

**Non-Goals:**
- No backend/API changes, no new endpoints, no data-model changes.
- No changes to the web or admin surfaces.
- No deletion of domain/data code for removed screens (only the UI + routes are removed; unused contracts may be pruned in a later cleanup change).
- No dark theme for the operator PDV (light-first Atos theme only).
- Not a rewrite of ViewModels/Cubits or navigation semantics beyond the route-table trim and the two new screens (recibo, hub).

## Decisions

### D1 — Add an explicit design-system capability rather than folding tokens into `mobile-design-system`
The Atos identity (fixed palette, font pairing, money/SKU components, shared primitives) is a reusable kit that several screens depend on. Modeling it as its own capability (`mobile-atos-design-language`) keeps the base `mobile-design-system` requirement focused on "there is a theme" and lets screens reference concrete tokens/components. *Alternative considered:* extend only `mobile-design-system` — rejected because it conflates "a theme exists" with the concrete brand contract that screens must consume.

### D2 — Light-first theme, drop the default dark scheme
The brief is a single light palette with deliberate ink/canvas contrast; supporting a derived dark scheme would fight the fixed brand colors. Decision: build the Material 3 `ColorScheme`/`TextTheme` directly from Atos tokens, light only. *Alternative:* keep dual light/dark — rejected as unnecessary scope for a counter app with a fixed identity.

### D3 — Keep logic, restructure presentation
Reuse existing Cubits/use cases/repositories. The redesign changes widgets, screen composition, and navigation targets, plus adds two presentation-only screens (caixa hub, recibo). The venda/pagamento/fechar Cubits already expose the state (cart, totals, payments, resumo, divergência) the new layouts need. *Alternative:* "reescrita de fluxo" (full VM/nav rewrite) — explicitly declined by the stakeholder to limit risk.

### D4 — Caixa hub as the initial authenticated route
The prototype's landing surface for an open session is a hub (session card + Nova venda CTA + shortcuts). Route the authenticated operator to the hub; gate "Nova venda" and session actions on an open session (from `GET /caixa/aberto`), showing the "sem caixa aberto" empty state otherwise. This replaces the current home/menu as the operator entrypoint.

### D5 — Fold balance + consulta into one read-only screen
M09 "Consulta de produto" shows price *and* stock. Rather than a separate inventory saldo screen, the consulta screen resolves a variation (catalog `by-sku`/`by-barcode`) and displays its balance via the inventory read repository as a stock badge. Standalone inventory-read screens (saldo lookup, movement history, low-stock) are removed. *Alternative:* keep a dedicated saldo screen — rejected; redundant with consulta on a counter app.

### D6 — Bundle fonts as app assets
Hanken Grotesk and IBM Plex Mono ship as bundled font assets declared in `pubspec.yaml` (no runtime Google Fonts fetch) so the PDV renders offline and deterministically at the counter.

### D7 — Remove screens by deleting UI + deregistering, not by feature-flag
Removed surfaces (inventory writes, product admin, history) have their pages/widgets/ViewModels deleted from `lib/ui/*`, their routes removed from `app_router.dart`, and their UI registrations removed from `ui_module.dart`. Domain/data stay. This keeps the mobile surface honestly scoped rather than hiding dead screens behind flags.

## Risks / Trade-offs

- **Removing screens breaks existing widget tests / references** → Delete or update the affected widget tests in the same change; run `flutter analyze` + `flutter test` to catch dangling imports and unregistered dependencies before completion.
- **Prototype invents UI the backend must support (split payment, desconto, troco, divergência)** → Verified against routes: `:id/pagamentos`, `:id/desconto`, `:id/finalizar`, and `:id/resumo` already exist; troco/divergência are client-side computations over existing data, so no gap.
- **Dropping dark theme could regress accessibility for some users** → Accept for the counter use case; ensure the light palette meets contrast (ink `#15171C` on canvas `#F6F6F3`, muted text ≥ 4.5:1 for body).
- **Pruning UI while leaving unused domain/data** → Accept temporarily; note the orphaned inventory-write/product-admin contracts for a follow-up cleanup change so they don't rot silently.
- **Font licensing/size** → Hanken Grotesk (OFL) and IBM Plex Mono (OFL) are open-licensed; bundle only the weights used (400/500/600/700/800 + mono 400/500/600) to keep APK size in check.

## Migration Plan

1. Add fonts + Atos tokens/typography/components (`mobile-atos-design-language`, `mobile-design-system`); no screen changes yet — app still builds.
2. Rebuild PDV screens surface-by-surface (login → abrir → hub → venda → pagamento → recibo → sangria → fechar → resumo → consulta), each reusing its existing Cubit.
3. Trim the router and `ui_module.dart`; delete removed pages/widgets/ViewModels and their tests.
4. Update/add widget tests + design-system component tests; run `flutter analyze` and `flutter test`.
5. Rollback: revert the change branch — no data/backend migration is involved, so rollback is code-only.

## Open Questions

- Exact font weights to bundle vs. app-size budget — resolve during implementation by using only the weights the screens reference.
- Whether "vendas do caixa" on the hub should paginate for very long sessions — default to the resumo's full list unless volume proves it needs paging.
