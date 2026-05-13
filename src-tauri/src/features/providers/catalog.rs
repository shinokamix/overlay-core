use std::sync::OnceLock;

use serde::{Deserialize, Serialize};

const CATALOG_SOURCE: &str = include_str!("catalog.json");

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProviderCatalog {
    pub version: u32,
    pub providers: Vec<ProviderCatalogEntry>,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProviderCatalogEntry {
    pub id: String,
    pub name: String,
    pub protocol: ProviderProtocol,
    pub default_base_url: String,
    pub auth: ProviderAuth,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub api_key_env: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub docs_url: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(default)]
    pub allows_custom_models: bool,
    #[serde(default)]
    pub models: Vec<CatalogModel>,
}

#[derive(Clone, Copy, Debug, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum ProviderProtocol {
    Openai,
    Anthropic,
    Gemini,
}

#[derive(Clone, Copy, Debug, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum ProviderAuth {
    ApiKey,
    None,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CatalogModel {
    pub id: String,
    pub name: String,
    pub context_window: u32,
    pub max_output_tokens: u32,
    pub capabilities: ModelCapabilities,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub knowledge_cutoff: Option<String>,
    #[serde(default, skip_serializing_if = "is_false")]
    pub default: bool,
    #[serde(default, skip_serializing_if = "is_false")]
    pub deprecated: bool,
}

#[derive(Clone, Copy, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ModelCapabilities {
    #[serde(default)]
    pub vision: bool,
    #[serde(default)]
    pub tool_calls: bool,
    #[serde(default)]
    pub reasoning: bool,
    #[serde(default)]
    pub audio: bool,
}

fn is_false(value: &bool) -> bool {
    !*value
}

static CATALOG: OnceLock<ProviderCatalog> = OnceLock::new();

fn parse_catalog() -> ProviderCatalog {
    serde_json::from_str::<ProviderCatalog>(CATALOG_SOURCE)
        .expect("provider catalog must be valid JSON; this is a build-time invariant")
}

pub fn catalog() -> &'static ProviderCatalog {
    CATALOG.get_or_init(parse_catalog)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::HashSet;

    #[test]
    fn catalog_parses() {
        let catalog = catalog();
        assert_eq!(catalog.version, 1);
        assert!(
            catalog.providers.len() >= 10,
            "expected a detailed catalog, got {} providers",
            catalog.providers.len()
        );
    }

    #[test]
    fn provider_ids_are_unique_and_normalized() {
        let mut seen = HashSet::new();
        for provider in &catalog().providers {
            assert!(
                provider
                    .id
                    .chars()
                    .all(|character| character.is_ascii_lowercase()
                        || character.is_ascii_digit()
                        || character == '-'
                        || character == '_'),
                "provider id '{}' must be lowercase ascii with -/_ only",
                provider.id
            );
            assert!(
                seen.insert(provider.id.clone()),
                "duplicate provider id '{}'",
                provider.id
            );
        }
    }

    #[test]
    fn provider_base_urls_are_well_formed() {
        for provider in &catalog().providers {
            let base = &provider.default_base_url;
            assert!(
                base.starts_with("https://")
                    || base.starts_with("http://localhost")
                    || base.starts_with("http://127.0.0.1"),
                "provider '{}' base url '{}' must be https or local http",
                provider.id,
                base
            );
        }
    }

    #[test]
    fn at_most_one_default_per_provider() {
        for provider in &catalog().providers {
            let defaults = provider.models.iter().filter(|model| model.default).count();
            assert!(
                defaults <= 1,
                "provider '{}' has {} default models, expected at most 1",
                provider.id,
                defaults
            );
        }
    }

    #[test]
    fn model_ids_within_provider_are_unique() {
        for provider in &catalog().providers {
            let mut seen = HashSet::new();
            for model in &provider.models {
                assert!(
                    seen.insert(model.id.clone()),
                    "provider '{}' has duplicate model id '{}'",
                    provider.id,
                    model.id
                );
            }
        }
    }

    #[test]
    fn expected_providers_present() {
        let ids: HashSet<&str> = catalog()
            .providers
            .iter()
            .map(|provider| provider.id.as_str())
            .collect();
        for expected in [
            "openai",
            "anthropic",
            "google",
            "openrouter",
            "ollama",
            "custom-openai",
            "custom-anthropic",
        ] {
            assert!(
                ids.contains(expected),
                "missing expected provider '{expected}'"
            );
        }
    }
}
