# Contributing

This file is for contributors working on code, docs, and CI changes.

## Prerequisites

- Node.js 20+
- npm 10+
- Rust stable toolchain

## Branch workflow

Every new task starts from fresh `main`.

```bash
git fetch origin main
git switch main
git pull --ff-only origin main
git switch -c <type>/<short-kebab-name>
```

Rules:

- One task = one branch.
- Never push directly to `main`.
- Do not reuse old task branches for new scope.
- Keep commits atomic (one logical change per commit).

Allowed branch prefixes:

- `feat/`
- `fix/`
- `refactor/`
- `chore/`
- `docs/`
- `test/`
- `ci/`

## Required local checks

Run before opening or updating a PR:

```bash
npm run check
cargo check --manifest-path src-tauri/Cargo.toml
```

Execution protocol:

- Run from repository root.
- Use `npm ci` when dependencies may be stale.
- After code edits, run `npm run format` before `npm run check`.
- If checks fail on files outside your task scope, document exact files and ask for scope decision.

Git hooks:

- `pre-commit`: `lint-staged`
- `pre-push`: `npm run prepush:verify`

## PR scope and quality

- Keep PRs single-purpose and reviewable.
- Split unrelated work into separate branches.
- Add or update tests when behavior changes.
- Keep CI green before requesting review.

Use [`.github/PULL_REQUEST_TEMPLATE.md`](./.github/PULL_REQUEST_TEMPLATE.md).

## Architecture and labels

- Follow module boundaries in [`ARCHITECTURE.md`](./ARCHITECTURE.md).
- Use severity and release labels from [`.github/ISSUE_LABELS.md`](./.github/ISSUE_LABELS.md).

## Documentation update rules

Update docs in the same PR when relevant:

- `CHANGELOG.md` - user-visible behavior changes.
- `ROADMAP.md` - milestone plan or release cadence changes.
- `RELEASE_CHECKLIST.md` - release process or go/no-go gate changes.
- `ARCHITECTURE.md` - module boundary or dependency direction changes.
- `README.md` - setup, scripts, or top-level navigation changes.
