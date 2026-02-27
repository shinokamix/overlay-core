# Contributing

## Workflow

1. Create a branch from `main`.
2. Make focused changes.
3. Run local checks.
4. Open a PR with a clear scope and rationale.
5. Merge only after required CI checks pass.

`main` is protected:

- Direct pushes to `main` are not allowed.
- Changes must go through pull requests.
- Merge is allowed only when required CI checks are green.

## Branch naming

Use one of these prefixes:

- `feat/<short-kebab-name>`
- `fix/<short-kebab-name>`
- `refactor/<short-kebab-name>`
- `chore/<short-kebab-name>`
- `docs/<short-kebab-name>`
- `test/<short-kebab-name>`
- `ci/<short-kebab-name>`

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
