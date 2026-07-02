## ADDED Requirements

### Requirement: Every backend error code has pt and en translations

Every stable error code defined in the backend modules SHALL have a corresponding translation key in both `apps/mobile/lib/l10n/app_pt.arb` and `app_en.arb`, following the existing naming convention (e.g. `inventoryErrorInsufficientStock`). Missing keys SHALL be added in both locales and `app_localizations*.dart` regenerated via `flutter gen-l10n`.

The authoritative code list SHALL be extracted from: `modules/auth/src/user/errors/user-error.ts`, `modules/auth/src/auth/errors/auth-error.ts`, `modules/catalog/src/category/errors/category-error.ts`, `modules/catalog/src/product/errors/product-error.ts`, `modules/inventory/src/movimentacao/errors/estoque.error.ts`, `modules/sales/src/venda/errors/venda.error.ts`, and `modules/sales/src/cash-session/errors/caixa.error.ts`.

#### Scenario: Missing translation fails the guard

- **WHEN** a backend error code has no key in either `app_pt.arb` or `app_en.arb`
- **THEN** the i18n coverage guard fails and names the missing code and locale

#### Scenario: Newly added code is translated

- **WHEN** a new error code is introduced in any listed module
- **THEN** the guard requires a `pt` and `en` key before it can pass

### Requirement: Automated static i18n coverage guard

An automated check (Node script in the backend or Dart test) SHALL statically compare the extracted error-code list against the keys present in both `.arb` files and fail if any code is untranslated. The check SHALL be runnable in CI and SHALL list all gaps, not just the first.

#### Scenario: Guard runs green when complete

- **WHEN** every extracted code has both `pt` and `en` keys
- **THEN** the guard exits successfully

#### Scenario: Guard enumerates all gaps

- **WHEN** several codes are missing translations
- **THEN** the guard reports every missing (code, locale) pair in a single run

### Requirement: Mobile failure mappers cover every code with fallback

Each mobile failure mapper (`apps/mobile/lib/domain/*/errors/*_failure.dart`) and its datasource SHALL map every error code its context can receive to a specific `Failure`, with a generic fallback for unknown codes so an unmapped code never crashes the app.

#### Scenario: Known code maps to specific failure

- **WHEN** the mobile receives a known error code for a context
- **THEN** the mapper returns the context-specific `Failure`, not the generic fallback

#### Scenario: Unknown code falls back gracefully

- **WHEN** the mobile receives an unrecognized error code
- **THEN** the mapper returns the generic fallback `Failure` without throwing
