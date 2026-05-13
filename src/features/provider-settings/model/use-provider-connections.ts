import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ACTIVE_PROVIDER_QUERY_KEY } from "@/shared/lib/providers";
import {
  addProviderConnection,
  listProviderConnections,
  removeProviderConnection,
  setActiveProvider,
  updateProviderConnection,
  type NewProviderConnectionInput,
  type ProviderConnectionView,
  type UpdateProviderConnectionInput,
} from "./api";

export const PROVIDER_CONNECTIONS_QUERY_KEY = ["provider-connections"] as const;

export function useProviderConnections(enabled: boolean) {
  return useQuery<ProviderConnectionView[]>({
    queryKey: PROVIDER_CONNECTIONS_QUERY_KEY,
    queryFn: listProviderConnections,
    enabled,
    staleTime: 30_000,
  });
}

export function useProviderConnectionMutations() {
  const queryClient = useQueryClient();

  async function invalidate() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: PROVIDER_CONNECTIONS_QUERY_KEY }),
      queryClient.invalidateQueries({ queryKey: ACTIVE_PROVIDER_QUERY_KEY }),
    ]);
  }

  return {
    async add(input: NewProviderConnectionInput) {
      const result = await addProviderConnection(input);
      await invalidate();
      return result;
    },
    async update(input: UpdateProviderConnectionInput) {
      const result = await updateProviderConnection(input);
      await invalidate();
      return result;
    },
    async remove(id: string) {
      await removeProviderConnection(id);
      await invalidate();
    },
    async setActive(connectionId: string, model: string) {
      await setActiveProvider({ connectionId, model });
      await invalidate();
    },
  };
}
