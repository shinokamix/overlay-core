use std::{collections::HashMap, fs, io, path::PathBuf};

use reqwest::StatusCode;
use tauri::{AppHandle, Manager};

use crate::features::providers::catalog::{self, ProviderCatalogEntry, ProviderProtocol};
use crate::features::providers::credentials;
use crate::features::providers::model::{
    ActiveProviderView, ActiveSelection, ActiveSelectionInput, ChatMessageInput,
    ChatMessageResponse, LegacyProviderConfigFile, NewProviderConnectionInput, OpenAiChatRequest,
    OpenAiChatResponse, ProviderConfigFile, ProviderConnection, ProviderConnectionView,
    ProviderSettingsInput, ProviderSettingsView, UpdateProviderConnectionInput,
    PROVIDER_CONFIG_VERSION,
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

// ---------- Filesystem helpers ----------

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

fn read_json_value(path: &PathBuf) -> Result<Option<serde_json::Value>, String> {
    if !path.exists() {
        return Ok(None);
    }

    let content = fs::read_to_string(path)
        .map_err(|error| format!("failed to read '{}': {error}", path.display()))?;

    let value = serde_json::from_str::<serde_json::Value>(&content)
        .map_err(|error| format!("failed to parse '{}': {error}", path.display()))?;

    Ok(Some(value))
}

fn read_optional_json<T: Default + serde::de::DeserializeOwned>(
    path: PathBuf,
) -> Result<T, String> {
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

// ---------- Normalization & validation ----------

fn normalize_base_url(base_url: &str) -> String {
    base_url.trim().trim_end_matches('/').to_string()
}

fn normalize_slug(value: &str) -> String {
    value.trim().to_ascii_lowercase()
}

fn validate_slug(value: &str, kind: &str) -> Result<(), String> {
    if value.is_empty() {
        return Err(format!("{kind} is required"));
    }

    if value.chars().all(|character| {
        character.is_ascii_lowercase()
            || character.is_ascii_digit()
            || character == '-'
            || character == '_'
    }) {
        return Ok(());
    }

    Err(format!(
        "{kind} can contain only lowercase letters, numbers, '-' and '_'"
    ))
}

fn validate_base_url(base_url: &str) -> Result<String, String> {
    let normalized = normalize_base_url(base_url);
    if !(normalized.starts_with("https://")
        || normalized.starts_with("http://localhost")
        || normalized.starts_with("http://127.0.0.1"))
    {
        return Err("base URL must use https:// or a local http:// address".to_string());
    }
    Ok(normalized)
}

fn catalog_entry(provider_id: &str) -> Result<&'static ProviderCatalogEntry, String> {
    catalog::catalog()
        .providers
        .iter()
        .find(|provider| provider.id == provider_id)
        .ok_or_else(|| format!("unknown provider '{provider_id}'"))
}

fn validate_connection(connection: ProviderConnection) -> Result<ProviderConnection, String> {
    let id = normalize_slug(&connection.id);
    validate_slug(&id, "connection id")?;

    let provider_id = normalize_slug(&connection.provider_id);
    let _entry = catalog_entry(&provider_id)?;

    let display_name = connection.display_name.trim().to_string();
    if display_name.is_empty() {
        return Err("connection display name is required".to_string());
    }

    let base_url = validate_base_url(&connection.base_url)?;

    let default_model = connection.default_model.trim().to_string();
    if default_model.is_empty() {
        return Err("default model is required".to_string());
    }

    let custom_models = connection
        .custom_models
        .into_iter()
        .map(|model| model.trim().to_string())
        .filter(|model| !model.is_empty())
        .collect();

    Ok(ProviderConnection {
        id,
        provider_id,
        display_name,
        base_url,
        default_model,
        custom_models,
    })
}

fn next_unique_connection_id(existing: &[ProviderConnection], desired: &str) -> String {
    let base = normalize_slug(desired);
    if !existing.iter().any(|connection| connection.id == base) {
        return base;
    }

    let mut counter: u32 = 2;
    loop {
        let candidate = format!("{base}-{counter}");
        if !existing.iter().any(|connection| connection.id == candidate) {
            return candidate;
        }
        counter += 1;
    }
}

// ---------- Config read / migrate / write ----------

fn migrate_legacy_provider_id(provider_id: &str) -> &'static str {
    // The old presets list used "custom" for the OpenAI-compatible slot; the
    // new catalog distinguishes "custom-openai" from "custom-anthropic".
    match provider_id {
        "custom" => "custom-openai",
        _ => "", // sentinel; only used in the match arm below
    }
}

fn migrate_v1_to_v2(legacy: LegacyProviderConfigFile) -> ProviderConfigFile {
    let Some(active) = legacy.active else {
        return ProviderConfigFile::default();
    };

    let provider_id_input = normalize_slug(&active.provider_id);
    let mapped = migrate_legacy_provider_id(&provider_id_input);
    let candidate_provider_id = if mapped.is_empty() {
        provider_id_input.clone()
    } else {
        mapped.to_string()
    };

    let resolved_provider_id = catalog::catalog()
        .providers
        .iter()
        .find(|provider| provider.id == candidate_provider_id)
        .map(|provider| provider.id.clone())
        .unwrap_or_else(|| "custom-openai".to_string());

    // The legacy file kept the api key under the provider id, so reusing it as
    // the connection id keeps the existing keyring entry addressable.
    let connection_id = normalize_slug(&active.provider_id);
    let display_name = if active.provider_name.trim().is_empty() {
        resolved_provider_id.clone()
    } else {
        active.provider_name.trim().to_string()
    };

    let base_url = normalize_base_url(&active.base_url);
    let default_model = active.model.trim().to_string();

    let connection = ProviderConnection {
        id: connection_id.clone(),
        provider_id: resolved_provider_id,
        display_name,
        base_url,
        default_model: default_model.clone(),
        custom_models: Vec::new(),
    };

    ProviderConfigFile {
        version: PROVIDER_CONFIG_VERSION,
        active: Some(ActiveSelection {
            connection_id,
            model: default_model,
        }),
        connections: vec![connection],
    }
}

fn read_config(app: &AppHandle) -> Result<ProviderConfigFile, String> {
    let path = config_path(app)?;
    let Some(raw) = read_json_value(&path)? else {
        return Ok(ProviderConfigFile::default());
    };

    let version = raw
        .get("version")
        .and_then(|value| value.as_u64())
        .unwrap_or(1);

    if version >= u64::from(PROVIDER_CONFIG_VERSION) {
        let parsed: ProviderConfigFile = serde_json::from_value(raw)
            .map_err(|error| format!("failed to parse '{}': {error}", path.display()))?;
        return Ok(parsed);
    }

    let legacy: LegacyProviderConfigFile = serde_json::from_value(raw)
        .map_err(|error| format!("failed to parse '{}': {error}", path.display()))?;
    let migrated = migrate_v1_to_v2(legacy);
    write_json(path, &migrated)?;
    Ok(migrated)
}

fn write_config(app: &AppHandle, config: &ProviderConfigFile) -> Result<(), String> {
    write_json(config_path(app)?, config)
}

// ---------- Legacy auth file migration (preserves existing behavior) ----------

fn migrate_legacy_api_key(app: &AppHandle, provider_id: &str) -> Result<(), String> {
    let path = legacy_auth_path(app)?;
    if !path.exists() {
        return Ok(());
    }

    let mut auth: LegacyProviderAuthFile = read_optional_json(path.clone())?;
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

    let mut auth: LegacyProviderAuthFile = read_optional_json(path.clone())?;
    auth.credentials.remove(provider_id);

    if auth.credentials.is_empty() {
        remove_file_if_exists(path)
    } else {
        write_json(path, &auth)
    }
}

// ---------- Views ----------

fn connection_view(connection: &ProviderConnection) -> Result<ProviderConnectionView, String> {
    Ok(ProviderConnectionView {
        id: connection.id.clone(),
        provider_id: connection.provider_id.clone(),
        display_name: connection.display_name.clone(),
        base_url: connection.base_url.clone(),
        default_model: connection.default_model.clone(),
        custom_models: connection.custom_models.clone(),
        has_api_key: credentials::has_api_key(&connection.id)?,
    })
}

fn active_view(connection: &ProviderConnection, model: &str) -> Result<ActiveProviderView, String> {
    let entry = catalog_entry(&connection.provider_id)?;
    Ok(ActiveProviderView {
        connection_id: connection.id.clone(),
        provider_id: connection.provider_id.clone(),
        protocol: entry.protocol,
        base_url: connection.base_url.clone(),
        model: model.to_string(),
        has_api_key: credentials::has_api_key(&connection.id)?,
    })
}

// ---------- Multi-connection API ----------

pub fn list_provider_connections(app: &AppHandle) -> Result<Vec<ProviderConnectionView>, String> {
    let config = read_config(app)?;
    config.connections.iter().map(connection_view).collect()
}

pub fn get_active_provider(app: &AppHandle) -> Result<Option<ActiveProviderView>, String> {
    let config = read_config(app)?;
    let Some(active) = config.active else {
        return Ok(None);
    };

    let Some(connection) = config
        .connections
        .iter()
        .find(|connection| connection.id == active.connection_id)
    else {
        return Ok(None);
    };

    Ok(Some(active_view(connection, &active.model)?))
}

pub fn add_provider_connection(
    app: &AppHandle,
    input: NewProviderConnectionInput,
) -> Result<ProviderConnectionView, String> {
    let mut config = read_config(app)?;

    let provider_id = normalize_slug(&input.provider_id);
    let entry = catalog_entry(&provider_id)?;

    let display_name = input
        .display_name
        .as_deref()
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .unwrap_or(entry.name.as_str())
        .to_string();

    let base_url = input
        .base_url
        .as_deref()
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .unwrap_or(entry.default_base_url.as_str())
        .to_string();

    let default_model = input
        .default_model
        .as_deref()
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(|value| value.to_string())
        .or_else(|| {
            entry
                .models
                .iter()
                .find(|model| model.default)
                .or_else(|| entry.models.first())
                .map(|model| model.id.clone())
        })
        .ok_or_else(|| "default model is required (provider has no catalog models)".to_string())?;

    let custom_models = input.custom_models.unwrap_or_default();

    let id = next_unique_connection_id(&config.connections, &provider_id);
    let connection = validate_connection(ProviderConnection {
        id,
        provider_id,
        display_name,
        base_url,
        default_model,
        custom_models,
    })?;

    if let Some(api_key) = input
        .api_key
        .as_deref()
        .map(str::trim)
        .filter(|key| !key.is_empty())
    {
        credentials::save_api_key(&connection.id, api_key)?;
    }

    let view = connection_view(&connection)?;
    config.connections.push(connection);
    write_config(app, &config)?;
    Ok(view)
}

pub fn update_provider_connection(
    app: &AppHandle,
    input: UpdateProviderConnectionInput,
) -> Result<ProviderConnectionView, String> {
    let mut config = read_config(app)?;
    let id = normalize_slug(&input.id);

    let position = config
        .connections
        .iter()
        .position(|connection| connection.id == id)
        .ok_or_else(|| format!("connection '{id}' not found"))?;

    let current = &config.connections[position];
    let mut updated = current.clone();

    if let Some(display_name) = input.display_name {
        let trimmed = display_name.trim().to_string();
        if trimmed.is_empty() {
            return Err("connection display name is required".to_string());
        }
        updated.display_name = trimmed;
    }

    if let Some(base_url) = input.base_url {
        updated.base_url = base_url;
    }

    if let Some(default_model) = input.default_model {
        let trimmed = default_model.trim().to_string();
        if trimmed.is_empty() {
            return Err("default model is required".to_string());
        }
        updated.default_model = trimmed;
    }

    if let Some(custom_models) = input.custom_models {
        updated.custom_models = custom_models;
    }

    let validated = validate_connection(updated)?;

    if let Some(api_key) = input.api_key.as_deref().map(str::trim) {
        if api_key.is_empty() {
            credentials::remove_api_key(&validated.id)?;
        } else {
            credentials::save_api_key(&validated.id, api_key)?;
        }
    }

    config.connections[position] = validated;
    let view = connection_view(&config.connections[position])?;
    write_config(app, &config)?;
    Ok(view)
}

pub fn remove_provider_connection(app: &AppHandle, id: String) -> Result<(), String> {
    let mut config = read_config(app)?;
    let normalized = normalize_slug(&id);

    let position = config
        .connections
        .iter()
        .position(|connection| connection.id == normalized)
        .ok_or_else(|| format!("connection '{normalized}' not found"))?;

    config.connections.remove(position);
    credentials::remove_api_key(&normalized)?;

    if let Some(active) = &config.active {
        if active.connection_id == normalized {
            config.active = None;
        }
    }

    write_config(app, &config)?;
    Ok(())
}

pub fn set_active_provider(
    app: &AppHandle,
    input: ActiveSelectionInput,
) -> Result<ActiveProviderView, String> {
    let mut config = read_config(app)?;
    let connection_id = normalize_slug(&input.connection_id);
    let model = input.model.trim().to_string();
    if model.is_empty() {
        return Err("model is required".to_string());
    }

    let connection = config
        .connections
        .iter()
        .find(|connection| connection.id == connection_id)
        .ok_or_else(|| format!("connection '{connection_id}' not found"))?
        .clone();

    let view = active_view(&connection, &model)?;
    config.active = Some(ActiveSelection {
        connection_id,
        model,
    });
    write_config(app, &config)?;
    Ok(view)
}

// ---------- Internal: active provider resolved for chat ----------

struct ResolvedActiveProvider {
    connection: ProviderConnection,
    model: String,
    api_key: Option<String>,
}

fn resolve_active_provider(app: &AppHandle) -> Result<ResolvedActiveProvider, String> {
    let config = read_config(app)?;
    let active = config
        .active
        .ok_or_else(|| "No provider configured. Open Settings -> Providers first.".to_string())?;

    let connection = config
        .connections
        .into_iter()
        .find(|connection| connection.id == active.connection_id)
        .ok_or_else(|| {
            format!(
                "active connection '{}' not found in providers config",
                active.connection_id
            )
        })?;

    migrate_legacy_api_key(app, &connection.id)?;
    let api_key = credentials::get_api_key(&connection.id)?;

    Ok(ResolvedActiveProvider {
        connection,
        model: active.model,
        api_key,
    })
}

// ---------- Legacy single-provider commands (kept for backward compatibility) ----------

pub fn get_provider_settings(app: &AppHandle) -> Result<Option<ProviderSettingsView>, String> {
    let Some(active) = get_active_provider(app)? else {
        return Ok(None);
    };

    let config = read_config(app)?;
    let connection = config
        .connections
        .into_iter()
        .find(|connection| connection.id == active.connection_id)
        .ok_or_else(|| "active connection vanished while reading provider settings".to_string())?;

    Ok(Some(ProviderSettingsView {
        provider_id: connection.provider_id,
        provider_name: connection.display_name,
        base_url: connection.base_url,
        model: active.model,
        has_api_key: active.has_api_key,
    }))
}

pub fn save_provider_settings(
    app: &AppHandle,
    input: ProviderSettingsInput,
) -> Result<ProviderSettingsView, String> {
    let mut config = read_config(app)?;
    let provider_id = normalize_slug(&input.provider_id);

    let mapped = migrate_legacy_provider_id(&provider_id);
    let resolved_provider_id = if !mapped.is_empty() {
        mapped.to_string()
    } else {
        provider_id.clone()
    };
    let _entry = catalog_entry(&resolved_provider_id)?;

    let display_name = input.provider_name.trim().to_string();
    if display_name.is_empty() {
        return Err("provider name is required".to_string());
    }
    let base_url = validate_base_url(&input.base_url)?;
    let model = input.model.trim().to_string();
    if model.is_empty() {
        return Err("model is required".to_string());
    }

    // Upsert by provider_id: re-use the existing connection with the same
    // catalog provider_id if it exists, otherwise create a new one.
    let existing_position = config
        .connections
        .iter()
        .position(|connection| connection.provider_id == resolved_provider_id);

    let connection_id = match existing_position {
        Some(position) => {
            let existing = &mut config.connections[position];
            existing.display_name = display_name.clone();
            existing.base_url = base_url.clone();
            existing.default_model = model.clone();
            existing.id.clone()
        }
        None => {
            let id = next_unique_connection_id(&config.connections, &resolved_provider_id);
            config.connections.push(ProviderConnection {
                id: id.clone(),
                provider_id: resolved_provider_id.clone(),
                display_name: display_name.clone(),
                base_url: base_url.clone(),
                default_model: model.clone(),
                custom_models: Vec::new(),
            });
            id
        }
    };

    if let Some(api_key) = input
        .api_key
        .as_deref()
        .map(str::trim)
        .filter(|key| !key.is_empty())
    {
        credentials::save_api_key(&connection_id, api_key)?;
    }

    config.active = Some(ActiveSelection {
        connection_id: connection_id.clone(),
        model: model.clone(),
    });
    write_config(app, &config)?;

    let has_api_key = credentials::has_api_key(&connection_id)?;
    Ok(ProviderSettingsView {
        provider_id: resolved_provider_id,
        provider_name: display_name,
        base_url,
        model,
        has_api_key,
    })
}

pub fn remove_provider_credentials(
    app: &AppHandle,
) -> Result<Option<ProviderSettingsView>, String> {
    let config = read_config(app)?;
    let Some(active) = &config.active else {
        return Ok(None);
    };
    let connection_id = active.connection_id.clone();

    credentials::remove_api_key(&connection_id)?;
    remove_legacy_api_key(app, &connection_id)?;

    get_provider_settings(app)
}

// ---------- Chat ----------

pub async fn send_chat_message(
    app: &AppHandle,
    input: ChatMessageInput,
) -> Result<ChatMessageResponse, String> {
    let message = input.text.trim().to_string();
    if message.is_empty() {
        return Err("message is required".to_string());
    }

    let resolved = resolve_active_provider(app)?;

    // This branch keeps the legacy OpenAI-compatible call path. Routing by
    // protocol lands in the adapters branch (#3) of the multi-provider plan.
    if !matches!(
        catalog_entry(&resolved.connection.provider_id)?.protocol,
        ProviderProtocol::Openai
    ) {
        return Err(format!(
            "provider '{}' is not yet supported in chat — multi-protocol adapters arrive in a follow-up update",
            resolved.connection.provider_id
        ));
    }

    let request = OpenAiChatRequest::user_message(resolved.model.clone(), message);
    let endpoint = format!("{}/chat/completions", resolved.connection.base_url);

    let client = reqwest::Client::new();
    let mut builder = client.post(endpoint).json(&request);
    if let Some(api_key) = resolved.api_key {
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

// ---------- Unit tests ----------

#[cfg(test)]
mod tests {
    use super::*;
    use crate::features::providers::model::ProviderSettings;

    fn sample_connection(id: &str, provider_id: &str) -> ProviderConnection {
        ProviderConnection {
            id: id.to_string(),
            provider_id: provider_id.to_string(),
            display_name: provider_id.to_string(),
            base_url: "https://example.com/v1".to_string(),
            default_model: "model-id".to_string(),
            custom_models: vec![],
        }
    }

    #[test]
    fn next_unique_id_returns_base_when_free() {
        let connections = vec![sample_connection("anthropic", "anthropic")];
        assert_eq!(next_unique_connection_id(&connections, "openai"), "openai");
    }

    #[test]
    fn next_unique_id_suffixes_on_collision() {
        let connections = vec![
            sample_connection("openai", "openai"),
            sample_connection("openai-2", "openai"),
        ];
        assert_eq!(
            next_unique_connection_id(&connections, "openai"),
            "openai-3"
        );
    }

    #[test]
    fn migrate_v1_preserves_active_connection() {
        let legacy = LegacyProviderConfigFile {
            active: Some(ProviderSettings {
                provider_id: "openai".to_string(),
                provider_name: "OpenAI".to_string(),
                base_url: "https://api.openai.com/v1".to_string(),
                model: "gpt-4o-mini".to_string(),
            }),
        };

        let migrated = migrate_v1_to_v2(legacy);

        assert_eq!(migrated.version, PROVIDER_CONFIG_VERSION);
        assert_eq!(migrated.connections.len(), 1);
        let connection = &migrated.connections[0];
        assert_eq!(connection.id, "openai");
        assert_eq!(connection.provider_id, "openai");
        assert_eq!(connection.display_name, "OpenAI");
        assert_eq!(connection.base_url, "https://api.openai.com/v1");
        assert_eq!(connection.default_model, "gpt-4o-mini");

        let active = migrated.active.expect("active must be set");
        assert_eq!(active.connection_id, "openai");
        assert_eq!(active.model, "gpt-4o-mini");
    }

    #[test]
    fn migrate_v1_remaps_legacy_custom_provider() {
        let legacy = LegacyProviderConfigFile {
            active: Some(ProviderSettings {
                provider_id: "custom".to_string(),
                provider_name: "My endpoint".to_string(),
                base_url: "https://my.example.com/v1".to_string(),
                model: "model-id".to_string(),
            }),
        };

        let migrated = migrate_v1_to_v2(legacy);
        let connection = &migrated.connections[0];
        assert_eq!(connection.id, "custom");
        assert_eq!(connection.provider_id, "custom-openai");
    }

    #[test]
    fn migrate_v1_falls_back_for_unknown_provider() {
        let legacy = LegacyProviderConfigFile {
            active: Some(ProviderSettings {
                provider_id: "totally-unknown".to_string(),
                provider_name: "Mystery".to_string(),
                base_url: "https://unknown.example/v1".to_string(),
                model: "model-id".to_string(),
            }),
        };

        let migrated = migrate_v1_to_v2(legacy);
        let connection = &migrated.connections[0];
        assert_eq!(connection.id, "totally-unknown");
        assert_eq!(connection.provider_id, "custom-openai");
    }

    #[test]
    fn migrate_v1_empty_file_yields_default_v2() {
        let migrated = migrate_v1_to_v2(LegacyProviderConfigFile::default());
        assert_eq!(migrated.version, PROVIDER_CONFIG_VERSION);
        assert!(migrated.connections.is_empty());
        assert!(migrated.active.is_none());
    }

    #[test]
    fn validate_connection_rejects_unknown_provider() {
        let connection = ProviderConnection {
            id: "x".to_string(),
            provider_id: "definitely-not-real".to_string(),
            display_name: "X".to_string(),
            base_url: "https://x.example/v1".to_string(),
            default_model: "m".to_string(),
            custom_models: vec![],
        };
        let error = validate_connection(connection).unwrap_err();
        assert!(error.contains("unknown provider"));
    }

    #[test]
    fn validate_connection_rejects_bad_base_url() {
        let connection = ProviderConnection {
            id: "x".to_string(),
            provider_id: "openai".to_string(),
            display_name: "X".to_string(),
            base_url: "ftp://nope".to_string(),
            default_model: "m".to_string(),
            custom_models: vec![],
        };
        let error = validate_connection(connection).unwrap_err();
        assert!(error.contains("base URL"));
    }

    #[test]
    fn validate_connection_normalizes_fields() {
        let connection = ProviderConnection {
            id: "  My-ID  ".to_string(),
            provider_id: " OpenAI ".to_string(),
            display_name: "  OpenAI  ".to_string(),
            base_url: " https://api.openai.com/v1/ ".to_string(),
            default_model: " gpt-4o-mini ".to_string(),
            custom_models: vec!["  foo  ".to_string(), "".to_string()],
        };
        let validated = validate_connection(connection).unwrap();
        assert_eq!(validated.id, "my-id");
        assert_eq!(validated.provider_id, "openai");
        assert_eq!(validated.display_name, "OpenAI");
        assert_eq!(validated.base_url, "https://api.openai.com/v1");
        assert_eq!(validated.default_model, "gpt-4o-mini");
        assert_eq!(validated.custom_models, vec!["foo".to_string()]);
    }
}
