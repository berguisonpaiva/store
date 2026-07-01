# Design System Checklist

- Spacing uses `AppSpacing` or project tokens.
- Radius uses `AppRadius` or project tokens.
- Color uses `ColorScheme`, `AppColors`, or theme extensions.
- Typography uses `textTheme` or typography tokens.
- Light and dark modes are both valid.
- Existing shared widgets are reused.
- Page/LandingPage/Screen/View files compose extracted components instead of defining visual sections inline.
- Feature-specific visual components live in feature `widgets/`; cross-feature components live in `ui/shared/widgets/`.
- Raw `TextFormField` is justified or wrapper is extended.
- Loading, empty, error, and success states are covered.
- Touch targets are at least 48dp where Material applies.
- Icon-only controls have semantics/tooltips.
- Visible copy is localized.
