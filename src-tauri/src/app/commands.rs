use tauri::{AppHandle, State};

use crate::features::hotkeys::model::{HotkeyAction, HotkeyBinding};
use crate::features::hotkeys::state::HotkeyBindingsState;
use crate::features::overlay::state::OverlayRuntimeState;
use crate::features::providers::catalog::ProviderCatalog;
use crate::features::providers::model::{
    ActiveProviderView, ActiveSelectionInput, ChatMessageInput, ChatMessageResponse,
    NewProviderConnectionInput, ProviderConnectionView, ProviderSettingsInput,
    ProviderSettingsView, UpdateProviderConnectionInput,
};

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

#[tauri::command]
pub fn list_provider_catalog() -> ProviderCatalog {
    crate::features::providers::commands::list_provider_catalog()
}

#[tauri::command]
pub fn list_provider_connections(app: AppHandle) -> Result<Vec<ProviderConnectionView>, String> {
    crate::features::providers::commands::list_provider_connections(app)
}

#[tauri::command]
pub fn get_active_provider(app: AppHandle) -> Result<Option<ActiveProviderView>, String> {
    crate::features::providers::commands::get_active_provider(app)
}

#[tauri::command]
pub fn add_provider_connection(
    app: AppHandle,
    input: NewProviderConnectionInput,
) -> Result<ProviderConnectionView, String> {
    crate::features::providers::commands::add_provider_connection(app, input)
}

#[tauri::command]
pub fn update_provider_connection(
    app: AppHandle,
    input: UpdateProviderConnectionInput,
) -> Result<ProviderConnectionView, String> {
    crate::features::providers::commands::update_provider_connection(app, input)
}

#[tauri::command]
pub fn remove_provider_connection(app: AppHandle, id: String) -> Result<(), String> {
    crate::features::providers::commands::remove_provider_connection(app, id)
}

#[tauri::command]
pub fn set_active_provider(
    app: AppHandle,
    input: ActiveSelectionInput,
) -> Result<ActiveProviderView, String> {
    crate::features::providers::commands::set_active_provider(app, input)
}

#[tauri::command]
pub fn get_provider_settings(app: AppHandle) -> Result<Option<ProviderSettingsView>, String> {
    crate::features::providers::commands::get_provider_settings(app)
}

#[tauri::command]
pub fn save_provider_settings(
    app: AppHandle,
    input: ProviderSettingsInput,
) -> Result<ProviderSettingsView, String> {
    crate::features::providers::commands::save_provider_settings(app, input)
}

#[tauri::command]
pub fn remove_provider_credentials(app: AppHandle) -> Result<Option<ProviderSettingsView>, String> {
    crate::features::providers::commands::remove_provider_credentials(app)
}

#[tauri::command]
pub async fn send_chat_message(
    app: AppHandle,
    input: ChatMessageInput,
) -> Result<ChatMessageResponse, String> {
    crate::features::providers::commands::send_chat_message(app, input).await
}
