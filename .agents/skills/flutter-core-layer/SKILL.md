---
name: flutter-core-layer
description: Use this skill whenever creating, changing, or reviewing Flutter `lib/core` code: technical wrappers, SDK adapters, HTTP clients, loggers, storage, file services, notifications, remote config, app info, clock, generic extensions, Exceptions, and infrastructure boundaries. Trigger whenever a package or SDK needs to be used behind an interface in a Flutter Clean Architecture project.
---

# Flutter Core Layer

Use this skill to isolate generic technical infrastructure behind stable interfaces so app, data, and UI code do not spread direct SDK dependencies.

## Bundled Resources

- Read `references/core-checklist.md` before implementing or reviewing technical wrappers.
- Read `references/source-map.md` when you need to trace which `.Codex` rules informed this skill.
- Use `agents/core-specialist.md` when delegating SDK-wrapper or infrastructure-boundary review.

## Responsibility

`core/` owns reusable technical infrastructure:

- HTTP clients.
- Logger.
- Generic storage wrapper.
- SDK wrappers.
- File system.
- Local and push notification technical services.
- Remote config wrapper.
- App info/time implementations.
- Technical Exceptions.
- Generic extensions and utilities.

Suggested structure:

```text
core/
  http/
    http_client.dart
    http_client_impl.dart
  logger/
    app_logger.dart
    app_logger_impl.dart
  storage/
    local_storage.dart
    local_storage_impl.dart
  files/
    file_service.dart
    file_service_impl.dart
  analytics/
    analytics_service.dart
    analytics_service_impl.dart
  remote_config/
    remote_config_service.dart
    remote_config_service_impl.dart
  notifications/
    local_notification_service.dart
    local_notification_service_impl.dart
  database/
    database_connection_factory.dart
  errors/
    app_exception.dart
  extensions/
```

## Wrapper Pattern

Every reusable technical SDK should be wrapped with:

- An interface.
- An implementation.
- Registration in app/di.

Rules:

- Do not import generic infrastructure SDKs directly from domain, data, or UI when the SDK should be abstracted.
- Data and app depend on the core interface, not implementation.
- The implementation contains package-specific code.
- The implementation is registered in `app/di/core_module.dart`.

Example:

```text
core/storage/local_storage.dart       interface
core/storage/local_storage_impl.dart  SharedPreferences wrapper
```

## What Core Must Not Contain

Core must not know:

- Feature-specific business concepts.
- Domain-specific repository contracts.
- UI widgets.
- Routes.
- App-specific Drift tables, DAOs, or `AppDatabase`.

If a class knows app tables or business context, it belongs to `data`.

## Technical Ports Used by Domain

If a use case needs a technical capability, put the port in domain and the adapter in core.

Examples:

```text
domain/shared/clock.dart
core/time/clock_impl.dart

domain/shared/app_info_service.dart
core/app_info/app_info_service_impl.dart
```

This follows Dependency Inversion:

- Domain owns the contract it needs.
- Core provides the external adapter.

Keep the interface in core only when the consumer is data/ui/app and domain never depends on it.

## Local Notifications

Split local notification responsibility:

```text
core/notifications/local_notification_service.dart       schedule/cancel/init by id/date/message
core/notifications/local_notification_service_impl.dart  flutter_local_notifications wrapper
domain/[context]/repositories/notification_repository.dart business contract
data/[context]/notification_repository_impl.dart maps business rule to core service
```

Core only schedules/cancels technical notifications. It never decides business timing or message meaning.

Use cases orchestrate save/update/delete plus notification scheduling:

- Create: save entity, then schedule.
- Update: update entity, cancel old notification, schedule new one.
- Delete: cancel notification before deleting entity.

## Remote Config and Analytics

Remote config:

- Core wraps SDK access.
- Data/domain are involved only if config changes business behavior.
- UI/app can consume presentation flags only through established boundaries.

Analytics:

- Core wraps SDK.
- Domain defines business event contracts when events have business meaning.
- App observers track navigation/global events.
- UI triggers visual/user interaction events without directly depending on SDKs.

## Files and PDF

Use this split:

```text
domain/     decides what should be generated
data/pdf/   creates technical template or binary output
core/files/ saves, opens, shares
ui/         preview, loading, action buttons
```

## Package Research

Before adding or coding against a package:

- Check pub.dev for latest version, score, popularity, and update date.
- Check official docs for current API and installation.
- Evaluate whether the feature is small enough to implement without a package.
- Wrap the package if it is an infrastructure dependency.

Do not assume SDK APIs from memory when the package may have changed.

## Review Checklist

- Interface and implementation are separated.
- SDK imports are contained in implementation files.
- Core does not know feature/domain specifics.
- App-specific database schema is not in core.
- Technical Exceptions live in core/data, not domain.
- DI registers implementations in app/di.
- Domain-owned technical ports have interfaces in `domain/shared` and implementations in core.
