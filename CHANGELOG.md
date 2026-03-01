# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html)
for stable releases.

## [Unreleased]

### Added

- Global overlay hotkey support with default `Ctrl+Shift+Space` to hide/show the main overlay window.
- Tauri hotkey bindings API scaffolding (`get_hotkey_bindings` / `update_hotkey_binding`) for upcoming user-configurable shortcuts in Settings.
- Single-instance CLI toggle entrypoint (`overlay-core --toggle-overlay`) to support compositor-managed binds on Wayland/Hyprland.
- Hotkeys settings panel in app UI with editable toggle shortcut and one-click `Apply to Hyprland` workflow (writes bind file, ensures source include, reloads Hyprland).

### Changed

- Main Tauri window now starts in overlay mode: undecorated (no native titlebar/buttons), non-minimizable, always on top, hidden from taskbar, visible across workspaces where supported, and marked as content-protected to stay out of screen capture on supported platforms.
- On Linux/Hyprland, runtime `hyprctl` dispatch is applied to force the app window into `floating + pinned` state and enable `no_screen_share`, so overlay behavior works under Wayland compositing limits.

### Fixed

- _Nothing yet._

### Security

- _Nothing yet._
