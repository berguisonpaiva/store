---
name: flutter-performance-anr
description: Use this skill whenever auditing or fixing Flutter performance risks related to ANR, app hangs, jank, startup latency, UI isolate blocking, heavy sync work, plugin initialization, Drift parsing, PDF/image generation, timers, streams, large lists, or hot UI paths. Trigger for performance, ANR, jank, freeze, slow startup, Play Console Vitals, MetricKit hangs, or "app travando" in Flutter.
---

# Flutter Performance, ANR, and Jank

Use this skill to diagnose and prevent work that blocks the Flutter UI isolate, platform thread, or critical rendering paths.

## Bundled Resources

- Read `references/performance-anr-checklist.md` before a performance or app-hang audit.
- Read `references/source-map.md` when you need to trace which `.claude` rules informed this skill.
- Use `agents/performance-anr-specialist.md` when delegating a diagnostic-only ANR/jank pass.

## Scope

Look for:

- Android ANR risk.
- iOS app hangs/watchdog kills.
- Flutter jank and frame drops.
- Slow startup.
- Blocking plugin initialization.
- Heavy synchronous Dart work.
- Unbounded streams/timers.
- Expensive lists/layout.

## Priority Inspection Order

1. Startup path:
   - `lib/main.dart`
   - `lib/app/startup/`
   - `lib/app/app.dart`
   - `lib/app/di/`
2. SDK/plugin initialization:
   - Notifications.
   - Ads.
   - Purchases/subscriptions.
   - Firebase.
   - Remote config.
   - Privacy/consent SDKs.
3. Heavy operations:
   - Backup/restore.
   - JSON parsing.
   - PDF/image generation.
   - File reads/writes.
   - Crypto/compression.
   - Drift migrations and large mapping.
4. Hot UI paths:
   - Initial/home screen.
   - Detail screens used every session.
   - Onboarding.
   - Paywall/conversion screens.
5. Long-lived work:
   - `Timer.periodic`.
   - `StreamController`.
   - `StreamSubscription`.
   - animations.
6. Build methods:
   - HTTP/DB/I/O in `build`.
   - Side effects in `build`.

## Risk Categories

Critical:

- Synchronous work over roughly 200ms on UI isolate.
- Large `jsonDecode` on UI isolate.
- Awaiting long SDK initialization before `runApp()`.
- File read/write loops in `build` or `initState`.
- PDF/image generation on UI isolate.
- Future in startup path that can hang forever.
- Uncancelled timers/subscriptions in hot paths.

High:

- Large dynamic list without lazy builder.
- `shrinkWrap: true` in dynamic/full-screen lists.
- Heavy `Opacity`, clipping, or saveLayer-like effects in repeated list items.
- Side effect in `build`.
- Image decode without sizing in high-traffic UI.
- Frequent `setState` loops without batching.

Medium:

- Async calls without timeout in blocking UX.
- Sequential awaits that could be independent `Future.wait`.
- Overbroad rebuilds.
- Stream errors without `onError` handling.

Low:

- Missing `const` in one-off widgets.
- Non-lazy list for small static content.
- Minor conversion inefficiency in rare screens.

False positive:

- Work already moved to isolate/compute/background executor.
- Operation measured and shown under frame budget.
- Small static list in a dialog/form.

## Startup Rules

Classify initialization:

| Blocking                              | Lazy/background            |
| ------------------------------------- | -------------------------- |
| Initial route/session requirement     | Analytics                  |
| Required auth state                   | Ads                        |
| Local theme/locale                    | Non-critical remote config |
| Critical entitlement for first screen | Backup/sync                |

Avoid awaiting non-critical SDK initialization before first frame. Initialize lazily or in background when product behavior allows.

Add timeouts for operations that block visible progress.

## Heavy Work Rules

Move CPU-heavy or parsing-heavy work off the UI isolate when data size is large:

- JSON payloads.
- Image processing.
- PDF generation.
- Compression.
- Crypto.
- Large Drift result mapping.

Use project-appropriate patterns:

- `compute`.
- Isolate.
- Package-supported background executor.
- Drift background database creation/executor when applicable.

Verify package APIs from official docs before recommending an exact integration.

## UI Jank Rules

Lists:

- Use `ListView.builder` or `GridView.builder` for long/dynamic collections.
- Use `CustomScrollView` with Slivers for multiple lists, list+grid, or collapsible app bars.
- Avoid `shrinkWrap: true` in main/dynamic lists.
- Use `SliverToBoxAdapter` for normal widgets inside slivers.

Build:

- Keep `build` pure.
- No HTTP, DB, I/O, or state mutation in `build`.
- Use `const` where it reduces repeated rebuild cost.

Images:

- Provide cache sizing when decoding large images.
- Consider precache for critical hero/paywall/onboarding imagery.

## Streams and Timers

Check:

- `StreamSubscription` cancelled in `close()`/`dispose()`.
- `Timer.periodic` cancelled.
- `StreamController` closed.
- Infinite animation controllers disposed.
- Error handlers are present where stream errors affect UI.

## Audit Report Template

```text
# Flutter Performance Audit

## Summary
- Critical: N
- High: N
- Medium: N
- Low: N
- Conclusion: [release risk]

## Findings

### F1 - [short title]
- File: path:line
- Risk: Critical/High/Medium/Low
- Evidence: [code or behavior]
- Impact path: startup / screen / background flow
- Why it matters: [technical explanation]
- Handoff: [architecture/research/implementation next step]

## Anti-Findings
- [Patterns inspected and cleared]
```

## Review Checklist

- Startup does not await non-critical heavy SDK initialization.
- Heavy CPU/file work is not on UI isolate.
- Hot screens use lazy lists/slivers.
- No side effects in `build`.
- Timers/subscriptions/controllers are disposed.
- Drift/SQL avoids N+1 and excessive UI-side stream combination.
- Exact package performance guidance is verified against current official docs.
