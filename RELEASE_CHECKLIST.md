# Release Checklist

Use this checklist for every release in `overlay-core`.

## Scope

- Applies to both release channels:
  - `beta` via `.github/workflows/release-beta.yml`
  - `stable` via `.github/workflows/release-stable.yml`
- Release owner is responsible for go/no-go decision, execution, and post-release verification.

## Shared Preconditions (all releases)

- Target commit is on `main` and has green required CI (`CI (required)`).
- No open release-blocking issues for the selected scope.
- `CHANGELOG.md` is updated for user-facing changes (or explicitly marked N/A).
- Updater signing secrets are present in repository settings.
- Local sanity checks pass:
  - `npm run check`
  - `cargo check --manifest-path src-tauri/Cargo.toml`

## Beta Release (`beta` tag)

Go/no-go:

- Scope for the cycle is frozen.
- No known `P0`/`P1` regressions for the targeted beta scope.
- Release notes are drafted from `CHANGELOG.md` and merged PRs.

Execution:

1. Ensure local `main` is up to date.
2. Open GitHub Actions and run `Release Beta` from `main`.
3. Wait for both matrix builds (Linux and Windows) to finish.
4. Verify GitHub prerelease `beta` has fresh artifacts for both platforms.
5. Verify updater artifact `latest.json` is present under `beta` release assets.

Post-release verification:

- Install or update from beta channel on at least one Linux and one Windows machine.
- Perform smoke flow: launch app, show/hide overlay, basic UI interaction.
- Monitor issues/crash reports for 24 hours and triage within severity SLA.

## Stable Release (`vX.Y.Z` tag)

Go/no-go:

- Milestone must-have issues are closed.
- No open `P0`/`P1` issues.
- Version numbers are aligned in:
  - `package.json`
  - `src-tauri/Cargo.toml`
  - `src-tauri/tauri.conf.json`
- `CHANGELOG.md` includes finalized entries for the target version.

Execution:

1. Sync and verify local `main`.
2. Bump versions with one command: `npm run version:bump -- X.Y.Z`.
3. Commit version and changelog updates on `main` via regular PR process.
4. Create annotated tag: `git tag -a vX.Y.Z -m "overlay-core vX.Y.Z"`.
5. Push tag: `git push origin vX.Y.Z`.
6. Wait for `Release Stable` workflow to complete on Linux and Windows.
7. Confirm release `vX.Y.Z` contains expected artifacts and `latest.json`.

Post-release verification:

- Validate updater endpoint serves the new `latest.json`.
- Verify installation/update on Linux and Windows.
- Publish release notes and known issues summary.

## Rollback / Hotfix Playbook

Do not delete published stable tags.

If beta release is bad:

1. Identify last known good commit.
2. Re-run `Release Beta` workflow from a ref that points to that commit.
3. Confirm beta artifacts are replaced and announce rollback in release notes/issues.

If stable release is bad:

1. Open high-priority incident and assign incident owner.
2. Prepare patch on `main` (`fix/...`) and validate with required checks.
3. Publish hotfix as next patch version (`vX.Y.(Z+1)`).
4. Update `CHANGELOG.md` with incident impact and fix.

## Release Record

For each release, capture:

- version/tag and channel;
- release owner;
- go/no-go timestamp;
- link to workflow run;
- verification result (Linux, Windows);
- follow-up issues created.
