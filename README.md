# overlay-core

Local-first desktop AI overlay: capture screen context, attach multiple screenshots, and chat with AI models without leaving your workflow.

## Product Vision

`overlay-core` is the open-core desktop foundation of a cross-platform AI overlay app.

Core idea:

- Hotkey-driven overlay over any desktop app
- Fast context capture (screenshots first)
- Explicit user control (nothing is sent or recorded automatically)
- Provider-agnostic model access via user API keys (BYOK)

Positioning:

- Privacy-oriented productivity tool
- Local-first assistant for work
- Contextual AI sidecar over any app

## Current Status

The project is in the architecture/bootstrap phase.

Implemented:

- Tauri v2 + React + TypeScript + Vite baseline
- Tailwind v4 + shadcn/ui setup
- App-level state (Zustand) and query layer (TanStack Query)
- Runtime env parsing/validation with `zod`
- Global React `ErrorBoundary` and shared logger abstraction
- ESLint + Prettier + Husky + lint-staged quality gates
- Vitest + RTL tests (unit + integration)
- Playwright smoke-test baseline
- GitHub Actions CI for frontend and Rust/Tauri checks
- Contributor and architecture docs + PR/issue templates
- MPL-2.0 license and security policy baseline

Not implemented yet (next milestones):

- Global hotkeys (show/hide overlay)
- Draggable overlay behavior
- Screen capture and attachment draft queue
- Chat timeline and composer
- Provider adapter layer + first model integration
- Streaming responses in UI
- Local session persistence
- Settings UX (hotkeys, overlay behavior, providers)

## Tech Stack

- Desktop shell: Tauri v2 (Rust)
- UI: React 19 + TypeScript
- Bundler: Vite
- Styling: Tailwind CSS v4 + shadcn/ui
- State: Zustand
- Async data: TanStack Query
- Env validation: Zod
- Code quality: ESLint + Prettier + Husky + lint-staged
- Testing: Vitest + React Testing Library + Playwright
- CI: GitHub Actions

## Project Structure

```text
.
├── .github/workflows/ci.yml
├── .github/workflows/release-beta.yml
├── .github/workflows/release-stable.yml
├── .github/PULL_REQUEST_TEMPLATE.md
├── .github/ISSUE_TEMPLATE/
├── ARCHITECTURE.md
├── CONTRIBUTING.md
├── SECURITY.md
├── LICENSE
├── e2e/
├── src
│   ├── app
│   │   ├── model
│   │   ├── providers
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── styles.css
│   ├── shared
│   │   ├── config
│   │   ├── lib
│   │   └── ui
│   └── test
└── src-tauri
```

Layer intent:

- `app`: shell-level composition and global app model
- `features`: user-facing business actions/workflows (capture/chat/providers)
- `shared`: reusable UI primitives and low-level infrastructure

## Development

Requirements:

- Node.js 20+
- npm 10+
- Rust stable toolchain
- Linux dev: Tauri system dependencies (webkit/appindicator/rsvg/patchelf)

Install:

```bash
npm ci
```

Run web UI:

```bash
npm run dev
```

Run desktop app:

```bash
npm run tauri dev
```

## Scripts

- `npm run dev` - start Vite dev server
- `npm run tauri dev` - run Tauri desktop app
- `npm run build` - production build (`tsc + vite build`)
- `npm run check` - local quality gate (`format:check + lint + typecheck + test`)
- `npm run typecheck` - TypeScript checks
- `npm run lint` - ESLint checks
- `npm run lint:fix` - auto-fix lint issues
- `npm run format` - format code with Prettier
- `npm run format:check` - verify formatting
- `npm run test` - run Vitest once
- `npm run test:ci` - run tests in CI-safe mode
- `npm run test:watch` - run Vitest in watch mode
- `npm run test:coverage` - generate coverage report
- `npm run e2e` - run Playwright tests
- `npm run e2e:ui` - run Playwright UI mode
- `npm run e2e:install` - install Playwright Chromium + deps

## Git Hooks

Configured through Husky:

- `pre-commit`: `lint-staged` (Prettier + ESLint on staged files)
- `pre-push`: `npm run prepush:verify` (`typecheck + test`)

## CI Pipeline

Workflow: `.github/workflows/ci.yml`

Jobs:

1. Frontend checks

- `npm ci`
- `npm run format:check`
- `npm run lint`
- `npm run typecheck`
- `npm run test:ci`
- `npm run build`

2. Rust/Tauri checks

- `cargo fmt --check`
- `cargo clippy -D warnings`
- `cargo check --all-targets`

3. E2E smoke

- `npx playwright install --with-deps chromium`
- `npm run e2e`
- Playwright browser cache is restored via GitHub Actions cache.

4. Final required check

- `CI (required)` depends on all jobs above and is used for branch protection.

## CD / Releases

Release channels:

- stable updater endpoint: `https://github.com/shinokamix/overlay-core/releases/latest/download/latest.json`
- beta updater endpoint: `https://github.com/shinokamix/overlay-core/releases/download/beta/latest.json`

Workflows:

- `.github/workflows/release-beta.yml` - manual beta publish, updates `beta` prerelease tag
- `.github/workflows/release-stable.yml` - stable publish on `vX.Y.Z` tag push

### Required GitHub secrets

Updater signing:

- `TAURI_SIGNING_PRIVATE_KEY`
- `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` (optional if key has no password)

macOS signing / notarization (optional but recommended for production):

- `APPLE_CERTIFICATE`
- `APPLE_CERTIFICATE_PASSWORD`
- `KEYCHAIN_PASSWORD`
- `APPLE_ID`
- `APPLE_PASSWORD`
- `APPLE_TEAM_ID`

### Generate updater keypair

```bash
npm run tauri signer generate -- --ci -w ~/.tauri/overlay-core.key
```

Store:

- `~/.tauri/overlay-core.key` in GitHub secret `TAURI_SIGNING_PRIVATE_KEY`
- `~/.tauri/overlay-core.key.pub` in `src-tauri/tauri.conf.json` (`plugins.updater.pubkey`)

## Branch Protection Policy

- `main` is protected.
- Direct pushes to `main` are disabled.
- All changes must go through pull requests.
- Merge is allowed only after required CI checks pass.

## Environment Configuration

Example file: `.env.example`

Current variables:

- `VITE_APP_ENV=development|staging|production`
- `VITE_ENABLE_CRASH_REPORTS=true|false`

Validation is fail-fast at app startup (`src/shared/config/env.ts`).
Never commit real secrets: `.env*` files are git-ignored except `.env.example`.
In CI, environment is set explicitly:

- pull requests to `main` run with `VITE_APP_ENV=staging`
- pushes to `main` run with `VITE_APP_ENV=production`

## Privacy and Safety Principles

- Local-first data handling
- Explicit user control (no hidden capture/send)
- Provider-agnostic model access
- Privacy/productivity positioning (not stealth or cheating tooling)

## Open-Core Direction

Public (`overlay-core`):

- Overlay UX core
- Chat + screenshot attachments
- BYOK + base providers
- Local history/session basics

Planned private/pro tier (outside this repo):

- Recording and meeting analysis workflows
- Premium automation/workflow features
- Licensing and entitlement logic

## Roadmap (Execution Order)

1. Desktop vertical slice:

- Hotkey -> show overlay -> screenshot -> attach -> ask -> answer

2. UX hardening:

- Better interactions, edge cases, and error states

3. Minimal web surface:

- Landing, legal pages, onboarding/account entry points

4. Paid/pro infrastructure later:

- Billing, premium modules, team/sync capabilities

## Contribution

Read:

- `CONTRIBUTING.md`
- `ARCHITECTURE.md`
- `SECURITY.md`

Pre-PR baseline:

```bash
npm run check
cargo check --manifest-path src-tauri/Cargo.toml
```
