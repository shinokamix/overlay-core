import { invoke } from "@tauri-apps/api/core";

export type ProviderConnectionView = {
  id: string;
  providerId: string;
  displayName: string;
  baseUrl: string;
  defaultModel: string;
  customModels: string[];
  hasApiKey: boolean;
};

export type NewProviderConnectionInput = {
  providerId: string;
  displayName?: string;
  baseUrl?: string;
  defaultModel?: string;
  customModels?: string[];
  apiKey?: string;
};

export type UpdateProviderConnectionInput = {
  id: string;
  displayName?: string;
  baseUrl?: string;
  defaultModel?: string;
  customModels?: string[];
  apiKey?: string;
};

export type ActiveSelectionInput = {
  connectionId: string;
  model: string;
};

export async function listProviderConnections(): Promise<ProviderConnectionView[]> {
  return invoke<ProviderConnectionView[]>("list_provider_connections");
}

export async function addProviderConnection(
  input: NewProviderConnectionInput,
): Promise<ProviderConnectionView> {
  return invoke<ProviderConnectionView>("add_provider_connection", { input });
}

export async function updateProviderConnection(
  input: UpdateProviderConnectionInput,
): Promise<ProviderConnectionView> {
  return invoke<ProviderConnectionView>("update_provider_connection", { input });
}

export async function removeProviderConnection(id: string): Promise<void> {
  await invoke("remove_provider_connection", { id });
}

export async function setActiveProvider(input: ActiveSelectionInput): Promise<void> {
  await invoke("set_active_provider", { input });
}
