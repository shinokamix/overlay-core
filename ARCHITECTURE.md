# Architecture

This file defines module boundaries and dependency direction.

## Layers

- `app` - shell composition, providers, and global app state.
- `features` - user-facing flows and business actions.
- `shared` - reusable UI primitives and low-level utilities.

## Dependency rules (strict)

- `app` may import from `features` and `shared`.
- `features` may import only from `shared`.
- `shared` must not import from `app` or `features`.

## Frontend module map

- `src/app/main.tsx` - bootstrap and root providers.
- `src/app/App.tsx` - shell layout and feature composition.
- `src/app/model` - global overlay/window state and shell hooks.
- `src/features/hotkey-settings` - load/update hotkey bindings.
- `src/features/overlay-interaction` - passive/interactive mode toggle flow.
- `src/shared/config` - environment parsing and validation.
- `src/shared/lib` - shared infra (`logger`, query client, helpers).
- `src/shared/ui` - reusable UI components.

## Tauri module map (`src-tauri/src`)

- `app/bootstrap` - Tauri builder and plugin wiring.
- `app/commands` - command exports for `invoke_handler`.
- `app/state` - backend runtime state registration.
- `app/events` - backend event channel names.
- `features/hotkeys` - models, commands, registration, update services.
- `features/overlay` - window state, commands, visibility/interaction services.
- `shared/constants` - backend constants shared across modules.

## Placement rules

- Global shell state belongs in `app/model`.
- User actions and business flows belong in `features/*`.
- Reusable UI primitives belong in `shared/ui`.

## Test boundaries

- Unit tests: config, stores, shared utilities.
- Integration tests: app shell + feature interaction.
- E2E smoke tests: startup and critical visible controls.
