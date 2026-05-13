import { invoke } from "@tauri-apps/api/core";
import { useQuery } from "@tanstack/react-query";
import type { ProviderProtocol } from "./catalog";

export type ActiveProviderView = {
  connectionId: string;
  providerId: string;
  protocol: ProviderProtocol;
  baseUrl: string;
  model: string;
  hasApiKey: boolean;
};

export const ACTIVE_PROVIDER_QUERY_KEY = ["active-provider"] as const;

export async function fetchActiveProvider(): Promise<ActiveProviderView | null> {
  return invoke<ActiveProviderView | null>("get_active_provider");
}

export function useActiveProvider(enabled: boolean) {
  return useQuery({
    queryKey: ACTIVE_PROVIDER_QUERY_KEY,
    queryFn: fetchActiveProvider,
    enabled,
    staleTime: 30_000,
  });
}
