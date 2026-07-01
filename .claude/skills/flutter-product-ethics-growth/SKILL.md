---
name: flutter-product-ethics-growth
description: Use this skill whenever designing or reviewing Flutter product growth, onboarding, paywall, CTA copy, notifications, gamification, engagement loops, retention mechanics, sensitive-health UX, dark-pattern risk, or user-visible conversion text. Trigger for requests about marketing, copy, onboarding, paywall, push, gamification, streaks, badges, retention, subscription conversion, or ethical UX in Flutter apps.
---

# Flutter Product Ethics and Growth

Use this skill to design product growth mechanics and user-facing copy without introducing dark patterns, especially in health, finance, legal, children, pets, grief, or other sensitive contexts.

## Bundled Resources

- Read `references/product-ethics-checklist.md` before evaluating onboarding, paywall, copy, gamification, or retention mechanics.
- Read `references/source-map.md` when you need to trace which `.claude` agents informed this skill.
- Use `agents/product-ethics-specialist.md` when delegating a growth/copy/gamification ethics pass.

## Scope

This skill covers:

- Onboarding strategy.
- Paywall framing.
- CTAs.
- Empty states.
- Permission prompts.
- Notifications and push copy.
- Upgrade prompts.
- Gamification fit.
- Retention mechanics.
- Ethical constraints for sensitive contexts.

It does not write code. It produces implementation-ready product/UX/copy guidance for architecture and UI work.

## Ethical Baseline

Start from trust:

- Do not shame users.
- Do not hide opt-outs.
- Do not use fake scarcity.
- Do not imply medical/legal certainty unless the product can support it.
- Do not make emotionally sensitive failures feel like game losses.
- Do not optimize short-term conversion at the cost of long-term trust.

Sensitive contexts require stricter rules:

- Health or clinical data.
- Medication.
- Vaccination.
- Symptoms.
- Weight outside expected range.
- Financial/legal consequences.
- Death, grief, or inactive loved/pet profiles.

In these zones, avoid engagement mechanics that reward or punish behavior in ways that could create guilt, fear, or unsafe prioritization.

## Gamification Fit

Evaluate every mechanic with six questions:

1. Is the target behavior repeatable with natural cadence?
2. Does the user control the outcome?
3. Does the mechanic add value to the behavior, not just decoration?
4. Is failure emotionally safe?
5. Is there evidence from similar apps/categories?
6. Does it respect user autonomy?

Classification:

- `FIT STRONG`: all six are positive and risk is low.
- `FIT CONDITIONAL`: four or five positive, needs guardrails.
- `NO FIT`: fewer than four positive.
- `CONTRAINDICATED`: unsafe in sensitive context or autonomy violation.
- `OPEN`: needs research before deciding.

Default patterns:

| Mechanic                                | Default judgment | Reason                             |
| --------------------------------------- | ---------------- | ---------------------------------- |
| Gentle progress ring for optional tasks | FIT STRONG       | Useful visualization, no penalty   |
| Badge for positive milestone            | FIT STRONG       | Recognition without pressure       |
| Streak for low-risk logging             | FIT CONDITIONAL  | Needs forgiveness and no shame     |
| XP/levels                               | FIT CONDITIONAL  | Can distort motivation             |
| Leaderboard for health/care             | NO FIT           | Social comparison is often harmful |
| Streak for medication/vaccination       | CONTRAINDICATED  | Failure is not emotionally safe    |
| Loss of points/coins for inactivity     | CONTRAINDICATED  | Loss aversion dark pattern         |

## Guardrails

For approved or conditional mechanics:

- No "you failed" language.
- No punishment for missing a day.
- No countdown pressure for critical health actions.
- No leaderboard for care/health outcomes.
- No variable reward loops unrelated to user value.
- Let users disable reminders or celebrations.
- Track meaningful metrics, not vanity metrics.

Good metrics:

- D7/D30 retention.
- Completion rate of key user-owned actions.
- Frequency of useful logging.
- Paywall conversion by segment.
- Qualitative feedback/reviews.

Weak metrics:

- Badges unlocked per user.
- Raw notification sends.
- Sessions increased without task completion.

## Copy Rules

User-visible copy should be:

- Benefit-first.
- Clear.
- Honest.
- Localized for all supported locales.
- Calm in sensitive contexts.
- Actionable in errors and empty states.

Avoid:

- Fear framing.
- Guilt framing.
- Fake urgency.
- "Your pet depends on you" style pressure in missed-care contexts.
- Ambiguous CTA labels like "Continue" when the action is purchase/subscribe.

## Onboarding

Good onboarding:

- Shows value quickly.
- Asks only necessary setup questions.
- Defers optional permissions until context exists.
- Uses concrete benefits, not feature lists.
- Has one primary CTA per screen.

For Flutter implementation handoff, provide:

- Number of screens.
- Title/subtitle per locale.
- CTA/secondary action per locale.
- Required illustration/component notes.
- Events to track.
- Permission timing.

## Paywall

Good paywall:

- Clearly states what is free vs paid.
- Uses transparent price/trial language.
- Avoids hidden close buttons.
- Avoids misleading "best value" claims without rationale.
- Explains benefits tied to real user jobs.

For implementation handoff, provide:

- Trigger timing.
- Offer hierarchy.
- CTA text in each locale.
- Restore purchase placement.
- Terms/privacy placement.
- Metrics to track.

## Notifications

Notification copy should be:

- Useful.
- Specific.
- Calm.
- Respectful of opt-outs.
- Tuned to urgency.

Do not use manipulative re-engagement copy for sensitive health/care events.

## Output Templates

Gamification evaluation:

```text
# Gamification Evaluation - [Mechanic]

## Decision
FIT STRONG | FIT CONDITIONAL | NO FIT | CONTRAINDICATED | OPEN

## Six Criteria
[Short answer for each]

## Guardrails
[If any]

## Metrics
[What to track]

## Handoff
[What architect/designer/dev needs]
```

Copy/conversion spec:

```text
# Growth/Copy Spec - [Flow]

## Strategy
[Concrete recommendation and rationale]

## Screens / Moments
[Order and trigger]

## Copy
| Key | pt | en | es |
|---|---|---|---|

## Dark Patterns Avoided
[Explicit list]

## Metrics
[Events and success criteria]
```

## Review Checklist

- No dark patterns.
- Sensitive contexts handled calmly.
- Copy provided for all supported locales.
- CTA states the actual action.
- Notifications are useful and respectful.
- Gamification has fit classification and guardrails.
- Metrics measure user value, not vanity.
