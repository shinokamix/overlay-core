use serde::{Deserialize, Serialize};

use crate::features::providers::catalog::ProviderProtocol;

// ---------- New multi-connection shape (providers.json v2) ----------

pub const PROVIDER_CONFIG_VERSION: u32 = 2;

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProviderConnection {
    pub id: String,
    pub provider_id: String,
    pub display_name: String,
    pub base_url: String,
    pub default_model: String,
    #[serde(default)]
    pub custom_models: Vec<String>,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ActiveSelection {
    pub connection_id: String,
    pub model: String,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProviderConfigFile {
    pub version: u32,
    #[serde(default)]
    pub connections: Vec<ProviderConnection>,
    #[serde(default)]
    pub active: Option<ActiveSelection>,
}

impl Default for ProviderConfigFile {
    fn default() -> Self {
        Self {
            version: PROVIDER_CONFIG_VERSION,
            connections: Vec::new(),
            active: None,
        }
    }
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProviderConnectionView {
    pub id: String,
    pub provider_id: String,
    pub display_name: String,
    pub base_url: String,
    pub default_model: String,
    pub custom_models: Vec<String>,
    pub has_api_key: bool,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ActiveProviderView {
    pub connection_id: String,
    pub provider_id: String,
    pub protocol: ProviderProtocol,
    pub base_url: String,
    pub model: String,
    pub has_api_key: bool,
}

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NewProviderConnectionInput {
    pub provider_id: String,
    #[serde(default)]
    pub display_name: Option<String>,
    #[serde(default)]
    pub base_url: Option<String>,
    #[serde(default)]
    pub default_model: Option<String>,
    #[serde(default)]
    pub custom_models: Option<Vec<String>>,
    #[serde(default)]
    pub api_key: Option<String>,
}

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateProviderConnectionInput {
    pub id: String,
    #[serde(default)]
    pub display_name: Option<String>,
    #[serde(default)]
    pub base_url: Option<String>,
    #[serde(default)]
    pub default_model: Option<String>,
    #[serde(default)]
    pub custom_models: Option<Vec<String>>,
    #[serde(default)]
    pub api_key: Option<String>,
}

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ActiveSelectionInput {
    pub connection_id: String,
    pub model: String,
}

// ---------- Legacy single-active shape (providers.json v1) ----------

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProviderSettings {
    pub provider_id: String,
    pub provider_name: String,
    pub base_url: String,
    pub model: String,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProviderSettingsView {
    pub provider_id: String,
    pub provider_name: String,
    pub base_url: String,
    pub model: String,
    pub has_api_key: bool,
}

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProviderSettingsInput {
    pub provider_id: String,
    pub provider_name: String,
    pub base_url: String,
    pub model: String,
    pub api_key: Option<String>,
}

#[derive(Clone, Debug, Default, Deserialize, Serialize)]
pub struct LegacyProviderConfigFile {
    pub active: Option<ProviderSettings>,
}

// ---------- Chat message wire types (unchanged in this branch) ----------

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ChatMessageInput {
    pub text: String,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ChatMessageResponse {
    pub text: String,
}

#[derive(Deserialize, Serialize)]
pub struct OpenAiChatMessage {
    pub role: String,
    pub content: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct OpenAiChatRequest {
    pub model: String,
    pub messages: Vec<OpenAiChatMessage>,
    pub stream: bool,
}

impl OpenAiChatRequest {
    pub fn user_message(model: String, text: String) -> Self {
        Self {
            model,
            messages: vec![OpenAiChatMessage {
                role: "user".to_string(),
                content: text,
            }],
            stream: false,
        }
    }
}

#[derive(Deserialize)]
pub struct OpenAiChatResponse {
    pub choices: Vec<OpenAiChatChoice>,
}

#[derive(Deserialize)]
pub struct OpenAiChatChoice {
    pub message: OpenAiChatMessage,
}
