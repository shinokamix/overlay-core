use tauri::AppHandle;

use crate::features::providers::catalog::{self, ProviderCatalog};
use crate::features::providers::model::{
    ActiveProviderView, ActiveSelectionInput, ChatChunkPayload, ChatMessageInput,
    ChatMessageResponse, NewProviderConnectionInput, ProviderConnectionView, ProviderSettingsInput,
    ProviderSettingsView, UpdateProviderConnectionInput,
};
use crate::features::providers::service;

pub fn list_provider_catalog() -> ProviderCatalog {
    catalog::catalog().clone()
}

pub fn list_provider_connections(app: AppHandle) -> Result<Vec<ProviderConnectionView>, String> {
    service::list_provider_connections(&app)
}

pub fn get_active_provider(app: AppHandle) -> Result<Option<ActiveProviderView>, String> {
    service::get_active_provider(&app)
}

pub fn add_provider_connection(
    app: AppHandle,
    input: NewProviderConnectionInput,
) -> Result<ProviderConnectionView, String> {
    service::add_provider_connection(&app, input)
}

pub fn update_provider_connection(
    app: AppHandle,
    input: UpdateProviderConnectionInput,
) -> Result<ProviderConnectionView, String> {
    service::update_provider_connection(&app, input)
}

pub fn remove_provider_connection(app: AppHandle, id: String) -> Result<(), String> {
    service::remove_provider_connection(&app, id)
}

pub fn set_active_provider(
    app: AppHandle,
    input: ActiveSelectionInput,
) -> Result<ActiveProviderView, String> {
    service::set_active_provider(&app, input)
}

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

pub async fn stream_chat_message(
    app: AppHandle,
    input: ChatMessageInput,
    on_event: tauri::ipc::Channel<ChatChunkPayload>,
) -> Result<(), String> {
    service::stream_chat_message(&app, input, on_event).await
}
