# Feature Workflow Checklist

- Plan identifies context, entities, value objects, contracts, and use cases.
- Return types are chosen intentionally.
- Persistence needs are mapped before UI work.
- DI and routes are planned.
- UI states and navigation callbacks are planned.
- Page/LandingPage/Screen/View decomposition is planned: visual components go to feature `widgets/`, shared components go to `ui/shared/widgets/`.
- l10n keys are listed.
- Tests are scoped by layer.
- Implementation follows domain -> core -> data -> app -> ui.
- Analyzer/tests run before completion.
- Review/design/widget-test gates are used when UI changes.
- No final UI file leaves multiple components inline inside the page/view.
