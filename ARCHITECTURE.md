# Architecture

## Layers

- `app`: application shell, global providers, app-level model/state
- `features`: user-facing business actions and workflows
- `shared`: reusable UI primitives and low-level utilities

## Current modules

- `src/app/main.tsx`: app bootstrap and providers
- `src/app/App.tsx`: shell layout and feature composition
- `src/app/model`: app-level state and shell hooks (`overlay-store`, window size sync)
- `src/features/hotkey-settings`: loading/updating desktop hotkey bindings
- `src/features/overlay-interaction`: interaction mode sync and toggle flow
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
