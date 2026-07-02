# UI MVVM Checklist

- UI does not import data or app routing.
- View receives ViewModel and callbacks by constructor.
- ViewModel/Cubit has no Flutter/Material/Widgets imports.
- ViewModel calls command/query use cases and does not inject Repository/Query adapters directly.
- UI state may contain domain read models but no data DTOs, DAO rows, or persistence types.
- Route that owns `load()`/`close()` constructs the ViewModel in State.
- Feature state is emitted by ViewModel, not controlled with `setState`.
- `BlocBuilder`/`BlocListener` use explicit `bloc:` if required.
- Child widgets receive data/callbacks, not whole ViewModel unnecessarily.
- No widget-returning helper functions.
- No feature components implemented inline inside `Page`, `LandingPage`, `Screen`, `View`, or `Route` files.
- Page/View files compose extracted widgets; components with layout, style, conditionals, interaction, or reuse live in feature `widgets/`.
- One widget class per file.
- Forms are unified create/edit with `existing`.
- Deletes use confirm dialog and toast feedback.
- Visible strings are localized.
