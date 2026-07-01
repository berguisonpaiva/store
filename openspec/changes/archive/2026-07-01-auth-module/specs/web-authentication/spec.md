## ADDED Requirements

### Requirement: Role-gated navigation items

The system SHALL filter admin sidebar navigation by the session user's role so that role-restricted items are rendered only for permitted roles. The **Usuários** item MUST appear only when the session role is `ADMIN`. This hiding is a UX reinforcement, not a security boundary — the backend `RolesGuard` remains authoritative (RN04/RN07).

#### Scenario: ADMIN sees the Usuários item

- **WHEN** an authenticated `ADMIN` opens a `(private)` page
- **THEN** the sidebar renders the **Usuários** navigation item linking to the users-management route

#### Scenario: OPERADOR does not see the Usuários item

- **WHEN** an authenticated `OPERADOR` opens a `(private)` page
- **THEN** the sidebar does not render the **Usuários** item

#### Scenario: Hidden item is not a security control

- **WHEN** an `OPERADOR` navigates directly to the users API or route despite the item being hidden
- **THEN** access is still denied by the backend guard (and by the route's on-load redirect), not merely by the missing menu entry
