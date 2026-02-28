# AGENTS.md - repo instructions for automated agents

Follow these rules when making changes in this repository.

## Project context

- Frontend: TypeScript/React (validated via `npm run check`)
- Desktop shell: Tauri (Rust) in `src-tauri`
- Architecture: FSD-oriented structure (`app`, `features`, `shared`)

## Workflow

- Every new task (feature, fix, refactor, docs/test/ci change) must start in a fresh branch created from `main`.
- Do not reuse an old task branch for a new request, even if branch names are similar.
- Never commit directly to `main`.
- If user explicitly asks to continue an existing branch, continue only that same scope.
- If worktree is dirty before starting a new task, stop and ask the user how to proceed.
- Make focused, minimal changes with a clear rationale.
- Run all required local checks before finishing.
- Assume `main` is protected and merges require green required CI checks.
- Do NOT create or open pull requests; the user will do that.

## Branch start protocol (required)

Run this at the start of each new task:

1. Ensure worktree is clean (`git status --short`).
2. Sync `main` from remote.
3. Create a new branch from updated `main`.
4. Confirm current branch is not `main`.

Suggested commands:

```bash
git fetch origin main
git switch main
git pull --ff-only origin main
git switch -c <type>/<short-kebab-name>
git branch --show-current
```

If `origin` is not configured, use local `main` as the source branch.

## Execution contract (required)

At task start:

1. Classify scope (`feat`, `fix`, `refactor`, `chore`, `docs`, `test`, `ci`).
2. Create a branch name from that scope.
3. Keep change set focused to one logical task.

During implementation:

- Prefer reading architecture context first: `README.md`, `ARCHITECTURE.md`, and nearest local docs.
- For risky edits, run targeted checks first, then run required full checks.
- Do not make unrelated refactors in the same task branch.

At task finish, report:

- Files changed and why.
- Checks run and results.
- Remaining risks or follow-ups.

## Branch naming

Use one of these prefixes:

- `feat/<short-kebab-name>`
- `fix/<short-kebab-name>`
- `refactor/<short-kebab-name>`
- `chore/<short-kebab-name>`
- `docs/<short-kebab-name>`
- `test/<short-kebab-name>`
- `ci/<short-kebab-name>`

## Local checks (must pass)

- `npm run check`
- `cargo check --manifest-path src-tauri/Cargo.toml`

## CI awareness

Changes should not introduce failures in CI checks:

- Frontend: format, lint, typecheck, test, build
- Rust/Tauri: `cargo fmt --check`, `cargo clippy -D warnings`, `cargo check --all-targets`
- E2E smoke: Playwright (`npm run e2e`)

## Commit quality gates (respect hooks)

- `pre-commit`: `lint-staged` (Prettier + ESLint on staged files)
- `pre-push`: `npm run prepush:verify` (typecheck + test)

## Coding rules

- Keep architecture FSD-oriented: `app`, `features`, `shared`.
- Dependency direction:
  - `app` may depend on `features` and `shared`.
  - `features` may depend only on `shared`.
  - `shared` must not import from `app` or `features`.
- Put global shell state in `app/model`.
- Put user actions/business flows in `features/*`.
- Reusable UI primitives belong to `shared/ui`.
- Keep changes small and testable.
- Do not introduce dependency changes without clear need.

## Documentation rules

Update documentation in the same task when changes affect behavior or process:

- update `CHANGELOG.md` for user-facing behavior changes;
- update `ROADMAP.md` at milestone boundaries or when planning policy changes;
- update `RELEASE_CHECKLIST.md` when release operations/go-no-go gates change;
- update `ARCHITECTURE.md` when module boundaries or dependency direction changes;
- update `README.md` when setup, scripts, or top-level navigation changes.

## Security and env

- Never commit secrets or real API keys.
- Keep `.env.example` in sync when environment variables change.

## PR checklist (prepare for the user)

- Scope is focused and explained.
- Tests added/updated where needed.
- `npm run check` passes.
- `cargo check --manifest-path src-tauri/Cargo.toml` passes.
- Docs updated if behavior/structure changed.

## Definition of done

- If any required check fails, fix issues and re-run until green.
- Prefer editing the smallest possible set of files; avoid touching unrelated files.
- Avoid unrelated refactors or formatting-only diffs.
- Summarize what changed, why, and how it was verified (commands run).
