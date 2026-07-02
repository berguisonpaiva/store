# Feature Workflow Checklist

- Plan identifies context, entities, value objects, command Repositories, Queries, read models, and use cases.
- Every persisted operation is classified as command/entity-invariant read or consumer-oriented query.
- Return types are chosen intentionally.
- Persistence and projection needs are mapped before UI work.
- Data includes separate Repository and Query adapters when both sides are required.
- DI and routes are planned.
- UI states and navigation callbacks are planned.
- Page/LandingPage/Screen/View decomposition is planned: visual components go to feature `widgets/`, shared components go to `ui/shared/widgets/`.
- l10n keys are listed.
- Tests are scoped by layer.
- Tests use fake Repositories for commands and fake Queries for reads.
- Implementation follows domain -> core -> data -> app -> ui.
- Analyzer/tests run before completion.
- Review/design/widget-test gates are used when UI changes.
- No final UI file leaves multiple components inline inside the page/view.
