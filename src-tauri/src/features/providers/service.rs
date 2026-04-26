use std::{collections::HashMap, fs, io, path::PathBuf};

use reqwest::StatusCode;
use tauri::{AppHandle, Manager};

use crate::features::providers::credentials;
use crate::features::providers::model::{
    ChatMessageInput, ChatMessageResponse, OpenAiChatRequest, OpenAiChatResponse,
    ProviderConfigFile, ProviderSettings, ProviderSettingsInput, ProviderSettingsView,
};

const PROVIDERS_CONFIG_FILE: &str = "providers.json";
const LEGACY_PROVIDERS_AUTH_FILE: &str = "providers.auth.json";

#[derive(Default, serde::Deserialize, serde::Serialize)]
struct LegacyProviderAuthFile {
    credentials: HashMap<String, LegacyProviderCredentials>,
}

#[derive(serde::Deserialize, serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct LegacyProviderCredentials {
    api_key: String,
}

fn provider_settings_dir(app: &AppHandle) -> Result<PathBuf, String> {
    app.path()
        .app_config_dir()
        .map(|path| path.join("providers"))
        .map_err(|error| format!("failed to resolve providers settings directory: {error}"))
}

fn config_path(app: &AppHandle) -> Result<PathBuf, String> {
    Ok(provider_settings_dir(app)?.join(PROVIDERS_CONFIG_FILE))
}

fn legacy_auth_path(app: &AppHandle) -> Result<PathBuf, String> {
    Ok(provider_settings_dir(app)?.join(LEGACY_PROVIDERS_AUTH_FILE))
}

fn read_json<T: Default + serde::de::DeserializeOwned>(path: PathBuf) -> Result<T, String> {
    if !path.exists() {
        return Ok(T::default());
    }

    let content = fs::read_to_string(&path)
        .map_err(|error| format!("failed to read '{}': {error}", path.display()))?;

    serde_json::from_str(&content)
        .map_err(|error| format!("failed to parse '{}': {error}", path.display()))
}

fn write_json<T: serde::Serialize>(path: PathBuf, value: &T) -> Result<(), String> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)
            .map_err(|error| format!("failed to create '{}': {error}", parent.display()))?;
    }

    let content = serde_json::to_string_pretty(value)
        .map_err(|error| format!("failed to serialize provider settings: {error}"))?;

    fs::write(&path, content)
        .map_err(|error| format!("failed to write '{}': {error}", path.display()))
}

fn remove_file_if_exists(path: PathBuf) -> Result<(), String> {
    match fs::remove_file(&path) {
        Ok(()) => Ok(()),
        Err(error) if error.kind() == io::ErrorKind::NotFound => Ok(()),
        Err(error) => Err(format!("failed to remove '{}': {error}", path.display())),
    }
}

fn normalize_base_url(base_url: &str) -> String {
    base_url.trim().trim_end_matches('/').to_string()
}

fn normalize_provider_id(provider_id: &str) -> String {
    provider_id.trim().to_ascii_lowercase()
}

fn validate_provider_id(provider_id: &str) -> Result<(), String> {
    if provider_id.is_empty() {
        return Err("provider id is required".to_string());
    }

    if provider_id.chars().all(|char| {
        char.is_ascii_lowercase() || char.is_ascii_digit() || char == '-' || char == '_'
    }) {
        return Ok(());
    }

    Err("provider id can contain only lowercase letters, numbers, '-' and '_'".to_string())
}

fn validate_settings(settings: ProviderSettings) -> Result<ProviderSettings, String> {
    let provider_id = normalize_provider_id(&settings.provider_id);
    validate_provider_id(&provider_id)?;

    let provider_name = settings.provider_name.trim().to_string();
    if provider_name.is_empty() {
        return Err("provider name is required".to_string());
    }

    let base_url = normalize_base_url(&settings.base_url);
    if !(base_url.starts_with("https://")
        || base_url.starts_with("http://localhost")
        || base_url.starts_with("http://127.0.0.1"))
    {
        return Err("base URL must use https:// or a local http:// address".to_string());
    }

    let model = settings.model.trim().to_string();
    if model.is_empty() {
        return Err("model is required".to_string());
    }

    Ok(ProviderSettings {
        provider_id,
        provider_name,
        base_url,
        model,
    })
}

fn read_config(app: &AppHandle) -> Result<ProviderConfigFile, String> {
    read_json(config_path(app)?)
}

fn migrate_legacy_api_key(app: &AppHandle, provider_id: &str) -> Result<(), String> {
    let path = legacy_auth_path(app)?;
    if !path.exists() {
        return Ok(());
    }

    let mut auth: LegacyProviderAuthFile = read_json(path.clone())?;
    let api_key = auth
        .credentials
        .remove(provider_id)
        .map(|credentials| credentials.api_key.trim().to_string())
        .filter(|api_key| !api_key.is_empty());

    if let Some(api_key) = api_key {
        credentials::save_api_key(provider_id, &api_key)?;
    }

    if auth.credentials.is_empty() {
        remove_file_if_exists(path)
    } else {
        write_json(path, &auth)
    }
}

fn remove_legacy_api_key(app: &AppHandle, provider_id: &str) -> Result<(), String> {
    let path = legacy_auth_path(app)?;
    if !path.exists() {
        return Ok(());
    }

    let mut auth: LegacyProviderAuthFile = read_json(path.clone())?;
    auth.credentials.remove(provider_id);

    if auth.credentials.is_empty() {
        remove_file_if_exists(path)
    } else {
        write_json(path, &auth)
    }
}

fn get_active_settings_and_key(
    app: &AppHandle,
) -> Result<(ProviderSettings, Option<String>), String> {
    let settings = read_config(app)?
        .active
        .ok_or_else(|| "No provider configured. Open Settings -> Providers first.".to_string())?;
    let settings = validate_settings(settings)?;
    migrate_legacy_api_key(app, &settings.provider_id)?;
    let api_key = credentials::get_api_key(&settings.provider_id)?;

    Ok((settings, api_key))
}

pub fn get_provider_settings(app: &AppHandle) -> Result<Option<ProviderSettingsView>, String> {
    let Some(settings) = read_config(app)?.active else {
        return Ok(None);
    };

    let settings = validate_settings(settings)?;
    migrate_legacy_api_key(app, &settings.provider_id)?;
    let has_api_key = credentials::has_api_key(&settings.provider_id)?;

    Ok(Some(ProviderSettingsView {
        provider_id: settings.provider_id,
        provider_name: settings.provider_name,
        base_url: settings.base_url,
        model: settings.model,
        has_api_key,
    }))
}

pub fn save_provider_settings(
    app: &AppHandle,
    input: ProviderSettingsInput,
) -> Result<ProviderSettingsView, String> {
    let settings = validate_settings(ProviderSettings {
        provider_id: input.provider_id,
        provider_name: input.provider_name,
        base_url: input.base_url,
        model: input.model,
    })?;

    write_json(
        config_path(app)?,
        &ProviderConfigFile {
            active: Some(settings.clone()),
        },
    )?;

    if let Some(api_key) = input.api_key.map(|value| value.trim().to_string()) {
        if !api_key.is_empty() {
            credentials::save_api_key(&settings.provider_id, &api_key)?;
        }
    }

    get_provider_settings(app)?.ok_or_else(|| "failed to load saved provider settings".to_string())
}

pub fn remove_provider_credentials(
    app: &AppHandle,
) -> Result<Option<ProviderSettingsView>, String> {
    let Some(settings) = read_config(app)?.active else {
        return Ok(None);
    };
    let settings = validate_settings(settings)?;

    credentials::remove_api_key(&settings.provider_id)?;
    remove_legacy_api_key(app, &settings.provider_id)?;

    get_provider_settings(app)
}

pub async fn send_chat_message(
    app: &AppHandle,
    input: ChatMessageInput,
) -> Result<ChatMessageResponse, String> {
    let message = input.text.trim().to_string();
    if message.is_empty() {
        return Err("message is required".to_string());
    }

    let (settings, api_key) = get_active_settings_and_key(app)?;
    let request = OpenAiChatRequest::user_message(settings.model, message);
    let endpoint = format!("{}/chat/completions", settings.base_url);

    let client = reqwest::Client::new();
    let mut builder = client.post(endpoint).json(&request);
    if let Some(api_key) = api_key {
        builder = builder.bearer_auth(api_key);
    }

    let response = builder
        .send()
        .await
        .map_err(|error| format!("failed to send provider request: {error}"))?;
    let status = response.status();
    let content = response
        .text()
        .await
        .map_err(|error| format!("failed to read provider response: {error}"))?;

    if status != StatusCode::OK {
        return Err(format!("provider returned {status}: {content}"));
    }

    let response: OpenAiChatResponse = serde_json::from_str(&content)
        .map_err(|error| format!("failed to parse provider response: {error}"))?;
    let text = response
        .choices
        .first()
        .map(|choice| choice.message.content.trim().to_string())
        .filter(|content| !content.is_empty())
        .ok_or_else(|| "provider response did not include a message".to_string())?;

    Ok(ChatMessageResponse { text })
}
