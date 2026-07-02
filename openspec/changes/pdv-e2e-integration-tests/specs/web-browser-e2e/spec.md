## ADDED Requirements

Web browser e2e SHALL use Playwright driving the real Next.js UI in a real browser against the **live NestJS backend + `_test` Postgres** (same DB the backend e2e uses), started from the full-stack orchestration entrypoint. These tests exercise the admin console; they do not stub the API. They complement, not duplicate, the backend HTTP e2e — the browser layer verifies that real backend responses render correctly in the UI, including translated error messages.

### Requirement: Web browser e2e harness

The harness SHALL boot the backend (against `_test` Postgres, migrated + admin-seeded) and the Next.js web app, then run Playwright against the served UI. It SHALL be runnable from an empty database with one command, reuse the DB truncate + admin re-seed for isolation between specs, and never target a non-`_test` database.

#### Scenario: Full stack comes up for browser tests

- **WHEN** the web e2e command is run against an empty `_test` database
- **THEN** migrations apply, admin is seeded, backend and web start, and Playwright can load the app in a browser

#### Scenario: Isolation between browser specs

- **WHEN** two browser specs create the same-named entity in sequence
- **THEN** each starts from a truncated + admin-seeded database and neither sees the other's data

### Requirement: Web authentication and route guarding via the browser

The suite SHALL verify login, authenticated navigation, and redirect/guard behavior through the real UI against the live backend.

#### Scenario: Admin logs in through the UI

- **WHEN** the seeded admin signs in via the login screen
- **THEN** the browser lands on the authenticated area and the session persists across navigation

#### Scenario: Unauthenticated access redirects

- **WHEN** an unauthenticated browser opens a protected route directly
- **THEN** it is redirected to login

#### Scenario: Role-gated navigation hides admin-only areas

- **WHEN** a user without the required role views the console
- **THEN** admin-only menu items/routes are not accessible from the UI

### Requirement: Admin console CRUD flows via the browser

The suite SHALL drive the core admin management flows end-to-end through the UI against the live backend: users, categories, products+variations, and inventory views, and the cash-session admin view.

#### Scenario: Create an operador through the UI

- **WHEN** the admin creates a user with role OPERADOR via the users screen
- **THEN** the new user appears in the list and can subsequently authenticate

#### Scenario: Create category and product with variation through the UI

- **WHEN** the admin creates a category, then a product with a variation (price > 0)
- **THEN** both are persisted (confirmed via the real backend) and shown in their lists

#### Scenario: Inventory balance and movements render

- **WHEN** the admin opens the inventory balance/movements views for a variation with recorded movements
- **THEN** the current balance and the ledger are displayed from live backend data

#### Scenario: Cash-session admin view lists sessions

- **WHEN** the admin opens the cash-session admin view after an operator has opened/closed a session
- **THEN** the session(s) are listed with their status and summary

### Requirement: Translated error rendering in the browser

The suite SHALL verify that a real backend error code surfaces in the UI as its localized message (closing the loop with the i18n coverage guard), not as a raw code or generic crash.

#### Scenario: Duplicate category shows a translated message

- **WHEN** the admin tries to create a category whose name already exists (backend returns 409 `CATEGORY_ALREADY_EXISTS`)
- **THEN** the UI shows the localized error message, not the raw code or an unhandled error
