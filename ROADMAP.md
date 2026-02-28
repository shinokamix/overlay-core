# overlay-core Roadmap and Release Plan (2026)

_Last updated: 2026-02-28_

## Direction Update

- All roadmap milestones are now fixed to 2-week windows.
- Closed beta is removed. Development and validation are open by default.
- Release planning remains two-channel (`beta` and `stable`) with explicit go/no-go gates.

## Current State Snapshot (verified on 2026-02-28)

### Product implementation

- Bootstrap shell is implemented with app-level overlay visibility state.
- The first vertical slice target is declared (`hotkey -> screenshot -> attach -> ask -> answer`) but is not fully implemented.
- Feature slices for capture/chat/providers are not yet present under `src/features`.

### Delivery system

- CI is in place: format, lint, typecheck, tests, build, Rust checks, Playwright smoke.
- Release channels are configured:
  - `beta`: manual workflow to the `beta` prerelease tag.
  - `stable`: push `vX.Y.Z` tag to publish stable release.
- Updater endpoints for stable and beta are already configured.

### Completed since initial roadmap draft

- `CHANGELOG.md` added and required in PR checklist for user-facing changes.
- `RELEASE_CHECKLIST.md` added with go/no-go, rollback, and post-release checks.
- Unified version bump command added: `npm run version:bump -- <version>`.
- Severity and release-impact taxonomy added (`severity/*`, `release/*` labels).
- GitHub milestones `M1..M4` created.
- Initial milestone backlog issues created and mapped (`#8..#23`).

## Milestone Cadence

- Each milestone is 14 days.
- End of each milestone includes:
  - milestone review/demo;
  - beta release decision and publish (if go);
  - stable release decision (if go).
- Work is tracked publicly in open milestones and issues.

## Release Milestones (2 weeks each, open)

| Milestone                   | Window                   | Release target                     | Primary outcome                                                           |
| --------------------------- | ------------------------ | ---------------------------------- | ------------------------------------------------------------------------- |
| M1 - Open Alpha Slice       | 2026-03-02 to 2026-03-15 | `0.2.0-beta.*`                     | End-to-end first slice: `hotkey -> screenshot -> attach -> ask -> answer` |
| M2 - Open Beta Foundations  | 2026-03-16 to 2026-03-29 | `0.3.0-beta.*`                     | Settings baseline, local session persistence, provider adapter skeleton   |
| M3 - Open Beta Hardening    | 2026-03-30 to 2026-04-12 | `0.4.0-beta.*`                     | Streaming UX hardening, failure handling, updater confidence              |
| M4 - Open Release Readiness | 2026-04-13 to 2026-04-26 | `0.5.0-beta.*` and stable go/no-go | Release-readiness pass with open rollout and first stable candidate       |

### M1 - Open Alpha Slice (2026-03-02 to 2026-03-15)

Scope focus:

- Global hotkey toggles overlay.
- User can capture screenshot and manage attachment draft queue.
- User can send prompt with attachment context and receive model response.

Exit criteria:

- Core flow works on Linux and Windows.
- No open `severity/p0` issues in milestone scope.
- CI required checks are green on release candidate commit.

### M2 - Open Beta Foundations (2026-03-16 to 2026-03-29)

Scope focus:

- Settings UX (hotkeys, overlay behavior, provider setup).
- Local session persistence baseline.
- Provider adapter abstraction with one production-grade provider integration.

Exit criteria:

- Critical user path has automated coverage across unit/integration/smoke.
- No open `severity/p0` or `release/blocker` issues for milestone scope.
- Changelog entries are complete and releasable.

### M3 - Open Beta Hardening (2026-03-30 to 2026-04-12)

Scope focus:

- Streaming response UX, loading states, and retry/error UX.
- Updater reliability and failure recovery checks.
- Performance/usability fixes on core flow.

Exit criteria:

- Change failure rate trend is stable or improving.
- MTTR process is exercised on at least one simulated incident.
- No unresolved launch-blocking reliability risks in scope.

### M4 - Open Release Readiness (2026-04-13 to 2026-04-26)

Scope focus:

- Full release checklist dry-run to production standard.
- Public documentation pass for setup/upgrade/known issues.
- Final readiness review for stable release candidate.

Exit criteria:

- `RELEASE_CHECKLIST.md` executed successfully for candidate.
- No open `severity/p0` or `release/blocker` issues.
- Stable release go/no-go decision documented with owner and timestamp.

## Release Cadence and Gates

### Beta cadence

- Target cadence: weekly, with mandatory decision at each 2-week milestone boundary.
- Trigger: manual `.github/workflows/release-beta.yml` run from `main`.
- Purpose: open validation and quick feedback.

Go/no-go gate:

- Milestone scope is frozen for release candidate.
- CI required checks are green on release commit.
- Changelog and release notes are ready.
- Smoke test on packaged app passes.

### Stable cadence

- Stable decision point: every milestone boundary (every 2 weeks).
- Stable publish target: at least once every 4 weeks if quality gates pass.
- Trigger: push `vX.Y.Z` tag to `main` commit.

Go/no-go gate:

- No open `severity/p0`, `severity/p1`, or `release/blocker` issues.
- Version numbers are aligned (`package.json`, `src-tauri/Cargo.toml`, `src-tauri/tauri.conf.json`).
- Rollback owner and path are confirmed.

## Metrics

Track per milestone:

- Deployment frequency (`beta`, `stable`).
- Lead time for changes (PR open to release).
- Change failure rate.
- MTTR.
- Critical flow pass rate (`hotkey -> screenshot -> attach -> ask -> answer`).

Target direction:

- `beta`: 2 to 4 releases per month.
- `stable`: at least 1 release per month after milestone quality stabilizes.
- MTTR: under 48 hours for `severity/p1` incidents.

## Next Actions (next 2 weeks)

1. Assign owners and estimates for M1 issues `#8..#11`.
2. Start implementation of M1 vertical slice and keep scope frozen to M1.
3. Define metric capture template for M1 close (`2026-03-15`).
4. Prepare milestone review summary template for public update.

## Review Rules

- Update this roadmap at each milestone boundary (every 2 weeks).
- Record major scope/policy changes with exact date in this file.
