## ADDED Requirements

### Requirement: Material 3 theme with tokens and dark mode

The system SHALL provide a base design system in `lib/ui/` with a Material 3 theme, design tokens (colors, spacing, typography), and both light and dark themes.

#### Scenario: Themes available

- **WHEN** the app builds its theme
- **THEN** light and dark Material 3 themes are produced from shared tokens, and the app respects the selected/system theme mode

### Requirement: Shared widgets and feedback

The system SHALL provide base shared widgets and an `AppToast` (or equivalent) feedback helper in the `ui/` layer for reuse across features.

#### Scenario: Shared widgets present

- **WHEN** `lib/ui/` is inspected
- **THEN** a shared widgets area and an `AppToast` feedback helper exist and are usable from views

### Requirement: Localization base

The system SHALL set up the localization (l10n) infrastructure so user-facing strings can be localized.

#### Scenario: l10n configured

- **WHEN** the app is built
- **THEN** localization delegates/config are wired and at least one locale resolves
