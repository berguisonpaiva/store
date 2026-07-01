# user-management-api Specification

## Purpose
TBD - created by archiving change auth-users-backend. Update Purpose after archive.
## Requirements
### Requirement: Password stored in a separate table

The system SHALL persist users with the password hash in a dedicated table separate from the user record. The Prisma schema MUST define a `User` table and a one-to-one `UserPassword` table holding the hash, and the repository adapter MUST write/read both inside a single transaction.

#### Scenario: Schema separates credentials

- **WHEN** `apps/backend/prisma/models/users.model.prisma` is inspected
- **THEN** there is a `User` model and a separate one-to-one `UserPassword` model that holds the password hash, with no plain-text password column anywhere

#### Scenario: Atomic write across both tables

- **WHEN** a user is created or has its password changed
- **THEN** the adapter writes the `User` row and the `UserPassword` row within one transaction so they never diverge

### Requirement: Users repository adapter implements the domain contract

The system SHALL implement the domain `UsersRepository` (from `@repo/auth`, including `findByEmail`, `findById`, `create`, `save`, and `list`) and the domain `UserQuery` (paginated listing) as Prisma adapters that map database rows to the `User` domain aggregate (`toDomain`) and the aggregate to persistence payloads (`fromDomain`), returning `Result` and never leaking ORM types into the domain.

#### Scenario: Mapping round-trip

- **WHEN** a user is saved and then loaded by id or email
- **THEN** the adapter reconstructs an equivalent `User` aggregate (with its `HashPassword`) via `toDomain`

#### Scenario: Read helpers feed domain decisions

- **WHEN** `findByEmail` is called
- **THEN** the adapter returns the data the domain policies use to enforce uniqueness, without enforcing that rule in SQL

### Requirement: Create user endpoint

The system SHALL expose `POST /api/users` that creates a staff user, protected so that only `ADMIN` can call it, delegating to the `create-user` use case and returning the created user.

#### Scenario: Authorized creation

- **WHEN** an `ADMIN` posts a valid name, email, password, and role to `POST /api/users`
- **THEN** the response is 201 with the created user and the password is stored only as a hash in `UserPassword`

#### Scenario: Duplicate email mapped to 409

- **WHEN** the use case returns `EMAIL_ALREADY_IN_USE`
- **THEN** the endpoint responds 409 Conflict

#### Scenario: Forbidden for OPERADOR

- **WHEN** an authenticated `OPERADOR` calls `POST /api/users`
- **THEN** the endpoint responds 403 Forbidden (blocked by `RolesGuard` + `@Papeis(ADMIN)`)

### Requirement: Edit user endpoint

The system SHALL expose `PATCH /api/users/:id` that updates a user's name, email, and role, restricted to `ADMIN`, delegating to the `update-user` use case.

#### Scenario: Authorized edit

- **WHEN** an `ADMIN` patches an existing user's fields with valid values
- **THEN** the response is 200 with the updated user

#### Scenario: Missing user mapped to 404

- **WHEN** the use case returns `USER_NOT_FOUND`
- **THEN** the endpoint responds 404 Not Found

### Requirement: Activate and deactivate endpoints

The system SHALL expose `PATCH /api/users/:id/activate` and `PATCH /api/users/:id/deactivate` delegating to the corresponding use cases, restricted to `ADMIN`. Deactivate MUST pass the authenticated actor id as `requesterId` so the domain can enforce cannot-deactivate-self.

#### Scenario: Deactivate succeeds

- **WHEN** an `ADMIN` deactivates a user other than themselves
- **THEN** the response is 200 and the user is inactive

#### Scenario: Cannot deactivate self blocked

- **WHEN** an `ADMIN` deactivates their own account and the use case returns `CANNOT_DEACTIVATE_SELF`
- **THEN** the endpoint responds 422 Unprocessable Entity and the user stays active (RN05)

### Requirement: List and fetch users endpoints

The system SHALL expose `GET /api/users` (paginated, optional filters by role and active/status) and `GET /api/users/:id`, backed by read-side query adapters, restricted to `ADMIN`.

#### Scenario: Paginated, filtered listing

- **WHEN** an `ADMIN` requests `GET /api/users?page=1&pageSize=20&role=OPERADOR&status=active`
- **THEN** the response is a paginated payload containing only matching users, each shaped as `{ id, name, email, role, status }` with no password hash (RN08)

#### Scenario: Fetch by id not found

- **WHEN** `GET /api/users/:id` targets a non-existent id (`USER_NOT_FOUND`)
- **THEN** the endpoint responds 404 Not Found

### Requirement: Users module wiring and documentation

The system SHALL provide a `UsersModule` that composes the domain use cases with the Prisma adapters and port implementations via DI, register it in `app.module.ts`, and document every endpoint with Swagger/OpenAPI (Scalar `/docs`, `/swagger`).

#### Scenario: Endpoints documented and reachable

- **WHEN** the backend boots
- **THEN** the users endpoints appear under the documented API with auth requirements, and resolve through the domain use cases (controllers contain no domain rules)

### Requirement: Initial ADMIN seed

The system SHALL provide a technical seed that creates one active `ADMIN` user (with a bcrypt-hashed password stored in `UserPassword`) so the API is usable on first run.

#### Scenario: Seed creates a usable admin

- **WHEN** the seed runs against an empty database
- **THEN** exactly one active `ADMIN` user exists with its hash stored in `UserPassword` and no plain-text password anywhere

