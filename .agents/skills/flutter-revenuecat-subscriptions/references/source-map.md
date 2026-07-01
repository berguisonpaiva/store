# Source Map

This skill was created from current documentation fetched through Context7 on 2026-06-11.

Context7 libraries used:

- `/revenuecat/purchases-flutter`
  - `PurchasesConfiguration`
  - `AmazonConfiguration`
  - `Purchases.configure`
  - `Purchases.getOfferings`
  - `Purchases.getCustomerInfo`
  - `Purchases.purchase(PurchaseParams.package(package))`
  - `Purchases.restorePurchases`
  - `Purchases.logIn`
  - `Purchases.logOut`
  - `Purchases.addCustomerInfoUpdateListener`
  - `CustomerInfo`
  - `Offerings`
  - `PurchaseResult`
  - entitlement checks through `customerInfo.entitlements.active` and `customerInfo.entitlements.all`

- `/websites/pub_dev_purchases_ui_flutter`
  - `RevenueCatUI.presentPaywall`
  - `PaywallResult`
  - `PaywallView`
  - `CustomerCenterView`

Local methodology sources:

- `.claude/rules/layer-core.md`
- `.claude/rules/layer-domain.md`
- `.claude/rules/layer-data.md`
- `.claude/rules/layer-app.md`
- `.claude/rules/layer-ui.md`
- `.claude/rules/architecture.md`
- `.claude/rules/anti-patterns.md`
- `.claude/agents/anr-specialist.md`
- `.claude/agents/marketing.md`
- `.claude/context/project.md`

Re-query Context7 before implementation because RevenueCat APIs can change.
