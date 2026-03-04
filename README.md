# overlay-core

Windows-first, local-first desktop AI overlay built with Tauri + React.

## What this repo contains

- Hotkey-driven overlay shell.
- In-app hotkey settings and overlay interaction controls.
- Frontend and Rust/Tauri quality gates wired in CI.

Current product slice is still in active development.

## Requirements

- Node.js 20+
- npm 10+
- Rust stable toolchain
- Windows 10/11 (desktop runtime target)

## Quick start

```bash
npm ci
npm run dev
```

Run desktop app:

```bash
npm run tauri dev
```

## Required checks before PR

```bash
npm run check
cargo check --manifest-path src-tauri/Cargo.toml
```

## Common scripts

- `npm run dev` - start web dev server
- `npm run tauri dev` - run desktop app
- `npm run build` - production frontend build
- `npm run check` - frontend quality gate (`format:check`, `lint`, `typecheck`, `test`)
- `npm run e2e` - Playwright smoke tests
- `npm run version:bump -- <version>` - sync version in JS + Tauri manifests

## Documentation map

- [`CONTRIBUTING.md`](./CONTRIBUTING.md) - contribution workflow and local gates
- [`ARCHITECTURE.md`](./ARCHITECTURE.md) - module boundaries and dependency rules
- [`ROADMAP.md`](./ROADMAP.md) - current milestone plan and release cadence
- [`RELEASE_CHECKLIST.md`](./RELEASE_CHECKLIST.md) - release go/no-go and rollback SOP
- [`CHANGELOG.md`](./CHANGELOG.md) - user-facing changes
- [`SECURITY.md`](./SECURITY.md) - vulnerability reporting policy
- [`AGENTS.md`](./AGENTS.md) - automation rules for coding agents
- [`.github/ISSUE_LABELS.md`](./.github/ISSUE_LABELS.md) - bug triage taxonomy

## High-level structure

```text
src/
  app/        # shell composition and global state
  features/   # user-facing flows
  shared/     # reusable ui and low-level utilities
src-tauri/    # Rust runtime, commands, window/hotkey integration
e2e/          # Playwright smoke tests
```

## License

MPL-2.0. See [`LICENSE`](./LICENSE).
