use reqwest::{Client, StatusCode};
use serde_json::{json, Value};

use crate::features::providers::catalog::ProviderProtocol;
use crate::features::providers::model::{ChatMessage, ChatRole};

const ANTHROPIC_API_VERSION: &str = "2023-06-01";
const DEFAULT_MAX_OUTPUT_TOKENS: u32 = 4096;

/// Request input shared by every adapter. We keep it deliberately small and
/// protocol-agnostic; per-adapter request shape is built inside each module.
#[derive(Clone, Debug)]
pub struct ChatRequest {
    pub base_url: String,
    pub api_key: Option<String>,
    pub model: String,
    pub messages: Vec<ChatMessage>,
    /// Hint used by adapters that require an explicit cap (e.g. Anthropic).
    /// Falls back to [`DEFAULT_MAX_OUTPUT_TOKENS`] when not provided.
    pub max_output_tokens: Option<u32>,
}

/// Send a non-streaming chat completion through the protocol-specific
/// adapter and return the assistant text.
pub async fn complete(
    protocol: ProviderProtocol,
    client: &Client,
    request: ChatRequest,
) -> Result<String, String> {
    if request.messages.is_empty() {
        return Err("at least one chat message is required".to_string());
    }

    match protocol {
        ProviderProtocol::Openai => openai::send(client, request).await,
        ProviderProtocol::Anthropic => anthropic::send(client, request).await,
        ProviderProtocol::Gemini => gemini::send(client, request).await,
    }
}

fn role_str(role: ChatRole) -> &'static str {
    match role {
        ChatRole::System => "system",
        ChatRole::User => "user",
        ChatRole::Assistant => "assistant",
    }
}

// ---------- OpenAI-compatible ----------

pub mod openai {
    use super::*;

    pub fn build_body(model: &str, messages: &[ChatMessage]) -> Value {
        json!({
            "model": model,
            "messages": messages
                .iter()
                .map(|message| json!({
                    "role": role_str(message.role),
                    "content": message.content,
                }))
                .collect::<Vec<_>>(),
            "stream": false,
        })
    }

    pub fn parse_response(payload: &str) -> Result<String, String> {
        let value: Value = serde_json::from_str(payload)
            .map_err(|error| format!("failed to parse provider response: {error}"))?;

        let text = value
            .get("choices")
            .and_then(Value::as_array)
            .and_then(|choices| choices.first())
            .and_then(|choice| choice.get("message"))
            .and_then(|message| message.get("content"))
            .and_then(Value::as_str)
            .map(str::trim)
            .filter(|content| !content.is_empty())
            .ok_or_else(|| "provider response did not include a message".to_string())?;

        Ok(text.to_string())
    }

    pub async fn send(client: &Client, request: ChatRequest) -> Result<String, String> {
        let endpoint = format!("{}/chat/completions", request.base_url);
        let body = build_body(&request.model, &request.messages);

        let mut builder = client.post(endpoint).json(&body);
        if let Some(api_key) = request.api_key.as_deref().filter(|key| !key.is_empty()) {
            builder = builder.bearer_auth(api_key);
        }

        let payload = dispatch_text(builder).await?;
        parse_response(&payload)
    }
}

// ---------- Anthropic Messages API ----------

pub mod anthropic {
    use super::*;

    /// Returns (request body, optional combined system prompt). System
    /// messages are concatenated and surfaced at the top level — Anthropic
    /// does not accept "system" inside the `messages` array.
    pub fn build_body(
        model: &str,
        messages: &[ChatMessage],
        max_tokens: u32,
    ) -> Result<Value, String> {
        let mut system_parts: Vec<String> = Vec::new();
        let mut chat_parts: Vec<Value> = Vec::new();

        for message in messages {
            match message.role {
                ChatRole::System => system_parts.push(message.content.clone()),
                ChatRole::User | ChatRole::Assistant => {
                    chat_parts.push(json!({
                        "role": role_str(message.role),
                        "content": message.content,
                    }));
                }
            }
        }

        if chat_parts.is_empty() {
            return Err("anthropic requires at least one user/assistant message".to_string());
        }

        let mut body = json!({
            "model": model,
            "max_tokens": max_tokens,
            "messages": chat_parts,
        });

        if !system_parts.is_empty() {
            body["system"] = Value::String(system_parts.join("\n\n"));
        }

        Ok(body)
    }

    pub fn parse_response(payload: &str) -> Result<String, String> {
        let value: Value = serde_json::from_str(payload)
            .map_err(|error| format!("failed to parse provider response: {error}"))?;

        let text = value
            .get("content")
            .and_then(Value::as_array)
            .map(|blocks| {
                blocks
                    .iter()
                    .filter_map(|block| {
                        let block_type = block.get("type").and_then(Value::as_str).unwrap_or("");
                        if block_type != "text" {
                            return None;
                        }
                        block.get("text").and_then(Value::as_str)
                    })
                    .collect::<Vec<_>>()
                    .join("")
            })
            .map(|joined| joined.trim().to_string())
            .filter(|joined| !joined.is_empty())
            .ok_or_else(|| "provider response did not include a message".to_string())?;

        Ok(text)
    }

    pub async fn send(client: &Client, request: ChatRequest) -> Result<String, String> {
        let api_key = request
            .api_key
            .as_deref()
            .filter(|key| !key.is_empty())
            .ok_or_else(|| "anthropic requires an API key".to_string())?;

        let body = build_body(
            &request.model,
            &request.messages,
            request
                .max_output_tokens
                .unwrap_or(DEFAULT_MAX_OUTPUT_TOKENS),
        )?;
        let endpoint = format!("{}/messages", request.base_url);
        let builder = client
            .post(endpoint)
            .header("x-api-key", api_key)
            .header("anthropic-version", ANTHROPIC_API_VERSION)
            .json(&body);

        let payload = dispatch_text(builder).await?;
        parse_response(&payload)
    }
}

// ---------- Google Gemini Generative Language API ----------

pub mod gemini {
    use super::*;

    /// Returns the request body. System messages are concatenated into a
    /// top-level `systemInstruction`; user → "user", assistant → "model".
    pub fn build_body(messages: &[ChatMessage]) -> Result<Value, String> {
        let mut system_parts: Vec<String> = Vec::new();
        let mut contents: Vec<Value> = Vec::new();

        for message in messages {
            match message.role {
                ChatRole::System => system_parts.push(message.content.clone()),
                ChatRole::User => contents.push(json!({
                    "role": "user",
                    "parts": [ { "text": message.content } ],
                })),
                ChatRole::Assistant => contents.push(json!({
                    "role": "model",
                    "parts": [ { "text": message.content } ],
                })),
            }
        }

        if contents.is_empty() {
            return Err("gemini requires at least one user/assistant message".to_string());
        }

        let mut body = json!({ "contents": contents });
        if !system_parts.is_empty() {
            body["systemInstruction"] = json!({
                "parts": [ { "text": system_parts.join("\n\n") } ],
            });
        }

        Ok(body)
    }

    pub fn parse_response(payload: &str) -> Result<String, String> {
        let value: Value = serde_json::from_str(payload)
            .map_err(|error| format!("failed to parse provider response: {error}"))?;

        let text = value
            .get("candidates")
            .and_then(Value::as_array)
            .and_then(|candidates| candidates.first())
            .and_then(|candidate| candidate.get("content"))
            .and_then(|content| content.get("parts"))
            .and_then(Value::as_array)
            .map(|parts| {
                parts
                    .iter()
                    .filter_map(|part| part.get("text").and_then(Value::as_str))
                    .collect::<Vec<_>>()
                    .join("")
            })
            .map(|joined| joined.trim().to_string())
            .filter(|joined| !joined.is_empty())
            .ok_or_else(|| "provider response did not include a message".to_string())?;

        Ok(text)
    }

    pub async fn send(client: &Client, request: ChatRequest) -> Result<String, String> {
        let api_key = request
            .api_key
            .as_deref()
            .filter(|key| !key.is_empty())
            .ok_or_else(|| "gemini requires an API key".to_string())?;

        let body = build_body(&request.messages)?;
        let endpoint = format!(
            "{}/models/{}:generateContent",
            request.base_url, request.model
        );
        let builder = client.post(endpoint).query(&[("key", api_key)]).json(&body);

        let payload = dispatch_text(builder).await?;
        parse_response(&payload)
    }
}

// ---------- Shared HTTP plumbing ----------

async fn dispatch_text(builder: reqwest::RequestBuilder) -> Result<String, String> {
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

    Ok(content)
}

// ---------- Unit tests (request shape + response parsing) ----------

#[cfg(test)]
mod tests {
    use super::*;

    fn msg(role: ChatRole, content: &str) -> ChatMessage {
        ChatMessage {
            role,
            content: content.to_string(),
        }
    }

    // ----- OpenAI -----

    #[test]
    fn openai_body_serializes_history_in_order() {
        let messages = vec![
            msg(ChatRole::System, "be terse"),
            msg(ChatRole::User, "hi"),
            msg(ChatRole::Assistant, "hello"),
            msg(ChatRole::User, "next"),
        ];
        let body = openai::build_body("gpt-4o-mini", &messages);
        assert_eq!(body["model"], "gpt-4o-mini");
        assert_eq!(body["stream"], false);
        let arr = body["messages"].as_array().unwrap();
        assert_eq!(arr.len(), 4);
        assert_eq!(arr[0]["role"], "system");
        assert_eq!(arr[0]["content"], "be terse");
        assert_eq!(arr[1]["role"], "user");
        assert_eq!(arr[2]["role"], "assistant");
        assert_eq!(arr[3]["role"], "user");
        assert_eq!(arr[3]["content"], "next");
    }

    #[test]
    fn openai_parses_first_choice_message() {
        let payload = r#"{"choices":[{"message":{"role":"assistant","content":"  result  "}}]}"#;
        assert_eq!(openai::parse_response(payload).unwrap(), "result");
    }

    #[test]
    fn openai_rejects_missing_message() {
        let payload = r#"{"choices":[]}"#;
        assert!(openai::parse_response(payload).is_err());
    }

    // ----- Anthropic -----

    #[test]
    fn anthropic_body_extracts_system_prompt() {
        let messages = vec![
            msg(ChatRole::System, "be terse"),
            msg(ChatRole::System, "and accurate"),
            msg(ChatRole::User, "hi"),
            msg(ChatRole::Assistant, "hello"),
            msg(ChatRole::User, "more"),
        ];
        let body =
            anthropic::build_body("claude-opus-4-7", &messages, DEFAULT_MAX_OUTPUT_TOKENS).unwrap();
        assert_eq!(body["model"], "claude-opus-4-7");
        assert_eq!(body["max_tokens"], DEFAULT_MAX_OUTPUT_TOKENS);
        assert_eq!(body["system"], "be terse\n\nand accurate");
        let arr = body["messages"].as_array().unwrap();
        assert_eq!(arr.len(), 3);
        assert_eq!(arr[0]["role"], "user");
        assert_eq!(arr[1]["role"], "assistant");
        assert_eq!(arr[2]["role"], "user");
        assert!(body
            .get("messages")
            .unwrap()
            .as_array()
            .unwrap()
            .iter()
            .all(|message| message.get("role").and_then(Value::as_str) != Some("system")));
    }

    #[test]
    fn anthropic_body_omits_system_when_absent() {
        let messages = vec![msg(ChatRole::User, "hi")];
        let body = anthropic::build_body("claude-sonnet-4-6", &messages, 1024).unwrap();
        assert!(body.get("system").is_none());
        assert_eq!(body["max_tokens"], 1024);
    }

    #[test]
    fn anthropic_body_rejects_empty_conversation() {
        let messages = vec![msg(ChatRole::System, "only system")];
        let error = anthropic::build_body("claude-opus-4-7", &messages, 1024).unwrap_err();
        assert!(error.contains("user/assistant"));
    }

    #[test]
    fn anthropic_parses_text_blocks() {
        let payload = r#"{
            "content": [
                {"type":"text","text":"first "},
                {"type":"tool_use","id":"x","name":"y","input":{}},
                {"type":"text","text":"second"}
            ]
        }"#;
        assert_eq!(anthropic::parse_response(payload).unwrap(), "first second");
    }

    #[test]
    fn anthropic_rejects_empty_content() {
        let payload = r#"{"content":[]}"#;
        assert!(anthropic::parse_response(payload).is_err());
    }

    // ----- Gemini -----

    #[test]
    fn gemini_body_maps_roles_and_extracts_system_instruction() {
        let messages = vec![
            msg(ChatRole::System, "be terse"),
            msg(ChatRole::User, "hi"),
            msg(ChatRole::Assistant, "hello"),
            msg(ChatRole::User, "next"),
        ];
        let body = gemini::build_body(&messages).unwrap();
        assert_eq!(body["systemInstruction"]["parts"][0]["text"], "be terse");
        let contents = body["contents"].as_array().unwrap();
        assert_eq!(contents.len(), 3);
        assert_eq!(contents[0]["role"], "user");
        assert_eq!(contents[0]["parts"][0]["text"], "hi");
        assert_eq!(contents[1]["role"], "model");
        assert_eq!(contents[1]["parts"][0]["text"], "hello");
        assert_eq!(contents[2]["role"], "user");
        assert_eq!(contents[2]["parts"][0]["text"], "next");
    }

    #[test]
    fn gemini_body_rejects_empty_conversation() {
        let messages = vec![msg(ChatRole::System, "only system")];
        let error = gemini::build_body(&messages).unwrap_err();
        assert!(error.contains("user/assistant"));
    }

    #[test]
    fn gemini_parses_first_candidate_parts() {
        let payload = r#"{
            "candidates": [{
                "content": {
                    "parts": [
                        {"text":"hello "},
                        {"text":"world"}
                    ]
                }
            }]
        }"#;
        assert_eq!(gemini::parse_response(payload).unwrap(), "hello world");
    }

    #[test]
    fn gemini_rejects_empty_candidates() {
        let payload = r#"{"candidates":[]}"#;
        assert!(gemini::parse_response(payload).is_err());
    }
}
