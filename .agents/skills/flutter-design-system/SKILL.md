---
name: flutter-design-system
description: Use this skill whenever designing, implementing, or reviewing Flutter design system work: themes, tokens, Material 3, dark mode, shared widgets, form wrappers, AppToast, accessibility, l10n, visual specs, design audits, and UI consistency. Trigger for any request about UI polish, design, theme, colors, spacing, typography, shared widgets, accessibility, dark mode, or design review in Flutter.
---

# Flutter Design System

Use this skill to keep Flutter UI consistent, accessible, theme-aware, and based on reusable components instead of one-off styling.

## Bundled Resources

- Read `references/design-system-checklist.md` before design specs, UI audits, or theme/shared-widget review.
- Read `references/source-map.md` when you need to trace which `.Codex` rules informed this skill.
- Use `agents/design-system-specialist.md` when delegating visual consistency or accessibility review.

## Design System Structure

Recommended structure:

```text
ui/shared/theme/
  colors/
    app_colors.dart
    app_accent_kind.dart
    app_accent_palette.dart
    app_categorical_colors.dart
  tokens/
    app_spacing.dart
    app_radius.dart
    app_typography.dart
  themes/
    app_theme.dart
    app_light_theme.dart
    app_dark_theme.dart
    app_theme_extension.dart
  cubit/
    theme_cubit.dart
    theme_state.dart
    app_theme_mode.dart
    app_theme_mode_mapper.dart

ui/shared/widgets/
ui/shared/feedback/
ui/shared/navigation/
ui/shared/pages/
ui/shared/l10n/
```

## Token Rules

Views and widgets should use tokens instead of raw values:

| Need       | Prefer                                                                    |
| ---------- | ------------------------------------------------------------------------- |
| Spacing    | `AppSpacing.*`                                                            |
| Radius     | `AppRadius.*`                                                             |
| Typography | `Theme.of(context).textTheme.*` or project typography tokens              |
| Color      | `Theme.of(context).colorScheme.*`, `AppColors`, semantic theme extensions |
| Duration   | Named constant or animation token                                         |

Avoid:

- `EdgeInsets.all(16)` in Views.
- `SizedBox(height: 24)` as unexplained raw spacing.
- `Color(0xFF...)` in Views.
- `Colors.blue` in feature UI.
- `BorderRadius.circular(8)` in Views.
- Raw `TextStyle(fontSize: ...)` where theme typography exists.

## Theme Organization

Keep light and dark themes in separate files:

```text
themes/app_light_theme.dart
themes/app_dark_theme.dart
themes/app_theme.dart
themes/app_theme_extension.dart
```

`app_theme.dart` should export or assemble themes, not contain every theme detail.

Use Material 3 concepts:

- `ColorScheme`.
- Semantic tokens.
- `ThemeExtension` for app-specific values.
- Surfaces and tonal elevation when relevant.

Validate both light and dark modes for every component or screen change.

## Shared Widgets

Prefer existing `App*` shared widgets before creating new UI directly.

Page/LandingPage component rule:

- `Page`, `LandingPage`, `Screen`, and `View` files should compose the screen from named components.
- Do not build all visual sections inline in one large page file.
- A visual section, card, hero, CTA block, form block, list item, banner, empty state variant, or repeated row should become its own widget file.
- Feature-specific components live in `ui/features/[context]/[feature]/widgets/`.
- Components reused by multiple features live in `ui/shared/widgets/`.
- This keeps the UI aligned with Clean Code and SOLID: pages orchestrate, widgets own one visual responsibility.

Common categories:

Forms:

- `AppTextFieldWidget`
- `AppMultilineFieldWidget`
- `AppNumberFieldWidget`
- `AppDateFieldWidget`
- `AppDateTimeFieldWidget`
- `AppDropdownFieldWidget`
- `AppSwitchFieldWidget`
- `AppSegmentedControlWidget`
- `AppFieldWidget`

Actions:

- `AppButtonWidget`
- `AppAccentButtonWidget`
- `AppSubmitButtonWidget`
- `AppIconButtonWidget`
- `AppFabWidget`
- `AppItemActionsButtonWidget`

Layout:

- `AppScreenHeaderWidget`
- `AppLargeTitleWidget`
- `AppSectionWidget`
- `AppRowWidget`
- `AppCardWidget`

State and feedback:

- `AppEmptyStateWidget`
- `AppAnimatedStatusSwitcher`
- `AppConfirmDialog`
- `AppPillWidget`
- `AppToast`

When a needed variant does not exist, extend the shared widget with optional parameters instead of duplicating raw Material widgets across features.

## Form Design

Use shared field wrappers. Raw `TextFormField` is temporary and needs a review justification.

Create and edit should share the same form:

- Same View.
- Same ViewModel.
- Same Route.
- Optional `existing: Entity?`.
- Title and success copy change based on `isEditing`.

## Feedback Patterns

Use `AppToast` for action feedback:

- Success.
- Error.
- Info.

Avoid `SnackBar` and `ScaffoldMessenger` unless the project explicitly allows a justified exception.

Delete pattern:

```text
AppItemActionsButtonWidget -> AppConfirmDialog(destructive: true) -> use case -> AppToast
```

## Accessibility

Apply these checks to every UI feature:

- Text contrast at least 4.5:1.
- UI element contrast at least 3:1.
- Touch targets at least 48dp on Material.
- Semantic labels for icon-only actions.
- Logical focus order.
- Do not use color as the only state indicator; pair color with icon/text.
- Disabled state is visually clear.

## l10n

All user-visible text must be localized in every supported locale.

Rules:

- No hardcoded user-facing strings in Views or Widgets.
- Empty/error/success copy should be useful, not generic.
- Plural/gender cases should be handled when relevant.

## Visual Spec Template

For a new screen, produce:

```text
# Spec - [Screen]

## Goal
[One sentence]

## Visual Hierarchy
1. Primary action
2. Secondary action
3. Main information
4. Secondary information

## Layout
[Header, body, footer, tokens]

## Components
[Use existing App* widgets]

## New Components
[Only if needed, with reason]

## States
Loading, empty, error, success

## Dark Mode
[Theme considerations]

## Accessibility
[Semantics, touch targets, contrast]

## l10n
Key, pt, en, es or current project locales

## Microinteractions
[Tap feedback, transitions, disabled state]
```

## Design Audit Checklist

- No hardcoded spacing/color/radius/typography in feature UI.
- Uses existing shared widgets.
- Page/LandingPage/Screen/View files are not large inline component dumps; visual sections are extracted to `widgets/`.
- Handles loading, empty, error, success.
- Dark mode verified.
- A11y targets and semantics checked.
- l10n complete.
- One clear primary action per screen.
- Visual hierarchy is not flat.
- No raw `TextFormField` without justification.
- No `SnackBar`/`ScaffoldMessenger` if the project wrapper exists.
