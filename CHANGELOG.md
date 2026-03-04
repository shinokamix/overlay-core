# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html)
for stable releases.

Write entries from user impact first, then technical detail.

## [Unreleased]

### Added

- Global overlay hotkey support with default `Ctrl+Shift+Space` to hide/show the main overlay window.
- Dedicated global hotkey support with default `Ctrl+Shift+Enter` to toggle temporary overlay interactivity.
- Tauri hotkey bindings API scaffolding (`get_hotkey_bindings` / `update_hotkey_binding`) for upcoming user-configurable shortcuts in Settings.
- Single-instance CLI toggle entrypoint (`overlay-core --toggle-overlay`) to trigger visibility toggle in existing app instance.
- Hotkeys settings panel in app UI with editable toggle shortcut.

### Changed

- Main Tauri window now starts in overlay mode: undecorated (no native titlebar/buttons), non-minimizable, always on top, hidden from taskbar, visible across workspaces where supported, and marked as content-protected to stay out of screen capture on supported platforms.
- The desktop target is now Windows-only, and non-Windows builds fail at compile time.
- Overlay window now runs in passive click-through mode by default and switches to interactive mode only when toggled by hotkey or UI action.
- Overlay shell now uses a transparent, compact window that tracks content size instead of relying on a large fullscreen transparent surface.

### Removed

- Linux support and Hyprland-specific hotkey/app window flows.
