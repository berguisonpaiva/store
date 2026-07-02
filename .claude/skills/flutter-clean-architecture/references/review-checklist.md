# Architecture Review Checklist

- Domain imports no Flutter, data, core, ui, or app.
- Data implements domain Repository and Query contracts.
- Repositories own commands and entity reads required by write invariants.
- Queries own lists/details/filters/pagination/aggregates and return framework-free read models.
- Query adapters do not expose DTOs, DAO rows, QueryRows, HTTP responses, or SDK types.
- ViewModels consume use cases rather than Repository/Query adapters directly.
- Data sources throw Exceptions; repositories convert to Failures.
- UI translates Failures into localized user messages.
- App is the only composition root and contains no heavy business rules.
- Core contains generic technical wrappers, not feature-specific logic.
- Cross-cutting features are split by responsibility.
- One public class or architectural element per file unless justified.
- New project/domain assumptions are validated before broad scaffolding.
