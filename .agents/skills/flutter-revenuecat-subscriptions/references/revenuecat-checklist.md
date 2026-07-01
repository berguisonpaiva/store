# RevenueCat Checklist

## Documentation

- Context7 was queried for current `purchases_flutter` API.
- Context7 was queried for current `purchases_ui_flutter` API if hosted paywalls/customer center are used.
- Deprecated purchase APIs are avoided when current API is available.

## Architecture

- `purchases_flutter` imports are isolated in core or a narrow adapter.
- Domain does not expose RevenueCat classes.
- Data maps SDK/core DTOs to domain entities.
- App DI registers service, repository, use cases, and ViewModels.
- Entitlement/offering/package identifiers are centralized in config/constants/value objects.

## Configuration

- Platform API keys are not hardcoded in UI.
- Debug logging is environment-gated.
- Amazon configuration is only used for Amazon Appstore builds.
- Identity strategy is defined: anonymous, authenticated, or hybrid.

## Purchase Flow

- Offerings are loaded outside `build()`.
- Empty offerings have a user-safe UI state.
- Purchase in progress disables duplicate taps.
- Purchase success refreshes subscription state.
- User cancellation is handled neutrally.
- Purchase failure maps to localized actionable copy.

## Restore and Account

- Restore purchase action is visible.
- Restore success with active entitlement updates UI.
- Restore success without entitlement is handled clearly.
- Restore failure maps to localized actionable copy.
- Customer Center/account management is reachable when supported.

## Startup and Performance

- RevenueCat configure does not unnecessarily block first frame.
- Offerings are not fetched during `build()`.
- CustomerInfo listener is cleaned up or scoped appropriately if the API requires it.
- Paywall has loading/error states.

## Testing

- Domain use cases tested with fake repository.
- Repository tested with fake RevenueCat service.
- ViewModel tested for active/inactive entitlement.
- Purchase success/cancel/failure covered.
- Restore success/no-entitlement/failure covered.
- Widget tests do not use live RevenueCat or store APIs.
