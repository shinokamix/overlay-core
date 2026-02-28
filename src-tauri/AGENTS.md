# AGENTS.md - src-tauri

This file applies to `src-tauri/**` and extends root `AGENTS.md`.

## Scope

- Rust/Tauri desktop shell code and config in `src-tauri`.
- Keep changes minimal and focused on desktop/runtime concerns.

## Rust quality gates

- `cargo fmt --manifest-path src-tauri/Cargo.toml --all -- --check`
- `cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings`
- `cargo check --manifest-path src-tauri/Cargo.toml --all-targets`

## Implementation rules

- Do not weaken lints or checks to make CI pass.
- Avoid broad dependency upgrades unless required for the task.
- Keep security-sensitive config deliberate (updater/signing/release settings).
- If frontend and Tauri must change together, keep interface contracts explicit.
