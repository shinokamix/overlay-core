# AGENTS.md - src-tauri

This file applies to `src-tauri/**` and extends root `AGENTS.md`.

## Extra rules for Tauri scope

- Keep changes focused on runtime/window/hotkey behavior.
- Do not weaken lints or checks to pass CI.
- Avoid broad dependency upgrades unless required.
- Treat updater/signing/release config as security-sensitive.
- Keep frontend <-> backend command contracts explicit.

## Rust quality gates

- `cargo fmt --manifest-path src-tauri/Cargo.toml --all -- --check`
- `cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings`
- `cargo check --manifest-path src-tauri/Cargo.toml --all-targets`
