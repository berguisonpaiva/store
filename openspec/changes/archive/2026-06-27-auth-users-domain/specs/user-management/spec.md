## ADDED Requirements

### Requirement: User aggregate and roles

The system SHALL define a `User` aggregate in `modules/users` with the fields name, email, password hash, role, and active flag, where role is a `UserRole` enum with exactly the values `MASTER`, `ADMIN`, and `OPERADOR`. The aggregate MUST be pure domain logic with no HTTP, database, or framework dependencies, reusing the shared value objects (`PersonName`, `Email`, `HashPassword`) and `Entity`/`Result` base.

#### Scenario: Valid user is created

- **WHEN** a `User` is built with a valid name, valid email, a password hash, a role, and active = true
- **THEN** the aggregate is created successfully and exposes its role as one of `MASTER`, `ADMIN`, or `OPERADOR`

#### Scenario: Invalid field is rejected

- **WHEN** a `User` is built with an invalid email or an invalid name
- **THEN** the creation returns a failed `Result` with the corresponding validation error and no aggregate is produced

#### Scenario: Password is never plain text

- **WHEN** a `User` aggregate is inspected
- **THEN** it holds the password only as a `HashPassword` value object and never exposes or stores the plain-text password (RF-USR-03)

### Requirement: Create staff user

The system SHALL allow a MASTER or ADMIN actor to create a staff user with name, email, password, and role, hashing the password through the `HashGenerator` port before persistence. Creation by an actor whose role is not MASTER or ADMIN MUST be rejected.

#### Scenario: Authorized creation succeeds

- **WHEN** a MASTER or ADMIN requests creation of a staff user with a unique email and valid fields
- **THEN** the password is hashed via `HashGenerator`, the user is persisted via `UsersRepository`, and a success `Result` is returned (RF-USR-01)

#### Scenario: Unauthorized actor is blocked

- **WHEN** an actor whose role is `OPERADOR` requests creation of a user
- **THEN** the use case returns a failed `Result` with `OperationNotAllowedForRole` and nothing is persisted (RF-USR-09)

### Requirement: Unique email

The system SHALL guarantee email uniqueness across users. Creating or updating a user with an email already in use MUST be rejected.

#### Scenario: Duplicate email on create

- **WHEN** a user is created with an email that already belongs to another user
- **THEN** the use case returns a failed `Result` with `EmailAlreadyInUse` (RF-USR-02)

#### Scenario: Duplicate email on update

- **WHEN** a user is updated to an email that already belongs to a different user
- **THEN** the use case returns a failed `Result` with `EmailAlreadyInUse`

### Requirement: Edit staff user

The system SHALL allow a MASTER or ADMIN actor to edit a user's name, email, and role. Editing by an unauthorized actor or for a non-existent user MUST be rejected.

#### Scenario: Authorized edit succeeds

- **WHEN** a MASTER or ADMIN updates an existing user's name, email, and role with valid values
- **THEN** the user is updated via `UsersRepository` and a success `Result` is returned (RF-USR-04)

#### Scenario: Editing a missing user fails

- **WHEN** an update targets a user id that does not exist
- **THEN** the use case returns a failed `Result` with `UserNotFound`

#### Scenario: Role change by unauthorized actor is blocked

- **WHEN** an `OPERADOR` actor attempts to change a user's role
- **THEN** the use case returns a failed `Result` with `OperationNotAllowedForRole` (RF-USR-09)

### Requirement: Activate and deactivate user

The system SHALL allow activating and deactivating a user. Deactivation MUST be blocked when it would remove the last active MASTER.

#### Scenario: Deactivate a non-last MASTER user

- **WHEN** a user is deactivated while at least one other active MASTER remains
- **THEN** the user's active flag becomes false and a success `Result` is returned (RF-USR-05)

#### Scenario: Activate an inactive user

- **WHEN** an inactive user is activated
- **THEN** the user's active flag becomes true and a success `Result` is returned

#### Scenario: Cannot deactivate the last active MASTER

- **WHEN** deactivating a MASTER user who is the only active MASTER
- **THEN** the use case returns a failed `Result` with `OperationNotAllowedForRole` and the user remains active (RF-USR-06)

### Requirement: Change own password

The system SHALL allow a user to change their own password by providing the current password (which MUST match) and a new password of at least 8 characters; the new password is stored only as a hash.

#### Scenario: Successful password change

- **WHEN** a user provides a correct current password and a valid new password
- **THEN** the new password is hashed via `HashGenerator`, persisted via `UsersRepository`, and a success `Result` is returned (RF-USR-07)

#### Scenario: Wrong current password

- **WHEN** the provided current password does not match the stored hash
- **THEN** the use case returns a failed `Result` and the stored password is unchanged

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

The system SHALL enforce every user invariant (unique email, role authorization, last-active-MASTER, password-is-hash) entirely in the domain layer — value objects, the `User` entity, and domain services/policies orchestrated by use cases. The system MUST NOT rely on database constraints (unique indexes, check constraints, foreign keys, or triggers) to enforce any of these rules.

#### Scenario: Uniqueness decided in the domain

- **WHEN** the email-uniqueness rule is evaluated
- **THEN** the decision is made by a domain specification/policy using a repository read (e.g. `findByEmail`), returning `EmailAlreadyInUse`, and not by a database unique index

#### Scenario: Cross-entity rules are pure domain services

- **WHEN** `modules/users` is inspected
- **THEN** the last-active-MASTER and role-authorization rules live in pure domain services/policies (no I/O, no framework, no DB) consumed by the use cases

### Requirement: User ports

The system SHALL define the ports `UsersRepository` (persistence of the `User` aggregate, including lookup by email and counting active MASTERs) and `HashGenerator` (produce a password hash from plain text), as interfaces with no concrete infrastructure in the domain module.

#### Scenario: Ports are interfaces only

- **WHEN** `modules/users` is inspected
- **THEN** `UsersRepository` and `HashGenerator` exist as interfaces (contracts) with no database, framework, or crypto-library implementation in the module
