## ADDED Requirements

### Requirement: Password stored in a separate table

The system SHALL persist users with the password hash in a dedicated table separate from the user record. The Prisma schema MUST define a `User` table and a one-to-one `UserPassword` table holding the hash, and the repository adapter MUST write/read both inside a single transaction.

#### Scenario: Schema separates credentials

- **WHEN** `apps/backend/prisma/models/users.model.prisma` is inspected
- **THEN** there is a `User` model and a separate one-to-one `UserPassword` model that holds the password hash, with no plain-text password column anywhere

#### Scenario: Atomic write across both tables

- **WHEN** a user is created or has its password changed
- **THEN** the adapter writes the `User` row and the `UserPassword` row within one transaction so they never diverge

### Requirement: Users repository adapter implements the domain contract

The system SHALL implement the domain `UserRepository` (from `@repo/auth`, including `findByEmail` and `countActiveByRole`) and the domain `UserQuery` (paginated listing) as Prisma adapters that map database rows to the `User` domain aggregate (`toDomain`) and the aggregate to persistence payloads (`fromDomain`), returning `Result` and never leaking ORM types into the domain.

#### Scenario: Mapping round-trip

- **WHEN** a user is saved and then loaded by id or email
- **THEN** the adapter reconstructs an equivalent `User` aggregate (with its `HashPassword`) via `toDomain`

#### Scenario: Read helpers feed domain decisions

- **WHEN** `findByEmail` or `countActiveByRole(MASTER)` is called
- **THEN** the adapter returns the data the domain policies use to enforce uniqueness and the last-active-MASTER rule, without enforcing those rules in SQL

### Requirement: Create user endpoint

The system SHALL expose `POST /api/users` that creates a staff user, protected so that only MASTER/ADMIN can call it, delegating to the `create-user` use case and returning the created user.

#### Scenario: Authorized creation

- **WHEN** a MASTER or ADMIN posts a valid name, email, password, and role to `POST /api/users`
- **THEN** the response is 201 with the created user and the password is stored only as a hash in `UserPassword`

#### Scenario: Duplicate email mapped to 409

- **WHEN** the use case returns `EMAIL_ALREADY_IN_USE`
- **THEN** the endpoint responds 409 Conflict

#### Scenario: Forbidden for OPERADOR

- **WHEN** an authenticated `OPERADOR` calls `POST /api/users`
- **THEN** the endpoint responds 403 Forbidden (mapped from `OPERATION_NOT_ALLOWED_FOR_ROLE`)

### Requirement: Edit user endpoint

The system SHALL expose `PATCH /api/users/:id` that updates a user's name, email, and role, restricted to MASTER/ADMIN, delegating to the `update-user` use case.

#### Scenario: Authorized edit

- **WHEN** a MASTER or ADMIN patches an existing user's fields with valid values
- **THEN** the response is 200 with the updated user

#### Scenario: Missing user mapped to 404

- **WHEN** the use case returns `USER_NOT_FOUND`
- **THEN** the endpoint responds 404 Not Found

### Requirement: Activate and deactivate endpoints

The system SHALL expose `PATCH /api/users/:id/activate` and `PATCH /api/users/:id/deactivate` delegating to the corresponding use cases, restricted to MASTER/ADMIN.

#### Scenario: Deactivate succeeds

- **WHEN** a user is deactivated while another active MASTER remains
- **THEN** the response is 200 and the user is inactive

#### Scenario: Last active MASTER blocked

- **WHEN** deactivating the only active MASTER returns `OPERATION_NOT_ALLOWED_FOR_ROLE`
- **THEN** the endpoint responds 403 Forbidden and the user stays active

### Requirement: Change password endpoint

The system SHALL expose `PATCH /api/users/:id/password` allowing a user to change their own password by providing the current and new password, delegating to the `change-password` use case.

#### Scenario: Successful change

- **WHEN** the current password matches and the new password is valid
- **THEN** the response is 204 and the new hash is persisted in `UserPassword`

#### Scenario: Wrong current password

- **WHEN** the current password does not match
- **THEN** the endpoint responds 400/401 and the stored hash is unchanged

### Requirement: List and fetch users endpoints

The system SHALL expose `GET /api/users` (paginated, optional filters by role and active) and `GET /api/users/:id`, backed by read-side query adapters, restricted to MASTER/ADMIN.

#### Scenario: Paginated, filtered listing

- **WHEN** a MASTER/ADMIN requests `GET /api/users?page=1&pageSize=20&role=OPERADOR&active=true`
- **THEN** the response is a paginated payload containing only matching users (no password hash in the payload)

#### Scenario: Fetch by id not found

- **WHEN** `GET /api/users/:id` targets a non-existent id (`USER_NOT_FOUND`)
- **THEN** the endpoint responds 404 Not Found

### Requirement: Users module wiring and documentation

The system SHALL provide a `UsersModule` that composes the domain use cases with the Prisma adapters and port implementations via DI, register it in `app.module.ts`, and document every endpoint with Swagger/OpenAPI (Scalar `/docs`, `/swagger`).

#### Scenario: Endpoints documented and reachable

- **WHEN** the backend boots
- **THEN** the users endpoints appear under the documented API with auth requirements, and resolve through the domain use cases (controllers contain no domain rules)

### Requirement: Initial MASTER seed

The system SHALL provide a technical seed that creates one active MASTER user (with a hashed password) so the API is usable on first run.

#### Scenario: Seed creates a usable admin

- **WHEN** the seed runs against an empty database
- **THEN** exactly one active MASTER user exists with its hash stored in `UserPassword`
