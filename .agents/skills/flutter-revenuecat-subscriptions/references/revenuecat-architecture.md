# RevenueCat Architecture Reference

## Recommended Flow

```text
UI paywall/settings
  -> SubscriptionViewModel
  -> domain use case
  -> SubscriptionRepository interface
  -> data SubscriptionRepositoryImpl
  -> core RevenueCatService
  -> purchases_flutter / purchases_ui_flutter
```

## Layer Ownership

Core:

- Owns direct `Purchases` calls.
- Owns SDK configuration.
- Converts `PlatformException` into technical Exceptions.
- May expose SDK-neutral DTOs for data mapping.

Domain:

- Owns subscription business meaning.
- Owns repository contract and use cases.
- Owns subscription Failures.
- Does not know `CustomerInfo`, `Offerings`, `Package`, or `RevenueCatUI`.

Data:

- Implements domain repository.
- Maps core/SDK-neutral DTOs to domain entities.
- Converts technical Exceptions to Failures.

App:

- Registers service, repository, use cases, and ViewModels.
- Resolves platform API keys from config.
- Wires routes and paywall entry points.

UI:

- Renders custom paywall or opens hosted paywall through a wrapper.
- Shows restore action.
- Maps Failures to localized copy.
- Does not import `purchases_flutter`.

## Configuration

Keep configuration centralized:

```text
RevenueCatConfig
- iosApiKey
- androidApiKey
- amazonApiKey if supported
- entitlementIds
- defaultOfferingId if needed
- logLevel by environment
```

Use platform selection in app/core config. Do not scatter API keys or entitlement strings through feature widgets.

## Failure Model

Separate cancellation from failure:

```text
PurchaseCancelledFailure -> neutral UI, no error toast required
PurchaseFailedFailure    -> actionable localized error
RestoreFailedFailure     -> actionable localized error
EntitlementMissingFailure -> restore succeeded but no active entitlement
SubscriptionUnavailableFailure -> offerings unavailable
```

## Hosted vs Custom Paywall

Custom paywall:

- Best when design system, localization, analytics, and copy need full control.
- Requires mapping RevenueCat packages into domain/UI models.

Hosted RevenueCat paywall:

- Best when server-driven paywall iteration is more valuable.
- Keep `RevenueCatUI.presentPaywall` or `PaywallView` isolated in adapter/route code.
- Refresh `CustomerInfo` after a hosted paywall result.

## Identity

Anonymous:

- Good for no-auth apps.
- Must define migration behavior if auth is added later.

Authenticated:

- Call `logIn(appUserID)` after successful app login.
- Refresh CustomerInfo after login.
- Call `logOut()` on app logout when needed.

Hybrid:

- Decide anonymous-to-auth purchase transfer rules before shipping.
