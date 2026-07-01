## Context

`apps/web` is Next.js 16 (App Router, simple layout) with NextAuth wired (`web-auth`): `(private)`/`(public)` groups, `proxy.ts` guard, `lib/http` authenticated client, `PrivateShell` with `NAVIGATION_SECTIONS`. Forms use React Hook Form; list state uses `nuqs`; toasts use `sonner`. The catalog API (`catalog-backend`) exposes products/variations/categories. This change adds the catalog management UI — **frontend only**.

## Goals / Non-Goals

**Goals:**

- `/products` and `/categories` routes under `(private)`, guarded by the existing proxy.
- Product list (name search + category/status filters, paginated via `nuqs`) and a product+variations form.
- Category list + form (unique name).
- Activate/deactivate (no delete) via Server Actions.
- Server reads via `lib/http` (Bearer); mutations via Server Actions; backend error codes → field/toast.
- Follow `config-new-module` (web module layout) and `frontend-form-schema`.

**Non-Goals:**

- No backend/mobile, no PDV screen, no inventory UI.

## Decisions

### 1. Module + routes layout

Catalog UI lives in `src/modules/catalog/**` (components, `data/` server functions + Server Actions, `schemas/`), with thin route files under `app/(private)/products/**` and `app/(private)/categories/**` rendering the module pages (per `config-new-module`). Navigation entries are added non-destructively to `NAVIGATION_SECTIONS` in `private-shell.tsx`.

### 2. Reads on the server, mutations via Server Actions

List/detail pages are Server Components calling `apiJson` (Bearer from `auth()`). Create/update/activate/deactivate are Server Actions calling the backend with `apiFetch`, then `revalidatePath`/redirect. This keeps tokens server-side and matches the project's Server-Action preference.

### 3. List state in the URL with `nuqs`

`page`, `pageSize`, `name`, `categoryId`, `active` are URL search params (typed via `nuqs`), so the product list is shareable and back/forward friendly.

### 4. Variations editor with field arrays

The product form uses RHF `useFieldArray` for variations (≥1 enforced client-side and by the backend). Price is entered as a decimal and converted to integer cents for the API (matching the domain `Price`). minStock is an integer ≥ 0. Validation mirrors the domain but the backend remains the source of truth.

### 5. Error mapping

Server Actions inspect the backend response: 409 `SKU_ALREADY_IN_USE`/`BARCODE_ALREADY_IN_USE` → field error on the offending variation (or toast if not locatable); 409 `CATEGORY_NAME_ALREADY_IN_USE` → name field error; 400 `PRODUCT_MUST_HAVE_VARIATION` → form-level toast; 404 → toast + back to list. Field errors inline, submission errors as `sonner` toasts (per `frontend-form-schema`).

### 6. Forms: project validator vs. Zod

Consistent with `web-auth`, use React Hook Form with inline rules / the project's form utilities (Zod is not installed). Flagged as an open question if the team standardizes on Zod.

## Skills to use

`config-frontend-layout` (navigation registration in the simple layout), `config-new-module` (web module scaffold), `frontend-form-schema` (forms, nuqs list state, Server Actions, toast/field error split), `verify`.

## Risks / Trade-offs

- [Decimal price ↔ integer cents conversion bugs] → centralize parse/format helpers; validate `> 0` both sides.
- [Variations field array UX] → keep it simple (add/remove rows, ≥1 enforced); attributes as repeatable key/value.
- [Next 16 specifics] → consult `node_modules/next/dist/docs` for Server Actions / `revalidatePath` before coding (per AGENTS.md).

## Migration Plan

1. Add `src/modules/catalog` (data + components + schemas).
2. Add routes under `(private)/products` and `(private)/categories`.
3. Register navigation entries.
4. Implement reads (`apiJson`) + Server Actions (mutations + error mapping).
5. `next build` green; manual verify against the running backend.

Rollback: remove the catalog module, routes, and the two nav entries.

## Open Questions

- Standardize forms on Zod vs. keep RHF inline rules (default: keep, as in web-auth)?
- Price input UX: plain decimal field (default) vs. masked currency input (`react-number-format`)?
