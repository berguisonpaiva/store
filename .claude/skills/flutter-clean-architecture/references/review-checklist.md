# Architecture Review Checklist

- Domain imports no Flutter, data, core, ui, or app.
- Data implements domain repository contracts.
- Data sources throw Exceptions; repositories convert to Failures.
- UI translates Failures into localized user messages.
- App is the only composition root and contains no heavy business rules.
- Core contains generic technical wrappers, not feature-specific logic.
- Cross-cutting features are split by responsibility.
- One public class or architectural element per file unless justified.
- New project/domain assumptions are validated before broad scaffolding.
