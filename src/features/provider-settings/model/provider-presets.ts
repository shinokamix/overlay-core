export type ProviderPreset = {
  providerId: string;
  providerName: string;
  baseUrl: string;
  model: string;
  apiKeyLabel: string;
  apiKeyPlaceholder: string;
  description: string;
};

export const PROVIDER_PRESETS: ProviderPreset[] = [
  {
    providerId: "openai",
    providerName: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    model: "gpt-4o-mini",
    apiKeyLabel: "OpenAI API key",
    apiKeyPlaceholder: "sk-...",
    description: "OpenAI-compatible hosted models through the official OpenAI API.",
  },
  {
    providerId: "openrouter",
    providerName: "OpenRouter",
    baseUrl: "https://openrouter.ai/api/v1",
    model: "openai/gpt-4o-mini",
    apiKeyLabel: "OpenRouter API key",
    apiKeyPlaceholder: "sk-or-...",
    description: "OpenAI-compatible gateway for many hosted model providers.",
  },
  {
    providerId: "ollama",
    providerName: "Ollama",
    baseUrl: "http://localhost:11434/v1",
    model: "llama3.2",
    apiKeyLabel: "API key (optional)",
    apiKeyPlaceholder: "Leave empty for local Ollama",
    description: "Local OpenAI-compatible endpoint. Pull the model in Ollama first.",
  },
  {
    providerId: "custom",
    providerName: "Custom OpenAI-compatible",
    baseUrl: "https://example.com/v1",
    model: "model-id",
    apiKeyLabel: "API key (optional)",
    apiKeyPlaceholder: "Provider token",
    description: "Any OpenAI-compatible /chat/completions endpoint.",
  },
];

export function getProviderPreset(providerId: string): ProviderPreset {
  return (
    PROVIDER_PRESETS.find((preset) => preset.providerId === providerId) ??
    PROVIDER_PRESETS[PROVIDER_PRESETS.length - 1]
  );
}
