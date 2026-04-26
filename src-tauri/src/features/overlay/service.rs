use tauri::{AppHandle, Emitter, Manager};

use crate::app::events::OVERLAY_INTERACTION_CHANGED_EVENT;
use crate::features::overlay::state::OverlayRuntimeState;
use crate::features::overlay::window;
use crate::shared::constants::MAIN_WINDOW_LABEL;

fn emit_overlay_interaction_changed(app: &AppHandle, enabled: bool) {
    if let Err(error) = app.emit(OVERLAY_INTERACTION_CHANGED_EVENT, enabled) {
        eprintln!("failed to emit overlay interaction event: {error}");
    }
}

pub fn configure_main_window_on_startup(app: &AppHandle) {
    if let Some(window) = app.get_webview_window(MAIN_WINDOW_LABEL) {
        window::configure_overlay_window(&window);
        window::apply_default_cursor_behavior(&window);
    } else {
        eprintln!("main window not found: overlay flags were not applied");
    }
}

pub fn set_overlay_interaction_enabled(app: &AppHandle, enabled: bool) -> Result<bool, String> {
    let overlay_state = app.state::<OverlayRuntimeState>();
    overlay_state.set(enabled);

    if let Some(window) = app.get_webview_window(MAIN_WINDOW_LABEL) {
        window
            .set_ignore_cursor_events(!enabled)
            .map_err(|error| format!("failed to set overlay cursor behavior: {error}"))?;
    }

    emit_overlay_interaction_changed(app, enabled);

    Ok(enabled)
}

pub fn toggle_overlay_interaction_enabled(app: &AppHandle) -> Result<bool, String> {
    let next = !app.state::<OverlayRuntimeState>().get();
    set_overlay_interaction_enabled(app, next)
}

pub fn toggle_overlay_visibility(app: &AppHandle) -> Result<(), String> {
    let window = app
        .get_webview_window(MAIN_WINDOW_LABEL)
        .ok_or_else(|| format!("window '{MAIN_WINDOW_LABEL}' is not available"))?;

    let is_visible = window
        .is_visible()
        .map_err(|error| format!("failed to read overlay visibility: {error}"))?;

    if is_visible {
        window
            .hide()
            .map_err(|error| format!("failed to hide overlay window: {error}"))?;
    } else {
        window
            .show()
            .map_err(|error| format!("failed to show overlay window: {error}"))?;

        window::configure_overlay_window(&window);

        let interaction_enabled = app.state::<OverlayRuntimeState>().get();
        window
            .set_ignore_cursor_events(!interaction_enabled)
            .map_err(|error| format!("failed to apply overlay cursor behavior: {error}"))?;
    }

    Ok(())
}
