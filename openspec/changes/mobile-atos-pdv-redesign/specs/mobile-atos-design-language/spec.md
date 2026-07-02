## ADDED Requirements

### Requirement: Atos brand tokens

The system SHALL define the Atos brand design tokens in `lib/ui/theme/` as the single source of color for the PDV: ink `#15171C`, canvas `#F6F6F3`, surface `#FFFFFF`, hairline `#E2E2DC`, muted text `#71757C`/`#9A9DA6`, primary blue `#2347D9`, success green `#0E8A5F`, danger red `#D23B3B`, and warning amber `#B8730A`. Screens and components MUST consume these tokens rather than hard-coded colors.

#### Scenario: Tokens are the source of color

- **WHEN** a PDV screen or shared component needs a brand color
- **THEN** it reads the value from the Atos token set in `lib/ui/theme/` and does not inline a raw hex literal

### Requirement: Typography pairing

The system SHALL provide an Atos typography scale pairing **Hanken Grotesk** (display/body, weights 400–800) for text with **IBM Plex Mono** for SKUs, barcodes, and monetary/numeric figures, exposed through the theme's text styles.

#### Scenario: Fonts registered and applied

- **WHEN** the app builds its theme
- **THEN** Hanken Grotesk and IBM Plex Mono are registered families and the theme exposes text styles that use them for body/display and monospace figures respectively

### Requirement: Money and numeric figure components

The system SHALL provide reusable components for rendering monetary values and quantities with tabular (fixed-width) numerals so amounts align in carts, totals, and summaries.

#### Scenario: Money renders tabular

- **WHEN** a monetary value is rendered by the money component
- **THEN** it uses tabular-numeric figures and the mono figure style so digits align vertically in lists and totals

### Requirement: Shared PDV primitives

The system SHALL provide shared Atos UI primitives reused across the PDV screens — an ink header/app bar, rounded (12–16px) card container, a session status chip (aberto/fechado), and a primary action button — so screens compose from a consistent kit.

#### Scenario: Primitives available and reused

- **WHEN** `lib/ui/` is inspected after the redesign
- **THEN** the Atos header, card, status chip, and primary button primitives exist and are used by the PDV screens instead of ad-hoc containers
