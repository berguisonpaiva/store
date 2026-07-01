# user-management Specification

## Purpose
TBD - created by archiving change auth-users-domain. Update Purpose after archive.
## Requirements
### Requirement: User aggregate and roles

The system SHALL define a `User` aggregate in `modules/auth` (`@repo/auth`, aggregate folder `src/user`) with the fields name, email, password hash, role, and active flag, where role is a `UserRole` enum with exactly the values `ADMIN` and `OPERADOR`. The aggregate MUST be pure domain logic with no HTTP, database, or framework dependencies, reusing the shared value objects (`PersonName`, `Email`, `HashPassword`) and `Entity`/`Result` base.

#### Scenario: Valid user is created

- **WHEN** a `User` is built with a valid name, valid email, a password hash, a role, and active = true
- **THEN** the aggregate is created successfully and exposes its role as one of `ADMIN` or `OPERADOR`

#### Scenario: Invalid field is rejected

- **WHEN** a `User` is built with an invalid email or an invalid name
- **THEN** the creation returns a failed `Result` with the corresponding validation error and no aggregate is produced

#### Scenario: Unknown role is rejected

- **WHEN** a `User` is built with a role that is not `ADMIN` or `OPERADOR`
- **THEN** the creation returns a failed `Result` with `INVALID_ROLE` and no aggregate is produced

#### Scenario: Password is never plain text

- **WHEN** a `User` aggregate is inspected
- **THEN** it holds the password only as a `HashPassword` value object and never exposes or stores the plain-text password (RN08)

### Requirement: Create staff user

The system SHALL allow an `ADMIN` actor to create a staff user with name, email, password, and role, hashing the password through the `HashGenerator` port before persistence. Creation by an actor whose role is not `ADMIN` MUST be rejected.

#### Scenario: Authorized creation succeeds

- **WHEN** an `ADMIN` requests creation of a staff user with a unique email and valid fields
- **THEN** the password is hashed via `HashGenerator`, the user is persisted via `UsersRepository`, and a success `Result` with `{ userId }` is returned (RN04)

#### Scenario: Unauthorized actor is blocked

- **WHEN** an actor whose role is `OPERADOR` requests creation of a user
- **THEN** the use case returns a failed `Result` with `OperationNotAllowedForRole` and nothing is persisted (RN04/RN07)

### Requirement: Unique email

The system SHALL guarantee email uniqueness across users. Creating or updating a user with an email already in use MUST be rejected.

#### Scenario: Duplicate email on create

- **WHEN** a user is created with an email that already belongs to another user
- **THEN** the use case returns a failed `Result` with `EmailAlreadyInUse` (RF-USR-02)

#### Scenario: Duplicate email on update

- **WHEN** a user is updated to an email that already belongs to a different user
- **THEN** the use case returns a failed `Result` with `EmailAlreadyInUse`

### Requirement: Edit staff user

The system SHALL allow an `ADMIN` actor to edit a user's name, email, and role. Editing by an unauthorized actor or for a non-existent user MUST be rejected.

#### Scenario: Authorized edit succeeds

- **WHEN** an `ADMIN` updates an existing user's name, email, and role with valid values
- **THEN** the user is updated via `UsersRepository` and a success `Result` is returned

#### Scenario: Editing a missing user fails

- **WHEN** an update targets a user id that does not exist
- **THEN** the use case returns a failed `Result` with `UserNotFound`

#### Scenario: Edit by unauthorized actor is blocked

- **WHEN** an `OPERADOR` actor attempts to edit a user
- **THEN** the use case returns a failed `Result` with `OperationNotAllowedForRole` (RN04/RN07)

### Requirement: Activate and deactivate user

The system SHALL allow an `ADMIN` to activate and deactivate a user. Deactivation MUST be blocked when the requester targets their own account (RN05).

#### Scenario: Deactivate another user

- **WHEN** an `ADMIN` deactivates a user whose id differs from the requester id
- **THEN** the user's active flag becomes false and a success `Result` is returned

#### Scenario: Activate an inactive user

- **WHEN** an inactive user is activated by an `ADMIN`
- **THEN** the user's active flag becomes true and a success `Result` is returned

#### Scenario: Cannot deactivate yourself

- **WHEN** the deactivate use case is called with `userId` equal to `requesterId`
- **THEN** the use case returns a failed `Result` with `CannotDeactivateSelf` and the user remains active (RN05)

#### Scenario: Deactivate a missing user fails

- **WHEN** deactivation targets a user id that does not exist
- **THEN** the use case returns a failed `Result` with `UserNotFound`

### Requirement: List users

The system SHALL list users with pagination and optional filters by role and by active status.

#### Scenario: Paginated listing with filters

- **WHEN** a list query is issued with a page, page size, and optional role/active filters
- **THEN** a paginated result is returned containing only users matching the filters (RF-USR-08)

### Requirement: Find user by id

The system SHALL retrieve a single user by id.

#### Scenario: Existing user found

- **WHEN** a find-by-id query is issued for an existing user id
- **THEN** the corresponding user is returned

#### Scenario: Missing user

- **WHEN** a find-by-id query is issued for a non-existent user id
- **THEN** the use case returns a failed `Result` with `UserNotFound`

### Requirement: Invariants enforced in the business rules

The system SHALL enforce every user invariant (unique email, role authorization, cannot-deactivate-self, password-is-hash) entirely in the domain layer — value objects, the `User` entity, and domain services/policies orchestrated by use cases. The system MUST NOT rely on database constraints (unique indexes, check constraints, foreign keys, or triggers) to enforce any of these rules.

#### Scenario: Uniqueness decided in the domain

- **WHEN** the email-uniqueness rule is evaluated
- **THEN** the decision is made by a domain specification/policy using a repository read (e.g. `findByEmail`), returning `EmailAlreadyInUse`, and not by a database unique index

#### Scenario: Cross-entity rules are pure domain services

- **WHEN** `modules/auth` is inspected
- **THEN** the cannot-deactivate-self and role-authorization rules live in pure domain services/policies (no I/O, no framework, no DB) consumed by the use cases

### Requirement: User ports

The system SHALL define the ports `UsersRepository` (persistence of the `User` aggregate, including `findByEmail`, `findById`, `create`, `save`, and `list`) and `HashGenerator` (produce a password hash from plain text), as interfaces with no concrete infrastructure in the domain module.

#### Scenario: Ports are interfaces only

- **WHEN** `modules/auth` is inspected
- **THEN** `UsersRepository` and `HashGenerator` exist as interfaces (contracts) with no database, framework, or crypto-library implementation in the module

