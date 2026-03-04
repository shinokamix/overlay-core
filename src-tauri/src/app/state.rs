use crate::features::hotkeys::state::HotkeyBindingsState;
use crate::features::overlay::state::OverlayRuntimeState;
use tauri::Manager;

pub fn register<R: tauri::Runtime>(app: &mut tauri::App<R>) {
    app.manage(HotkeyBindingsState::with_defaults());
    app.manage(OverlayRuntimeState::with_defaults());
}
