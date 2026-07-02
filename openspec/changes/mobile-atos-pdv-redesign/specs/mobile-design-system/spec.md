## MODIFIED Requirements

### Requirement: Material 3 theme with tokens and dark mode

The system SHALL provide the base theme in `lib/ui/` as a **light-first** Material 3 theme built from the fixed **Atos brand tokens** (see `mobile-atos-design-language`) rather than a generic seed-derived scheme. The theme SHALL apply the Atos color tokens and the Hanken Grotesk + IBM Plex Mono typography as its `ColorScheme` and `TextTheme`. A separate dark theme is no longer required for the operator PDV; the app runs on the light Atos theme.

#### Scenario: Atos light theme produced

- **WHEN** the app builds its theme
- **THEN** a light Material 3 theme is produced from the Atos brand tokens and typography, and the app renders the PDV on that theme

#### Scenario: No generic seed scheme

- **WHEN** the theme is inspected
- **THEN** it derives its colors from the Atos tokens (ink/canvas/blue/green/red/amber), not from a single generic seed color
