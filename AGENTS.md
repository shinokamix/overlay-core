# AGENTS.md

Automation rules for this repository.

## Source-of-truth map

- contribution workflow: `CONTRIBUTING.md`
- architecture boundaries: `ARCHITECTURE.md`
- roadmap and milestones: `ROADMAP.md`
- release operation: `RELEASE_CHECKLIST.md`
- security process: `SECURITY.md`

## Task start protocol (required)

1. Confirm clean worktree (`git status --short`).
2. Sync `main`.
3. Create a fresh branch from updated `main`.
4. Confirm current branch is not `main`.

```bash
git fetch origin main
git switch main
git pull --ff-only origin main
git switch -c <type>/<short-kebab-name>
git branch --show-current
```

If worktree is dirty before a new task, stop and ask the user how to proceed.

## Branch and scope rules

- Never commit directly to `main`.
- One logical task per branch.
- Do not reuse old branches for new scope.
- If user asks to continue existing branch, keep original scope only.
- Do not create or open pull requests; user handles PR actions.

Allowed branch prefixes: `feat/`, `fix/`, `refactor/`, `chore/`, `docs/`, `test/`, `ci/`.

## Implementation rules

- Keep changes minimal and focused.
- Avoid unrelated refactors.
- Keep commits atomic.
- Follow FSD boundaries: `app`, `features`, `shared`.
- Never commit secrets or real API keys.

## Required checks

- `npm run check`
- `cargo check --manifest-path src-tauri/Cargo.toml`

Execution protocol:

- Use `npm ci` before checks when dependencies may be stale.
- Run `npm run format` before `npm run check` after code edits.
- Run checks from repo root only.
- Never report checks as passed if any step fails.
- If `npm run check` fails on files outside task scope, report exact files and stop for user decision.

CI expectations:

- frontend: format, lint, typecheck, test, build
- Rust/Tauri: `cargo fmt --check`, `cargo clippy -D warnings`, `cargo check --all-targets`
- e2e smoke: `npm run e2e`

## Documentation update rules

Update docs in the same task when relevant:

- `CHANGELOG.md` for user-facing behavior changes.
- `ROADMAP.md` for milestone or planning policy changes.
- `RELEASE_CHECKLIST.md` for release process or gate changes.
- `ARCHITECTURE.md` for module boundary changes.
- `README.md` for setup, scripts, or navigation changes.

## Task completion report

Always report:

- files changed and why
- checks run and results
- remaining risks or follow-ups

If checks fail, include failing command and first actionable error block.
