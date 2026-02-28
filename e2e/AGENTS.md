# AGENTS.md - e2e

This file applies to `e2e/**` and extends root `AGENTS.md`.

## Scope

- Playwright end-to-end tests and supporting test assets.
- Preserve smoke-test reliability and CI friendliness.

## Test authoring rules

- Keep tests deterministic; avoid arbitrary sleeps/timeouts.
- Prefer resilient selectors and explicit assertions.
- Do not commit focused-only flags (`test.only`, `describe.only`).
- Keep each test scoped to one user journey.

## Validation

- Run `npm run e2e` after e2e changes.
- If app behavior changed, ensure `npm run check` also passes before finishing.
