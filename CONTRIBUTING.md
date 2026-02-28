# Contributing

## Prerequisites

- Node.js 20+
- npm 10+
- Rust stable toolchain

## Quick start

```bash
npm ci
npm run check
cargo check --manifest-path src-tauri/Cargo.toml
```

## Workflow

1. Start every new task in a fresh branch created from `main`.
2. Make focused changes.
3. Run local checks.
4. Open a PR with a clear scope and rationale.
5. Merge only after required CI checks pass.

Branch policy is strict:

- One task = one branch.
- Never push commits directly to `main`.
- Do not reuse previous task branches for new work.
- If you need to continue an old branch, do it only for the same task scope.

Recommended start commands:

```bash
git fetch origin main
git switch main
git pull --ff-only origin main
git switch -c <type>/<short-kebab-name>
```

`main` is protected:

- Direct pushes to `main` are not allowed.
- Changes must go through pull requests.
- Merge is allowed only when required CI checks are green.

If your local worktree is dirty before starting a new task, either commit/stash first or open a separate branch for that existing work.

## Branch naming

Use one of these prefixes:

- `feat/<short-kebab-name>`
- `fix/<short-kebab-name>`
- `refactor/<short-kebab-name>`
- `chore/<short-kebab-name>`
- `docs/<short-kebab-name>`
- `test/<short-kebab-name>`
- `ci/<short-kebab-name>`

Branch names are validated in CI for pull requests to `main`.

## Local checks

```bash
npm run check
cargo check --manifest-path src-tauri/Cargo.toml
```

## Commit quality gates

- `pre-commit`: runs `lint-staged` (Prettier + ESLint on staged files)
- `pre-push`: runs `npm run prepush:verify` (`typecheck + test`)

## Coding rules

- Keep architecture FSD-oriented (`app`, `features`, `shared`).
- Respect dependency direction:
  - `app` may depend on `features` and `shared`.
  - `features` may depend only on `shared`.
  - `shared` must not import from `app` or `features`.
- Put global shell state in `app/model`.
- Put user actions/business flows in `features/*`.
- Reusable UI primitives belong to `shared/ui`.
- Keep changes small and testable.
- Do not add dependency changes without clear need.

## Scope guidance

- Keep PRs single-purpose and reviewable.
- Split unrelated work into separate branches/PRs.
- Update docs when behavior or project workflow changes.

## Issue triage labels

Severity and release-blocking labels are defined in
`.github/ISSUE_LABELS.md`.

Use this taxonomy for all bug triage:

- assign exactly one `severity/*` label (`severity/p0`..`severity/p3`);
- assign one `release/*` label for milestone-tracked bugs;
- treat `severity/p0` and `severity/p1` as release blockers by default.

## Ownership and review routing

- `CODEOWNERS` is used for automatic reviewer assignment.
- Keep ownership mappings current when new top-level areas are added.

## PR checklist

- [ ] Scope is focused and explained
- [ ] Tests added/updated where needed
- [ ] `CHANGELOG.md` updated for user-facing changes (or marked as not applicable)
- [ ] `npm run check` passes
- [ ] `cargo check --manifest-path src-tauri/Cargo.toml` passes
- [ ] Docs updated if behavior/structure changed
