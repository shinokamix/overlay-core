# Architecture

## Layers

- `app`: application shell, global providers, app-level model/state
- `features`: user-facing business actions and workflows
- `shared`: reusable UI primitives and low-level utilities

## Current modules

- `src/app/main.tsx`: app bootstrap and providers
- `src/app/App.tsx`: current shell UI
- `src/app/model`: app-level state (`overlay-store`)
- `src/shared/config`: runtime environment parsing/validation
- `src/shared/lib`: shared infrastructure (`query-client`, `logger`, `utils`)
- `src/shared/ui`: reusable UI primitives (shadcn-based)
- `src-tauri`: native runtime and capabilities

### Tauri backend modules (`src-tauri/src`)

- `app/bootstrap`: Tauri builder wiring, plugin setup, startup flow
- `app/commands`: centralized command export for `invoke_handler`
- `app/state`: app-managed runtime state registration
- `app/events`: backend event channel names
- `features/hotkeys`: hotkey models, state, commands, and registration/update services
- `features/overlay`: overlay window/runtime state, commands, and interaction/visibility services
- `shared/constants`: backend constants shared across features

## Architectural constraints

- `app` may depend on `features` and `shared`.
- `features` may depend on `shared`, but not on `app` or other features internals.
- `shared` cannot import from `app` or `features`.

## Testing strategy

- Unit tests: near module boundaries (store/config/lib)
- Integration tests: app-level interactions
- E2E smoke: app shell startup and critical visible controls

## Near-term target

First vertical slice:
`hotkey -> show overlay -> screenshot -> attach -> ask -> answer`
