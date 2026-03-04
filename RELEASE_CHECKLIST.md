# Release Checklist

Use this checklist for every `beta` and `stable` release.

## Shared preflight (all releases)

- [ ] Release owner is assigned.
- [ ] Target commit is on `main` with green required CI.
- [ ] No open release-blocking issues in scope.
- [ ] `CHANGELOG.md` is updated (or explicitly N/A).
- [ ] Updater signing secrets are present.
- [ ] Local checks pass:
  - [ ] `npm run check`
  - [ ] `cargo check --manifest-path src-tauri/Cargo.toml`

## Beta release (`beta` tag)

Go/no-go:

- [ ] Scope for the cycle is frozen.
- [ ] No known `P0` or `P1` regressions in beta scope.
- [ ] Draft release notes are ready.

Execution:

- [ ] Sync local `main`.
- [ ] Run GitHub Actions workflow: `.github/workflows/release-beta.yml` from `main`.
- [ ] Wait for Windows build completion.
- [ ] Verify prerelease `beta` has fresh artifacts.
- [ ] Verify `latest.json` exists in beta assets.

Post-release verification:

- [ ] Install/update from beta channel on at least one Windows machine.
- [ ] Run smoke flow: launch app, show/hide overlay, basic interaction.
- [ ] Monitor issues/crash reports for 24 hours.

## Stable release (`vX.Y.Z` tag)

Go/no-go:

- [ ] Milestone must-have issues are closed.
- [ ] No open `P0`, `P1`, or `release/blocker` issues.
- [ ] Versions are aligned in:
  - [ ] `package.json`
  - [ ] `src-tauri/Cargo.toml`
  - [ ] `src-tauri/tauri.conf.json`
- [ ] Changelog entries are finalized for target version.

Execution:

- [ ] Sync and verify local `main`.
- [ ] Run `npm run version:bump -- X.Y.Z`.
- [ ] Merge version/changelog update through normal PR flow.
- [ ] Create tag: `git tag -a vX.Y.Z -m "overlay-core vX.Y.Z"`.
- [ ] Push tag: `git push origin vX.Y.Z`.
- [ ] Wait for `.github/workflows/release-stable.yml` completion.
- [ ] Verify release artifacts and `latest.json`.

Post-release verification:

- [ ] Validate stable updater endpoint.
- [ ] Verify install/update on Windows.
- [ ] Publish release notes and known issues summary.

## Rollback and hotfix

Rules:

- [ ] Never delete published stable tags.

If beta is bad:

- [ ] Identify last known good commit.
- [ ] Re-run beta release from that ref.
- [ ] Confirm assets are replaced and announce rollback.

If stable is bad:

- [ ] Open high-priority incident and assign owner.
- [ ] Prepare patch on `main` (`fix/...`) and pass required checks.
- [ ] Publish hotfix as next patch version.
- [ ] Update `CHANGELOG.md` with impact and fix.

## Release record (required)

Capture for each release:

- [ ] version/tag and channel
- [ ] release owner
- [ ] go/no-go timestamp
- [ ] workflow run link
- [ ] Windows verification result
- [ ] follow-up issues
