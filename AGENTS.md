# AGENTS.md - repo instructions for automated agents

Follow these rules when making changes in this repository.

## Project context

- Frontend: TypeScript/React (validated via `npm run check`)
- Desktop shell: Tauri (Rust) in `src-tauri`
- Architecture: FSD-oriented structure (`app`, `features`, `shared`)

## Workflow

- If current branch is `main`, create a new branch from `main` (do not commit to `main` directly).
- Make focused, minimal changes with a clear rationale.
- Run all required local checks before finishing.
- Assume `main` is protected and merges require green required CI checks.
- Do NOT create or open pull requests; the user will do that.

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
