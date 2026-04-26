use tauri::AppHandle;

use crate::features::providers::model::{
    ChatMessageInput, ChatMessageResponse, ProviderSettingsInput, ProviderSettingsView,
};
use crate::features::providers::service;

pub fn get_provider_settings(app: AppHandle) -> Result<Option<ProviderSettingsView>, String> {
    service::get_provider_settings(&app)
}

pub fn save_provider_settings(
    app: AppHandle,
    input: ProviderSettingsInput,
) -> Result<ProviderSettingsView, String> {
    service::save_provider_settings(&app, input)
}

pub fn remove_provider_credentials(app: AppHandle) -> Result<Option<ProviderSettingsView>, String> {
    service::remove_provider_credentials(&app)
}

pub async fn send_chat_message(
    app: AppHandle,
    input: ChatMessageInput,
) -> Result<ChatMessageResponse, String> {
    service::send_chat_message(&app, input).await
}
