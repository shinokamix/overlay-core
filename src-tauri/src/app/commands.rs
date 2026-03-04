use tauri::{AppHandle, State};

use crate::features::hotkeys::model::{HotkeyAction, HotkeyBinding};
use crate::features::hotkeys::state::HotkeyBindingsState;
use crate::features::overlay::state::OverlayRuntimeState;

#[tauri::command]
pub fn get_hotkey_bindings(hotkeys: State<'_, HotkeyBindingsState>) -> Vec<HotkeyBinding> {
    crate::features::hotkeys::commands::get_hotkey_bindings(hotkeys)
}

#[tauri::command]
pub fn update_hotkey_binding(
    app: AppHandle,
    hotkeys: State<'_, HotkeyBindingsState>,
    action: HotkeyAction,
    accelerator: String,
) -> Result<(), String> {
    crate::features::hotkeys::commands::update_hotkey_binding(app, hotkeys, action, accelerator)
}

#[tauri::command]
pub fn get_overlay_interaction_enabled(runtime_state: State<'_, OverlayRuntimeState>) -> bool {
    crate::features::overlay::commands::get_overlay_interaction_enabled(runtime_state)
}

#[tauri::command]
pub fn set_overlay_interaction_enabled_command(
    app: AppHandle,
    enabled: bool,
) -> Result<bool, String> {
    crate::features::overlay::commands::set_overlay_interaction_enabled_command(app, enabled)
}

#[tauri::command]
pub fn toggle_overlay_interaction_enabled_command(app: AppHandle) -> Result<bool, String> {
    crate::features::overlay::commands::toggle_overlay_interaction_enabled_command(app)
}
