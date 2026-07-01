# Core Checklist

- Technical SDKs are wrapped by interface plus implementation.
- SDK imports do not leak across layers.
- Data/app depend on core interfaces, not implementations.
- Core does not know feature-specific domain.
- Technical Exceptions live in core or data, not domain.
- App-specific database schema is not in core.
- Ports consumed by domain are defined in `domain/shared`.
- Implementations are registered in app DI.
- New or unfamiliar package APIs are checked against official docs.
