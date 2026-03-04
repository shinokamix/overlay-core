# AGENTS.md - e2e

This file applies to `e2e/**` and extends root `AGENTS.md`.

## Extra rules for e2e scope

- Keep tests deterministic; avoid arbitrary sleeps/timeouts.
- Prefer resilient selectors and explicit assertions.
- Never commit `test.only` or `describe.only`.
- Keep each test focused on one user journey.

## Validation

- Run `npm run e2e` after e2e changes.
- If product behavior changed, run `npm run check` too.
