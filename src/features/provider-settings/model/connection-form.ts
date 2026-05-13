import type { ProviderCatalogEntry } from "@/shared/lib/providers";
import { getDefaultModel } from "@/shared/lib/providers";
import type { ProviderConnectionView } from "./api";

export type ConnectionFormMode = "add" | "edit";

export type ConnectionFormState = {
  providerId: string;
  displayName: string;
  baseUrl: string;
  defaultModel: string;
  customModels: string[];
  apiKey: string;
  customModelDraft: string;
};

export type ConnectionFormValidation =
  | { ok: true }
  | { ok: false; field: keyof ConnectionFormState; message: string };

export function initialFormForCatalogProvider(provider: ProviderCatalogEntry): ConnectionFormState {
  const defaultModel = getDefaultModel(provider);
  return {
    providerId: provider.id,
    displayName: provider.name,
    baseUrl: provider.defaultBaseUrl,
    defaultModel: defaultModel?.id ?? "",
    customModels: [],
    apiKey: "",
    customModelDraft: "",
  };
}

export function initialFormForConnection(connection: ProviderConnectionView): ConnectionFormState {
  return {
    providerId: connection.providerId,
    displayName: connection.displayName,
    baseUrl: connection.baseUrl,
    defaultModel: connection.defaultModel,
    customModels: [...connection.customModels],
    apiKey: "",
    customModelDraft: "",
  };
}

export function modelOptions(
  provider: ProviderCatalogEntry | undefined,
  state: ConnectionFormState,
): string[] {
  const catalogIds = provider?.models.map((model) => model.id) ?? [];
  const seen = new Set(catalogIds);
  const merged = [...catalogIds];
  for (const customModel of state.customModels) {
    if (!seen.has(customModel)) {
      seen.add(customModel);
      merged.push(customModel);
    }
  }
  if (state.defaultModel && !seen.has(state.defaultModel)) {
    merged.push(state.defaultModel);
  }
  return merged;
}

export function addCustomModel(state: ConnectionFormState): ConnectionFormState {
  const draft = state.customModelDraft.trim();
  if (!draft) {
    return state;
  }
  if (state.customModels.includes(draft)) {
    return { ...state, customModelDraft: "" };
  }
  return {
    ...state,
    customModels: [...state.customModels, draft],
    customModelDraft: "",
  };
}

export function removeCustomModel(
  state: ConnectionFormState,
  modelId: string,
): ConnectionFormState {
  return {
    ...state,
    customModels: state.customModels.filter((existing) => existing !== modelId),
    defaultModel: state.defaultModel === modelId ? "" : state.defaultModel,
  };
}

function isValidBaseUrl(value: string): boolean {
  const trimmed = value.trim();
  return (
    trimmed.startsWith("https://") ||
    trimmed.startsWith("http://localhost") ||
    trimmed.startsWith("http://127.0.0.1")
  );
}

export function validateConnectionForm(
  state: ConnectionFormState,
  mode: ConnectionFormMode,
  provider: ProviderCatalogEntry | undefined,
  hasExistingApiKey: boolean,
): ConnectionFormValidation {
  if (!state.providerId.trim()) {
    return { ok: false, field: "providerId", message: "Provider is required." };
  }
  if (!provider) {
    return {
      ok: false,
      field: "providerId",
      message: "Provider is not in the catalog.",
    };
  }
  if (!state.displayName.trim()) {
    return { ok: false, field: "displayName", message: "Display name is required." };
  }
  if (!isValidBaseUrl(state.baseUrl)) {
    return {
      ok: false,
      field: "baseUrl",
      message: "Base URL must start with https:// or a local http:// address.",
    };
  }
  if (!state.defaultModel.trim()) {
    return { ok: false, field: "defaultModel", message: "Pick or enter a default model." };
  }

  const apiKeyRequired = provider.auth === "api_key";
  if (apiKeyRequired) {
    const apiKey = state.apiKey.trim();
    if (mode === "add" && apiKey.length === 0) {
      return {
        ok: false,
        field: "apiKey",
        message: "API key is required for this provider.",
      };
    }
    if (mode === "edit" && apiKey.length === 0 && !hasExistingApiKey) {
      return {
        ok: false,
        field: "apiKey",
        message: "API key is required for this provider.",
      };
    }
  }

  return { ok: true };
}
