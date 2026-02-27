# Contributing

## Workflow

1. Create a branch from `main`.
2. Make focused changes.
3. Run local checks.
4. Open a PR with a clear scope and rationale.

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
- Put global shell state in `app/model`.
- Put user actions/business flows in `features/*`.
- Reusable UI primitives belong to `shared/ui`.
- Keep changes small and testable.

## PR checklist

- [ ] Scope is focused and explained
- [ ] Tests added/updated where needed
- [ ] `npm run check` passes
- [ ] `cargo check --manifest-path src-tauri/Cargo.toml` passes
- [ ] Docs updated if behavior/structure changed
