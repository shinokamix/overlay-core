# Roadmap (2026)

This file tracks active milestones and release cadence.

_Last updated: 2026-03-04_

## Planning rules

- Milestones are fixed 14-day windows.
- Development and validation are open by default.
- Release channels remain `beta` and `stable`.

## Milestones

| Milestone                   | Window                   | Target release                   | Outcome                                                                  |
| --------------------------- | ------------------------ | -------------------------------- | ------------------------------------------------------------------------ |
| M1 - Open Alpha Slice       | 2026-03-02 to 2026-03-15 | `0.2.0-beta.*`                   | First end-to-end flow: `hotkey -> screenshot -> attach -> ask -> answer` |
| M2 - Open Beta Foundations  | 2026-03-16 to 2026-03-29 | `0.3.0-beta.*`                   | Settings baseline, local session persistence, provider adapter skeleton  |
| M3 - Open Beta Hardening    | 2026-03-30 to 2026-04-12 | `0.4.0-beta.*`                   | Streaming UX hardening, failure handling, updater confidence             |
| M4 - Open Release Readiness | 2026-04-13 to 2026-04-26 | `0.5.0-beta.*` + stable go/no-go | Full release-readiness pass and first stable candidate                   |

## Exit criteria by milestone

### M1

- Core flow works on Windows.
- No open `severity/p0` in scope.
- Required CI checks are green.

### M2

- Critical path has unit/integration/smoke coverage.
- No open `severity/p0` or `release/blocker` in scope.
- Changelog entries are releasable.

### M3

- Reliability trend is stable or improving.
- MTTR process is exercised at least once.
- No unresolved launch-blocking reliability risks.

### M4

- `RELEASE_CHECKLIST.md` is executed on candidate build.
- No open `severity/p0` or `release/blocker` issues.
- Stable go/no-go decision is recorded with owner and timestamp.

## Release cadence

- `beta`: weekly target, mandatory decision each milestone boundary.
- `stable`: decision each milestone boundary, publish at least every 4 weeks if gates pass.
- Full operational steps and gates are defined in [`RELEASE_CHECKLIST.md`](./RELEASE_CHECKLIST.md).

## Metrics to track per milestone

- deployment frequency (`beta`, `stable`)
- lead time for changes
- change failure rate
- MTTR
- pass rate of the core flow

## Next 2-week focus

1. Assign owners and estimates for M1 issues.
2. Keep implementation scope frozen to M1 slice.
3. Prepare milestone review summary and metric capture template.

## Update policy

- Update this file at each milestone boundary.
- Record major scope or policy changes with date.
