# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html)
for stable releases.

Write entries from user impact first, then technical detail.

## [Unreleased]

### Added

- Chat-first overlay shell scaffold with a mock message composer (`Message` input + `Send`) and temporary local mock response flow.
- Header controls with `Settings` trigger and a temporary empty Settings modal.

- Global overlay hotkey support with default `Ctrl+Shift+Space` to hide/show the main overlay window.
- Dedicated global hotkey support with default `Ctrl+Shift+Enter` to toggle temporary overlay interactivity.
- Tauri hotkey bindings API scaffolding (`get_hotkey_bindings` / `update_hotkey_binding`) for upcoming user-configurable shortcuts in Settings.
- Single-instance CLI toggle entrypoint (`overlay-core --toggle-overlay`) to trigger visibility toggle in existing app instance.
- Hotkeys settings panel in app UI now supports per-action shortcut capture for any key combination (including single-key shortcuts), one-click updates, and full hotkey disable via `Clear`.
- Providers settings panel now supports OpenAI-compatible provider setup and desktop chat requests through the configured provider, with API keys stored in the OS credential store.

### Changed

- Main overlay UI now uses a chat-oriented layout with a draggable header region and focus on conversational input flow.
- Settings modal is now rebuilt with shadcn dialog/tabs primitives and structured into category navigation (`MCP servers`, `Hotkeys`, `Skills`, `Providers`) with a dedicated content area.
- Desktop capability permissions now explicitly allow header drag-start and app close actions.
- Main Tauri window now starts in overlay mode: undecorated (no native titlebar/buttons), non-minimizable, always on top, hidden from taskbar, visible across workspaces where supported, and marked as content-protected to stay out of screen capture on supported platforms.
- The desktop target is now Windows-only, and non-Windows builds fail at compile time.
- Overlay window now runs in passive click-through mode by default and switches to interactive mode only when toggled by hotkey or UI action.
- Overlay shell now uses a transparent, compact window that tracks content size instead of relying on a large fullscreen transparent surface.
- Settings modal backdrop now respects the overlay panel rounded corners instead of rendering a square dimming layer.
- Overlay hide/show now preserves the current interaction mode, so showing the window no longer forces click-through after it was interactive before hiding.

### Removed

- Linux support and Hyprland-specific hotkey/app window flows.
