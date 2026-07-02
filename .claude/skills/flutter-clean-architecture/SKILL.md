---
name: flutter-clean-architecture
description: Use this skill whenever planning, implementing, or reviewing a Flutter app with Clean Architecture, DDD, CQRS, MVVM, layered modules, dependency rules, Failure vs Exception, cross-cutting features, or project structure decisions. This is the umbrella architecture skill for Flutter projects and should trigger even when the user says "organize the app", "separate layers", "commands and queries", "read model", "DDD", "domain/data/ui/app/core", or "clean architecture".
---

# Flutter Clean Architecture

Use this skill to keep Flutter projects organized around clear dependency direction, testable business rules, and predictable layer ownership.

## Bundled Resources

- Read `references/source-map.md` when you need to trace which `.claude` rules informed this skill.
- Read `references/review-checklist.md` before a broad architecture audit or PR review.
- Read `references/cqrs-pattern.md` before designing or reviewing repositories, queries, read models, or data-access use cases.
- Use `agents/architecture-specialist.md` when delegating an architecture-only planning/review pass.

## Layer Map

Use these layers unless the existing project has a stronger local convention:

```text
lib/
  app/     composition root, routing, DI, bootstrap
  core/    generic technical wrappers and utilities
  domain/  business rules, entities, value objects, use cases, repositories, queries, read models
  data/    repository/query implementations, data sources, DTOs, mappers, persistence
  ui/      views, routes/wrappers, viewmodels/cubits, widgets, themes, l10n usage
```

The dependency direction points inward:

```text
ui -> domain
data -> domain
data -> core
app -> all layers
domain -> no app layer
```

## Responsibilities

`domain/`:

- Owns business language, entities, value objects, use cases, policies, Repository/Query contracts, read models, and Failures.
- Must not import Flutter, data, core, ui, or app.
- Must be testable without framework setup.

`data/`:

- Implements domain Repository and Query contracts.
- Owns data sources, DTOs/models, mappers, Exceptions, Drift schema, DAOs, and persistence details.
- May depend on domain and core.
- Must not depend on ui or app.

## CQRS Boundaries

Classify each operation before choosing a contract:

- Command or entity load required by a command -> Repository.
- Consumer-oriented read, list, detail, filter, pagination, join, or aggregate -> Query returning a read model.

Repositories persist aggregates and may load entities to preserve write invariants. Queries never mutate state and do not reconstruct entities unless the read contract genuinely requires domain behavior. Data implements both contracts; UI consumes query and command use cases rather than data-access contracts directly.

Use `Future<Either<Failure, T>>` for one-shot queries and commands. Use `Stream<T>` for reactive queries unless the project explicitly standardizes a different stream error contract. CQRS here does not require separate databases, a command bus, event sourcing, or additional packages.

`core/`:

- Owns generic technical wrappers: HTTP, logger, storage, SDK wrappers, file system, notifications, remote config, app info, clock implementation, technical Exceptions.
- Does not know any feature or business context.

`app/`:

- Owns bootstrap, dependency injection, routing, app widget, observers, route guards, deep links, global config.
- May know all layers, but must not contain heavy business rules.

`ui/`:

- Owns presentation: routes/wrappers, views, ViewModels/Cubits, states, widgets, themes, l10n usage, feedback.
- May know domain.
- Must not know data.
- Should not know core directly except for small generic cases already established by the project.

## Failure vs Exception

Use this split consistently:

| Concept   | Meaning                                       | Location                                       | Owner                         |
| --------- | --------------------------------------------- | ---------------------------------------------- | ----------------------------- |
| Failure   | Business/app-level error the UI can interpret | `domain/errors/` or `domain/[context]/errors/` | Domain/use cases/repositories |
| Exception | Technical/infrastructure error                | `core/errors/` or `data/errors/`               | Core/data sources             |

Rules:

- Data sources throw Exceptions.
- Repository implementations catch Exceptions and convert them to Failures when returning to domain/app flows.
- UI translates Failures into localized user messages.
- Domain Failures do not contain translated UI text.

## Cross-Cutting Features

Place cross-cutting concerns by responsibility, not by package name.

Analytics:

```text
core/analytics/   SDK wrapper
domain/analytics/ business event contract when needed
data/analytics/   implementation of business event contract
app/observers/    navigation or global observers
ui/               visual event triggers
```

Remote config:

```text
core/remote_config/ SDK wrapper
data/config/        repository implementation
domain/config/      only if config changes business rules
ui/app              only if config changes presentation or experience
```

Local notifications:

```text
core/notifications/ technical scheduler wrapper
domain/[context]/repositories/ notification business contract
data/[context]/ notification repository implementation
app/di/ registration
```

Files/PDF:

```text
domain/     defines what should be generated
data/pdf/   technical template and generation
core/files/ save, open, share
ui/         preview, loading, buttons
```

Extensions:

```text
Flutter / BuildContext -> ui/shared/extensions
JSON / DTO / mapping   -> data/extensions
Pure business rule     -> domain or specific context
Generic helper         -> core/extensions
```

## File Organization

Prefer one public class or relevant architectural element per file:

- Interface in `[name].dart`.
- Implementation in `[name]_impl.dart`.
- Entity in `[name]_entity.dart`.
- Model in `[name]_model.dart`.
- Mapper in `[name]_mapper.dart`.

Allowed exceptions:

- Simple enum colocated with the only class that consumes it.
- Small private type tightly coupled to one file.
- Small helper that would become less clear if extracted.

Document exceptions in review.

## Starting a New Flutter Project

When the user asks to create a new Flutter project, do not assume the business domain. Ask:

1. Project name and one-sentence description.
2. Main features/modules.
3. Authentication/login requirement.
4. Local data, remote API, or both.
5. Monetization/subscription needs.
6. Localization needs.
7. Main screens the user already imagines.

Then propose:

- DDD contexts for domain and data.
- Entities and value objects per context.
- Initial use cases.
- Local database tables if needed.
- DI modules.
- UI features and routes.

Wait for validation before generating broad structure.

## Decision Checklist

Before writing or approving code:

- Does each class live in the layer that owns its responsibility?
- Does domain stay framework-free?
- Are Exceptions converted to Failures at repository boundaries?
- Are reads implemented as Query/read-model projections while Repositories remain command/entity oriented?
- Are cross-cutting concerns split by technical wrapper, domain contract, data implementation, app wiring, and UI trigger?
- Is each public class traceable to its own file?
- Are package imports consistent with the dependency direction?
