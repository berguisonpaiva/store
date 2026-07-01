# Review Checklist

- Layer dependencies are clean.
- Failure vs Exception boundary is correct.
- Future/Either and Stream usage is correct.
- Stream subscriptions are cancelled.
- DI registrations and lifetimes are correct.
- UI does not know data/app routing.
- ViewModels are Flutter-free.
- Bloc usage follows project convention.
- Page/LandingPage/Screen/View files do not contain large inline components.
- Feature components are extracted to feature `widgets/`; reusable components are in `ui/shared/widgets/`.
- Data/Drift code avoids leaks and N+1.
- Design tokens and shared widgets are used.
- l10n is complete for visible text.
- Tests cover changed behavior at the right layer.
- File/class naming and one-class-per-file rules hold.
