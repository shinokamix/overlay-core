# overlay-core Roadmap and Release Plan (2026)

_Last updated: 2026-02-28_

## Purpose

This document defines:

- release milestones and target outcomes;
- release readiness gates for `beta` and `stable`;
- operating cadence for planning, release, and follow-up;
- explicit gaps to close before `1.0.0`.

It complements `README.md` (project overview) and `ARCHITECTURE.md` (technical structure).

## Current State Snapshot (verified on 2026-02-28)

### Product implementation

- Bootstrap shell is implemented with app-level overlay visibility state.
- The first vertical slice target is declared (`hotkey -> screenshot -> attach -> ask -> answer`) but is not fully implemented.
- Feature slices for capture/chat/providers are not yet present under `src/features`.

### Delivery system

- CI is strong for the current scope: format, lint, typecheck, tests, build, Rust checks, Playwright smoke.
- Release channels already exist:
  - `beta`: manual workflow to the `beta` prerelease tag.
  - `stable`: push `vX.Y.Z` tag to publish stable release.
- Updater endpoints are configured for stable and beta channels.

### Additional work needed beyond README

- Add repository changelog policy (`CHANGELOG.md` + release note discipline).
- Define version synchronization policy across `package.json`, `src-tauri/Cargo.toml`, and `src-tauri/tauri.conf.json`.
- Add a release runbook (go/no-go checks, rollback, post-release verification).
- Establish delivery metric baseline (DORA + product quality indicators).
- Set milestone ownership and explicit acceptance criteria in issue tracker.

## Planning and Release Principles

- Plan by outcomes, not feature volume.
- Use short iterations (1-2 weeks) with a usable increment every cycle.
- Keep two channels:
  - frequent `beta` for learning and stabilization;
  - guarded `stable` for production users.
- Keep scope small and merge continuously on short-lived branches.
- Tag stable releases with SemVer (`vMAJOR.MINOR.PATCH`).
- Maintain one source of truth for changes (`CHANGELOG.md`).

## Roadmap Horizons

- `Now` (0-6 weeks): complete and stabilize the first end-to-end vertical slice.
- `Next` (6-12 weeks): harden UX/settings/persistence and improve reliability.
- `Later` (12+ weeks): scale for open beta and GA readiness.

## Release Milestones

| Milestone                 | Target window       | Release train  | Primary outcome                                     |
| ------------------------- | ------------------- | -------------- | --------------------------------------------------- |
| M1 - Technical Alpha      | March-April 2026    | `0.2.0-beta.*` | First working vertical slice on Linux and Windows   |
| M2 - Closed Beta          | May-June 2026       | `0.3.x`        | Daily-usable prototype for a trusted internal group |
| M3 - Open Beta            | July-September 2026 | `0.5.x`        | Wider distribution readiness and supportability     |
| M4 - General Availability | Q4 2026             | `v1.0.0`       | Stable baseline for broad adoption                  |

### M1 - Technical Alpha

Scope focus:

- Global hotkey toggles overlay.
- User can capture screenshot and see draft attachment queue.
- User can send prompt with attachments and receive model response.

Exit criteria:

- No open `P0` defects in milestone scope.
- CI required checks are green.
- At least one successful internal beta cycle with no blocker regressions.
- Update flow is validated in beta channel.

### M2 - Closed Beta

Scope focus:

- Settings UX (hotkeys, overlay behavior, provider config).
- Local session persistence.
- Provider adapter abstraction with at least one production-grade provider.
- Streaming response UX and error states.

Exit criteria:

- Changelog and release notes are consistently produced.
- Crash/error triage process is operating.
- Regression suite covers the critical user path.

### M3 - Open Beta

Scope focus:

- Onboarding and docs for BYOK setup.
- Improved failure recovery and updater confidence.
- Performance/usability tuning for the core loop.

Exit criteria:

- Two consecutive stable releases without critical rollback.
- MTTR and change failure rate are within target.
- User-facing known issues and upgrade guidance are documented.

### M4 - General Availability

Scope focus:

- Reliability and support process hardening.
- Security/privacy baseline sign-off.
- Clear long-term maintenance expectations.

Exit criteria:

- Stable release process is routine and repeatable.
- Clear support policy and issue severity model are in place.
- No unresolved launch-blocking risks in security/privacy/reliability.

## Release Cadence and Gates

### Beta cadence

- Target cadence: weekly or biweekly.
- Trigger: manual `.github/workflows/release-beta.yml` run from `main`.
- Purpose: fast validation and risk burn-down.

Go/no-go gate:

- Scope accepted for the cycle.
- CI required checks are green on release commit.
- Release notes drafted from merged changes.
- Smoke test on packaged app passes.

### Stable cadence

- Target cadence: every 4 weeks (or when milestone criteria are met).
- Trigger: push `vX.Y.Z` tag to `main` commit.
- Purpose: predictable user-facing increments.

Go/no-go gate:

- All milestone must-have issues are closed.
- No open `P0`/`P1` blockers.
- Changelog updated and version numbers aligned.
- Rollback path and owner confirmed.

## Versioning and Changelog Policy

- Follow SemVer for stable tags.
- Use prerelease markers for beta planning and notes.
- Keep app version aligned across:
  - `package.json`;
  - `src-tauri/Cargo.toml`;
  - `src-tauri/tauri.conf.json`.
- Publish `CHANGELOG.md` with sections: `Added`, `Changed`, `Fixed`, `Security`.

## Metrics (baseline and targets)

Track per release cycle:

- Deployment frequency (`beta`, `stable`).
- Lead time for changes (PR open to release).
- Change failure rate (releases requiring urgent fix or rollback).
- MTTR (time from incident detection to mitigation).
- Product quality indicators:
  - crash-free sessions (if telemetry is enabled);
  - critical user flow pass rate (`hotkey -> capture -> ask -> answer`).

Initial target direction:

- `beta`: at least 2 releases per month.
- `stable`: at least 1 release per month once M2 is reached.
- MTTR: under 48 hours for `P1` incidents.

## Operating Rhythm

Weekly:

- Milestone board triage (`Now` lane only).
- Beta go/no-go check and publish decision.

Biweekly:

- Roadmap review: scope changes, risks, dependencies.

Monthly:

- Stable release decision.
- Post-release review with metric snapshot.

## Immediate Actions (next 2 weeks)

1. Create GitHub milestones for `M1`, `M2`, `M3`, `M4` with target windows and owners.
2. Add `CHANGELOG.md` template and enforce changelog updates in PR checklist.
3. Add `RELEASE_CHECKLIST.md` with beta/stable go/no-go and rollback steps.
4. Add a script or documented process to bump version consistently in the three version files.
5. Define issue labels for severity (`P0`..`P3`) and release blocking.

## Review and Update Rules

- Update this roadmap at least once per month or after each major milestone decision.
- Avoid editing past milestones retroactively except for factual corrections.
- Capture scope changes in a dated "Decision Log" section when major scope shifts happen.
