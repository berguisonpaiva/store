## 1. Atos design system

- [ ] 1.1 Add Hanken Grotesk (400/500/600/700/800) and IBM Plex Mono (400/500/600) to `apps/mobile/assets/fonts/` and declare both families in `pubspec.yaml`
- [ ] 1.2 Add Atos brand tokens in `lib/ui/theme/app_colors.dart` (ink `#15171C`, canvas `#F6F6F3`, surface `#FFFFFF`, hairline `#E2E2DC`, muted `#71757C`/`#9A9DA6`, blue `#2347D9`, green `#0E8A5F`, red `#D23B3B`, amber `#B8730A`)
- [ ] 1.3 Add Atos typography in `lib/ui/theme/app_typography.dart` (Hanken Grotesk text styles + IBM Plex Mono figure/SKU styles)
- [ ] 1.4 Rebuild `lib/ui/theme/app_theme.dart` as a light-first Material 3 theme built from the Atos tokens/typography (drop the seed-derived dark scheme as default)
- [ ] 1.5 Add money/quantity components (tabular-numeric) under `lib/ui/shared/widgets/` (e.g. `MoneyText`, `QtyText`)
- [ ] 1.6 Add shared PDV primitives under `lib/ui/shared/widgets/` — ink header/app bar, rounded card container, session status chip (aberto/fechado), and align `primary_button.dart` to the Atos style
- [ ] 1.7 `flutter analyze` passes and a smoke test renders the theme + a money component

## 2. Auth & cash-session screens

- [ ] 2.1 Restyle `lib/ui/auth/login_page.dart` to the M01 Atos layout (logo block, e-mail/senha, primary "Entrar")
- [ ] 2.2 Restyle `lib/ui/caixa/abrir_caixa_page.dart` to M02 — large currency input + fundo-de-troco quick chips; route to the hub on success
- [ ] 2.3 Restyle sangria/suprimento (`cash_movement_sheet.dart` / dedicated screen) to M06 — retirada/entrada toggle, value input, observação, movimentos do turno list
- [ ] 2.4 Restyle `lib/ui/caixa/fechar_caixa_page.dart` to M07 — counted-cash input + divergência card (abertura, vendas em dinheiro, esperado, divergência color-coded); keep `VENDA_PENDENTE_NO_FECHAMENTO` block
- [ ] 2.5 Restyle resumo da sessão (M08) — total vendido, nº de vendas, totals by payment form, session sales list, from the existing resumo Cubit

## 3. Caixa hub (new landing)

- [ ] 3.1 Build the caixa hub home screen reusing the caixa-status/home Cubit: ink session card (nº, hora abertura, total do turno, nº vendas, fundo), "Nova venda" primary CTA, shortcuts (caixa atual / vendas do caixa / sangria / fechar)
- [ ] 3.2 Implement the "sem caixa aberto" empty state with an "Abrir caixa" action when `GET /caixa/aberto` returns none
- [ ] 3.3 Wire "vendas do caixa" to the current session's sales (from `:id/vendas` / resumo), current-session only

## 4. Sale flow (venda → pagamento → recibo)

- [ ] 4.1 Rebuild `lib/ui/vendas/venda_pdv_view.dart` to M03 — sticky search + scan action, product results list, cart with qty steppers, inline desconto, sticky totals bar (subtotal/desconto/total)
- [ ] 4.2 Add the per-line stock-shortage indicator that disables finalize (surface `INSUFFICIENT_STOCK`)
- [ ] 4.3 Rebuild pagamento (`finalizar_venda_view.dart`) to M04 — payment-method grid, amount input with "Restante" helper, add/remove split payments, pago/restante/troco summary; surface `PAYMENT_MISMATCH`
- [ ] 4.4 Build the recibo / venda-concluída screen (M05) — success check, sale nº + date, item lines, total, payments, troco, with "Nova venda" and "Ver resumo" actions; add its route and navigate on finalize
- [ ] 4.5 Verify cancel-restores-stock path still works with the new screens

## 5. Consulta de produto (read-only)

- [ ] 5.1 Rebuild `lib/ui/catalog/variation_lookup_page.dart` as the M09 "Consulta de produto" — single search (name/SKU/barcode), results with name, SKU (mono), price (tabular), stock badge; `AppToast` on not-found
- [ ] 5.2 Display the variation's `saldoAtual` (+`estoqueMinimo`) as the stock badge via the inventory read repository
- [ ] 5.3 Remove the standalone products list/detail pages (`products_page.dart`, `product_detail_page.dart`) and their Cubits/tests

## 6. Trim mobile surface to Operador PDV

- [ ] 6.1 Delete inventory-write UI: `stock_entry_page.dart`, `stock_exit_page.dart`, `stock_adjustment_page.dart`, `inventory_menu_page.dart`, their Cubits/states and widgets
- [ ] 6.2 Delete standalone inventory-read UI: `balance_lookup_page.dart`, `movements_page.dart`, `low_stock_page.dart` and their Cubits/states
- [ ] 6.3 Delete cross-session caixa history UI: `caixa_history_page.dart` (+ Cubit/state) and `vendas_history_page.dart` (+ Cubit/state); keep current-session views
- [ ] 6.4 Update `lib/app/router/app_router.dart` — route table limited to login, hub (initial authenticated), abrir, venda, pagamento, recibo, sangria, fechar, resumo, consulta; remove deleted routes
- [ ] 6.5 Update `lib/app/di/ui_module.dart` — deregister the deleted screens' ViewModels; keep only PDV-surface registrations
- [ ] 6.6 Remove now-orphaned l10n strings/keys and navigation entries for deleted screens

## 7. Verification

- [ ] 7.1 `flutter analyze` passes with no dangling imports or unused-route warnings
- [ ] 7.2 Update/add widget tests for the redesigned screens (login, abrir, hub, venda, pagamento, recibo, fechar, resumo, consulta) and design-system components; delete tests for removed screens
- [ ] 7.3 `flutter test` passes
- [ ] 7.4 Manual smoke on device/emulator: login → abrir caixa → nova venda (search/scan, cart, desconto) → pagamento (split, troco) → recibo → sangria → resumo → fechar (divergência); confirm each hits the existing backend routes
