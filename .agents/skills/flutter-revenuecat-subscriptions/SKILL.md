---
name: flutter-revenuecat-subscriptions
description: Use this skill whenever implementing, planning, or reviewing RevenueCat subscriptions in Flutter with `purchases_flutter` or `purchases_ui_flutter`: SDK configuration, offerings, packages, purchases, restore, CustomerInfo, entitlements, paywalls, Customer Center, login/logout identity, DI, core wrappers, domain subscription contracts, data repositories, paywall UI, and subscription testing. Trigger for RevenueCat, purchases_flutter, subscriptions, paywall, entitlement, restore purchase, CustomerInfo, Offering, Package, RevenueCatUI, or subscription monetization in Flutter.
---

# Flutter RevenueCat Subscriptions

Use this skill to integrate RevenueCat in a Flutter Clean Architecture project without leaking SDK calls through UI, domain, or unrelated layers.

## Bundled Resources

- Read `references/revenuecat-architecture.md` before planning or implementing RevenueCat.
- Read `references/revenuecat-checklist.md` before reviewing a RevenueCat implementation.
- Read `references/source-map.md` to see which Context7 libraries and project rules informed this skill.
- Use `agents/revenuecat-specialist.md` when delegating a RevenueCat-only planning or review pass.

## Documentation Gate

RevenueCat APIs change. Before writing production code against `purchases_flutter` or `purchases_ui_flutter`, query Context7 for the current API.

Prefer these Context7 library IDs:

- `/revenuecat/purchases-flutter` for the Flutter SDK.
- `/websites/pub_dev_purchases_ui_flutter` for RevenueCat Paywalls and Customer Center UI.

As of the Context7 lookup used to create this skill:

- SDK setup uses `PurchasesConfiguration` or `AmazonConfiguration`, then `Purchases.configure(configuration)`.
- Current purchase flow should prefer `Purchases.purchase(PurchaseParams.package(package))` over older `purchasePackage`.
- `Purchases.getOfferings()` fetches `Offerings`.
- `Purchases.getCustomerInfo()` returns `CustomerInfo`.
- Active entitlement can be checked through `customerInfo.entitlements.active.containsKey(entitlementKey)` or by reading `customerInfo.entitlements.all[entitlementKey]?.isActive`.
- `Purchases.restorePurchases()` restores purchases and returns/updates `CustomerInfo`.
- `Purchases.logIn(appUserID)` and `Purchases.logOut()` manage identity.
- `Purchases.addCustomerInfoUpdateListener(...)` listens for subscription state updates.
- `RevenueCatUI.presentPaywall(...)` from `purchases_ui_flutter` presents a hosted paywall and returns `PaywallResult`.
- `PaywallView` and `CustomerCenterView` are available UI widgets from `purchases_ui_flutter`.

Do not assume these APIs remain unchanged; re-check Context7 during implementation.

## Layer Placement

Use RevenueCat as infrastructure, not as business logic.

Recommended split:

```text
core/revenuecat/
  revenuecat_service.dart
  revenuecat_service_impl.dart
  revenuecat_exception.dart

domain/subscription/
  entities/
    subscription_status_entity.dart
    subscription_offering_entity.dart
    subscription_package_entity.dart
  repositories/
    subscription_repository.dart
  use_cases/
    watch_subscription_status_use_case.dart
    get_subscription_offerings_use_case.dart
    purchase_subscription_package_use_case.dart
    restore_subscription_use_case.dart
  errors/
    subscription_failure.dart

data/subscription/
  models/
  mappers/
  subscription_repository_impl.dart

app/di/
  subscription_module.dart

ui/features/subscription/
  paywall/
  customer_center/
```

If the app already has a monetization/subscription context name, follow that naming instead.

## Dependency Rules

- UI never imports `package:purchases_flutter` directly.
- Domain never imports RevenueCat SDK classes.
- Data maps SDK outputs to domain entities.
- Core wraps direct SDK calls.
- App DI registers concrete implementations.
- UI only talks to ViewModels/use cases and domain-friendly entities.

Allowed direct SDK imports:

- `core/revenuecat/*_impl.dart`
- `core/revenuecat/*_service.dart` if the interface intentionally exposes SDK-neutral abstractions only; prefer no SDK types in the interface.
- RevenueCat hosted UI wrapper files if the app intentionally uses `purchases_ui_flutter` as a UI infrastructure adapter. Keep that wrapper isolated.

## Core Wrapper

Create a technical wrapper in `core/revenuecat/`.

The interface should expose app-neutral methods:

```dart
abstract interface class RevenueCatService {
  Future<void> configure(RevenueCatConfig config);
  Future<RevenueCatCustomerInfo> getCustomerInfo();
  Stream<RevenueCatCustomerInfo> watchCustomerInfo();
  Future<RevenueCatOfferings> getOfferings();
  Future<RevenueCatPurchaseResult> purchasePackage(String packageId);
  Future<RevenueCatCustomerInfo> restorePurchases();
  Future<RevenueCatCustomerInfo> logIn(String appUserId);
  Future<void> logOut();
}
```

Adapt names to the project. The key rule is that callers should not receive raw RevenueCat SDK classes unless the wrapper is intentionally local to data.

Implementation details:

- Set log level only by environment/config.
- Use platform-specific API keys from secure build config or app config, never hardcoded in feature UI.
- Use `PurchasesConfiguration(apiKey)` for normal stores and `AmazonConfiguration(apiKey)` only for Amazon Appstore.
- Set `appUserID` when the app has authenticated identity.
- Let RevenueCat complete purchases by default unless there is a deliberate advanced server-side purchase flow.
- Convert `PlatformException` and SDK-specific errors into a core/data Exception.

## Domain Model

Domain should model subscription meaning, not RevenueCat objects.

Examples:

```text
SubscriptionStatusEntity
- isActive
- activeEntitlementIds
- expirationDate
- willRenew
- managementUrl

SubscriptionOfferingEntity
- id
- packages

SubscriptionPackageEntity
- id
- title
- description
- priceText
- period
```

Use value objects when product IDs, entitlement IDs, or package IDs have validation/meaning.

Failures:

- `SubscriptionUnavailableFailure`
- `PurchaseCancelledFailure`
- `PurchaseFailedFailure`
- `RestoreFailedFailure`
- `EntitlementMissingFailure`
- `SubscriptionUnknownFailure`

Treat user cancellation as a non-destructive outcome. Do not show scary error copy for voluntary cancellation.

## Use Cases

Recommended use cases:

```text
GetSubscriptionStatusUseCase
WatchSubscriptionStatusUseCase
GetSubscriptionOfferingsUseCase
PurchaseSubscriptionPackageUseCase
RestoreSubscriptionUseCase
SyncRevenueCatUserUseCase
LogOutRevenueCatUserUseCase
```

Return types:

- One-shot operations use `Future<Either<Failure, T>>`.
- CustomerInfo updates can be `Stream<SubscriptionStatusEntity>`.
- Do not use `Stream<Either<Failure, T>>` by default; use stream `onError` and map failures in the ViewModel.

## Data Repository

`SubscriptionRepositoryImpl`:

- Calls the core `RevenueCatService`.
- Converts RevenueCat/core DTOs to domain entities.
- Converts technical Exceptions to domain Failures.
- Handles empty offerings and missing entitlement as explicit domain outcomes.
- Does not expose SDK types.

Mapping rules:

- Entitlement IDs are business configuration; keep them in app/domain config, not scattered through UI.
- Package IDs and offering IDs should be compared through constants/config/value objects.
- Price display strings can come from RevenueCat package/store metadata, but UI copy around purchase value must remain localized.

## UI and Paywalls

For custom paywalls:

- UI uses ViewModel/use cases.
- ViewModel fetches offerings and emits states.
- View renders domain `SubscriptionPackageEntity`.
- Purchase button calls ViewModel.
- Restore action is visible and accessible.
- Terms/privacy links are present where required.
- Loading, empty offering, purchase in progress, success, cancellation, and failure states are explicit.

For RevenueCat hosted paywalls with `purchases_ui_flutter`:

- Wrap `RevenueCatUI.presentPaywall(...)`, `PaywallView`, or `CustomerCenterView` in a small adapter/route.
- Keep hosted UI calls out of feature business ViewModels when possible.
- Interpret `PaywallResult` and refresh `CustomerInfo` afterward.
- Do not hide close, restore, terms, or privacy affordances in a way that creates dark-pattern risk.

Customer Center:

- Use `CustomerCenterView` or a wrapper route when the app needs subscription management support.
- Keep account-management entry points discoverable from settings/paywall.

## Identity

Use anonymous RevenueCat IDs only when the app has no auth identity.

When app auth exists:

- Call `Purchases.logIn(appUserID)` after authentication.
- Refresh subscription state after login.
- Call `Purchases.logOut()` on app logout if the product needs to detach the current user.
- Decide how anonymous purchases are handled during account creation before implementation.

Never use email, phone, or raw personal data as app user ID unless the privacy model explicitly allows it. Prefer stable backend user IDs.

## Startup and Performance

RevenueCat configuration may touch platform SDKs. Avoid turning startup into a blocking chain unless subscription state is required for the initial route.

Guidelines:

- Configure early enough before purchase/paywall use.
- Do not fetch offerings in `build()`.
- Do not block first frame on offerings unless the first screen is the paywall.
- Cache last known subscription status locally only if the product accepts temporary stale state.
- Add loading/error states instead of assuming RevenueCat is instant.

## Testing

Test by layer:

- Domain use cases with fake `SubscriptionRepository`.
- Repository implementation with fake `RevenueCatService`.
- ViewModel with fake use cases.
- Paywall View with fake ViewModel and domain package entities.

Do not hit real stores, real RevenueCat projects, or live API keys in unit/widget tests.

Test scenarios:

- Active entitlement.
- No active entitlement.
- Empty offerings.
- Purchase success.
- User-cancelled purchase.
- Purchase failure.
- Restore success with entitlement.
- Restore success without entitlement.
- Restore failure.
- CustomerInfo update listener emits new status.

## Review Checklist

- No RevenueCat SDK imports in domain.
- No RevenueCat SDK imports in custom UI/ViewModels.
- Core wrapper isolates SDK calls.
- Data maps SDK output into domain entities.
- Entitlement IDs are centralized.
- Purchase uses current non-deprecated API after Context7 check.
- Restore purchase is visible in paywall/account flows.
- User cancellation is not treated as a scary error.
- Startup does not block unnecessarily.
- Tests cover entitlement active/inactive, purchase, restore, and empty offerings.
