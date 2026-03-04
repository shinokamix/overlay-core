use tauri::{AppHandle, State};

use crate::features::overlay::service;
use crate::features::overlay::state::OverlayRuntimeState;

pub fn get_overlay_interaction_enabled(runtime_state: State<'_, OverlayRuntimeState>) -> bool {
    runtime_state.get()
}

pub fn set_overlay_interaction_enabled_command(
    app: AppHandle,
    enabled: bool,
) -> Result<bool, String> {
    service::set_overlay_interaction_enabled(&app, enabled)
}

pub fn toggle_overlay_interaction_enabled_command(app: AppHandle) -> Result<bool, String> {
    service::toggle_overlay_interaction_enabled(&app)
}
