# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html)
for stable releases.

## [Unreleased]

### Added

- _Nothing yet._

### Changed

- Main Tauri window now starts in overlay mode: always on top, hidden from taskbar, visible across workspaces where supported, and marked as content-protected to stay out of screen capture on supported platforms.
- On Linux/Hyprland, runtime `hyprctl` dispatch is applied to force the app window into `floating + pinned` state and enable `no_screen_share`, so overlay behavior works under Wayland compositing limits.

### Fixed

- _Nothing yet._

### Security

- _Nothing yet._
