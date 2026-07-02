## Why

The Flutter `apps/mobile` app runs on a generic Material 3 theme (seed `#3B6EF5`) and exposes an operator-plus-management surface (stock entry/exit/adjustment, product admin, caixa history) that no longer matches the product direction. The "Atos Store" design brief defines the mobile app as a focused **Operador PDV** — a counter/point-of-sale experience with a distinct visual identity (dark header, light canvas, IBM Plex Mono figures, blue/green/red accents) and a specific 9-screen flow. We want the mobile layout to follow that reference while staying bound to the **real backend routes** already shipped (`auth`, `caixa`, `vendas`, `variations`, `inventory` balance), so the redesign is visual and structural only — not a new API contract.

## What Changes

- Introduce the **Atos design system** in `lib/ui/theme` — fixed brand palette (ink `#15171C`, canvas `#F6F6F3`, blue `#2347D9`, green `#0E8A5F`, red `#D23B3B`, amber `#B8730A`), Hanken Grotesk display/body + IBM Plex Mono for SKUs/money, rounded (12–16px) cards, tabular-numeric money widgets. Light-first (drop the generic dark scheme as the default).
- Restructure the operator PDV screens/flow to mirror the prototype's 9 surfaces, keeping current ViewModels/Cubits and backend calls:
  - **Login** (M01), **Abrir caixa** with fundo-de-troco chips (M02).
  - **Caixa hub** home — session status card, "Nova venda" primary CTA, shortcuts to caixa atual / vendas do caixa / fechar (new hub layout).
  - **Nova venda** (M03, principal) — sticky search + scan, product results, cart with qty steppers, inline desconto, sticky totals bar, stock-shortage guard.
  - **Pagamento** (M04) — payment-method grid, amount input with "Restante", split payments, pago/restante/troco summary.
  - **Recibo / Confirmação** (M05) — success receipt with items, totals, payments, troco (new screen).
  - **Sangria / Suprimento** (M06), **Fechar caixa** (M07) with esperado/divergência card, **Resumo da sessão** (M08).
  - **Consulta de produto** (M09) — read-only price + stock lookup.
- **BREAKING**: Remove the non-PDV mobile surfaces per the Operador-only scope — stock entry/exit/adjustment write screens, product admin (create/edit), low-stock and standalone inventory-movements admin screens, and caixa history browsing. Their routes are dropped from the mobile router.
- Trim the GoRouter route table to the operator PDV surface and add the new `recibo` and `resumo` routes.

## Capabilities

### New Capabilities

- `mobile-atos-design-language`: The Atos-branded visual identity as an explicit capability — brand tokens, typography pairing (Hanken Grotesk + IBM Plex Mono), money/tabular-numeric and SKU components, card/header/status-chip primitives shared across the PDV screens.

### Modified Capabilities

- `mobile-design-system`: Replace the generic seed-based Material 3 theme (light + dark) with the Atos brand tokens and typography; the base theme becomes light-first with the fixed brand palette rather than a derived scheme.
- `mobile-pdv`: Restructure the operator PDV UI/flow to match the prototype — caixa hub home, redesigned nova-venda/pagamento screens, new recibo and resumo-da-sessão surfaces, and the fechar-caixa divergência card — all wired to the existing `caixa` and `vendas` routes.
- `mobile-product-catalog`: Reduce the mobile catalog UI to a read-only "Consulta de produto" lookup (price + saldo) matching M09; remove product admin (create/edit) screens from the mobile surface.
- `mobile-inventory-movements`: **BREAKING** — remove the stock entry/exit/adjustment write screens from the mobile UI surface; operators no longer perform stock writes on mobile.
- `mobile-inventory-balance`: Fold balance consultation into the read-only product lookup; remove the standalone low-stock and inventory-movements admin screens from the mobile surface.
- `mobile-composition-root`: Trim the GoRouter route table to the operator PDV surface (login, caixa hub, venda, pagamento, recibo, sangria/suprimento, fechar, resumo, consulta) and drop the inventory-write / product-admin / caixa-history routes.

## Impact

- **Code**: `apps/mobile/lib/ui/theme/*` (new tokens/typography/components), `apps/mobile/lib/ui/{auth,caixa,vendas,catalog,home}/*` (restyled + restructured screens/widgets), `apps/mobile/lib/ui/inventory/*` (removed), `apps/mobile/lib/ui/catalog/*` (reduced to consulta), `apps/mobile/lib/app/router/app_router.dart` (route table), `apps/mobile/lib/app/di/ui_module.dart` (deregister removed screens' ViewModels).
- **Fonts/assets**: Add Hanken Grotesk and IBM Plex Mono font families to `pubspec.yaml` and `assets/fonts/`.
- **Backend**: No changes — the redesign consumes the existing `auth`, `caixa`, `vendas`, `variations`, and `inventory` balance routes as-is.
- **Domain/Data**: Contracts stay; only inventory-write and product-admin *UI* is removed. Unused domain/data for removed screens may remain until a later cleanup change.
- **Tests**: Widget tests for removed screens deleted; new/updated widget tests for the redesigned PDV screens and design-system components.
