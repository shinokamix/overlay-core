use tauri::{AppHandle, State};

use crate::features::hotkeys::model::{HotkeyAction, HotkeyBinding};
use crate::features::hotkeys::service;
use crate::features::hotkeys::state::HotkeyBindingsState;

pub fn get_hotkey_bindings(hotkeys: State<'_, HotkeyBindingsState>) -> Vec<HotkeyBinding> {
    hotkeys.list()
}

pub fn update_hotkey_binding(
    app: AppHandle,
    hotkeys: State<'_, HotkeyBindingsState>,
    action: HotkeyAction,
    accelerator: String,
) -> Result<(), String> {
    service::update_hotkey_binding(&app, &hotkeys, action, accelerator)
}
