use serde::{Deserialize, Serialize};

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

#[derive(Clone, Debug, Default, Deserialize, Serialize)]
pub struct ProviderConfigFile {
    pub active: Option<ProviderSettings>,
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
