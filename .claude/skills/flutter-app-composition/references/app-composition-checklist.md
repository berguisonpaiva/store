# App Composition Checklist

- App contains wiring, not heavy business rules.
- `final getIt = GetIt.instance` exists once.
- `injection.dart` calls modules and does not register individual classes.
- Core and database modules register before feature/context modules.
- Async resources are resolved before synchronous registration factories.
- Context modules register data sources, Repository and Query implementations, command/query use cases, and ViewModels.
- Repository/Query implementations are lazy singletons; use cases and ViewModels are factories.
- ViewModels depend on use cases rather than concrete data adapters.
- Static router can be top-level `final`; dynamic router uses factory.
- UI navigation is injected via callbacks.
- Edit routes pass already-loaded entity through `state.extra` when useful.
