# AGENTS.md - src

This file applies to `src/**` and extends root `AGENTS.md`.

## Scope

- React + TypeScript application code only.
- Keep architecture FSD-oriented: `app`, `features`, `shared`.

## Dependency direction (required)

- `app` may depend on `features` and `shared`.
- `features` may depend only on `shared`.
- `shared` must not import from `app` or `features`.

## Implementation rules

- Put global shell/app state in `app/model`.
- Put user-facing business actions in `features/*`.
- Place reusable UI primitives in `shared/ui`.
- Prefer small, focused changes; avoid unrelated refactors.
- Do not introduce new dependencies without clear need.

## Validation

- Run targeted checks for touched code while iterating.
- Before finishing, required root checks must pass (`npm run check` and Rust check from root policy).
