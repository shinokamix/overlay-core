import { invoke } from "@tauri-apps/api/core";

export type ProviderSettings = {
  providerId: string;
  providerName: string;
  baseUrl: string;
  model: string;
  hasApiKey: boolean;
};

export type ProviderSettingsInput = {
  providerId: string;
  providerName: string;
  baseUrl: string;
  model: string;
  apiKey?: string;
};

export async function getProviderSettings(): Promise<ProviderSettings | null> {
  return invoke<ProviderSettings | null>("get_provider_settings");
}

export async function saveProviderSettings(
  input: ProviderSettingsInput,
): Promise<ProviderSettings> {
  return invoke<ProviderSettings>("save_provider_settings", { input });
}

export async function removeProviderCredentials(): Promise<ProviderSettings | null> {
  return invoke<ProviderSettings | null>("remove_provider_credentials");
}
