## ADDED Requirements

Mobile emulator e2e SHALL use Flutter `integration_test` running the real Flutter PDV app on an Android/iOS emulator against the **live NestJS backend + `_test` Postgres** (same DB the backend e2e uses), started from the full-stack orchestration entrypoint. These tests exercise the operator PDV flow through the real UI; they do not stub the API. The Android emulator reaches the host backend via `10.0.2.2` (iOS simulator via `localhost`), configured through the app's base-URL/env mechanism.

### Requirement: Mobile emulator e2e harness

The harness SHALL add the `integration_test` dev dependency and an `apps/mobile/integration_test/` entrypoint, boot the backend against `_test` Postgres (migrated + admin-seeded), point the app at the host backend via the correct emulator address, and run on a booted emulator/device. It SHALL be runnable from an empty database with one command and SHALL reset backend state (truncate + admin re-seed) between tests so runs are order-independent; it SHALL never target a non-`_test` database.

#### Scenario: App launches on emulator against live backend

- **WHEN** the mobile e2e command is run against an empty `_test` database with an emulator available
- **THEN** migrations apply, admin is seeded, the app installs/launches on the emulator, and it can reach the backend at the emulator host address

#### Scenario: No emulator available fails clearly

- **WHEN** the mobile e2e command runs with no booted emulator/device
- **THEN** it fails fast with a message telling the operator to start an emulator, rather than hanging or passing vacuously

#### Scenario: Order-independent runs

- **WHEN** the mobile e2e suite is run twice in a row
- **THEN** results are identical because backend state is reset between tests

### Requirement: Operator authentication on the emulator

The suite SHALL verify login through the real Flutter UI against the live backend, using an operator seeded/created for the run.

#### Scenario: Operator logs in through the app

- **WHEN** an operator signs in on the login screen
- **THEN** the app reaches the authenticated PDV home backed by a real token

#### Scenario: Invalid credentials show a translated message

- **WHEN** the operator submits wrong credentials (backend 401 `INVALID_CREDENTIALS`)
- **THEN** the app shows the localized error message, not a raw code

### Requirement: End-to-end PDV flow on the emulator

The suite SHALL drive the critical PDV operator flow through the real UI end-to-end against the live backend: open cash → look up a product (by sku/barcode) → add item(s) → apply a split payment → finalize → close cash, asserting the visible outcome at each step.

#### Scenario: Operator completes a sale through the UI

- **WHEN** the operator opens the cash, looks up a product, adds it to the sale, pays with a split (e.g. DINHEIRO + PIX) summing to the total, and finalizes
- **THEN** the app shows the sale concluded, and the underlying backend reflects decremented stock and a VENDA cash movement

#### Scenario: Operator closes cash with a correct summary

- **WHEN** the operator closes the cash session after the sale
- **THEN** the app shows the closing summary consistent with `saldoEsperado = abertura + dinheiro + suprimentos − sangrias`

### Requirement: Translated PDV error surface on the emulator

The suite SHALL verify that a real backend error during the PDV flow renders as its localized message in the app.

#### Scenario: Insufficient stock shows a translated message

- **WHEN** the operator tries to add/finalize an item beyond available stock (backend 422 `INSUFFICIENT_STOCK`)
- **THEN** the app shows the localized insufficient-stock message, not the raw code or a generic crash
