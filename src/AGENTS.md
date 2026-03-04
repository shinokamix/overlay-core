# AGENTS.md - src

This file applies to `src/**` and extends root `AGENTS.md`.

## Extra rules for frontend scope

- Keep FSD boundaries strict: `app`, `features`, `shared`.
- Do not import `app` from `features` or `shared`.
- Keep global shell state in `app/model`.
- Put user-facing flows in `features/*`.
- Keep reusable primitives in `shared/ui`.

## Validation

- Run targeted frontend checks while iterating.
- Finish with required root checks.
