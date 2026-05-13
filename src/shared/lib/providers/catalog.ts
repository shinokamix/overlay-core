import { invoke } from "@tauri-apps/api/core";
import { useQuery } from "@tanstack/react-query";

export type ProviderProtocol = "openai" | "anthropic" | "gemini";
export type ProviderAuth = "api_key" | "none";

export type ModelCapabilities = {
  vision: boolean;
  toolCalls: boolean;
  reasoning: boolean;
  audio: boolean;
};

export type CatalogModel = {
  id: string;
  name: string;
  contextWindow: number;
  maxOutputTokens: number;
  capabilities: ModelCapabilities;
  knowledgeCutoff?: string;
  default?: boolean;
  deprecated?: boolean;
};

export type ProviderCatalogEntry = {
  id: string;
  name: string;
  protocol: ProviderProtocol;
  defaultBaseUrl: string;
  auth: ProviderAuth;
  apiKeyEnv?: string;
  docsUrl?: string;
  description?: string;
  allowsCustomModels: boolean;
  models: CatalogModel[];
};

export type ProviderCatalog = {
  version: number;
  providers: ProviderCatalogEntry[];
};

export const PROVIDER_CATALOG_QUERY_KEY = ["provider-catalog"] as const;

export async function fetchProviderCatalog(): Promise<ProviderCatalog> {
  return invoke<ProviderCatalog>("list_provider_catalog");
}

export function useProviderCatalog(enabled: boolean) {
  return useQuery({
    queryKey: PROVIDER_CATALOG_QUERY_KEY,
    queryFn: fetchProviderCatalog,
    enabled,
    staleTime: Infinity,
  });
}

export function findCatalogProvider(
  catalog: ProviderCatalog | undefined,
  providerId: string,
): ProviderCatalogEntry | undefined {
  return catalog?.providers.find((provider) => provider.id === providerId);
}

export function findCatalogModel(
  provider: ProviderCatalogEntry | undefined,
  modelId: string,
): CatalogModel | undefined {
  return provider?.models.find((model) => model.id === modelId);
}

export function getDefaultModel(
  provider: ProviderCatalogEntry | undefined,
): CatalogModel | undefined {
  if (!provider) {
    return undefined;
  }

  return provider.models.find((model) => model.default) ?? provider.models[0];
}
