import { describe, expect, it } from "vitest";
import type { ProviderCatalogEntry } from "@/shared/lib/providers";
import type { ProviderConnectionView } from "@/features/provider-settings/model/api";
import {
  addCustomModel,
  initialFormForCatalogProvider,
  initialFormForConnection,
  modelOptions,
  removeCustomModel,
  validateConnectionForm,
  type ConnectionFormState,
} from "@/features/provider-settings/model/connection-form";

const openaiCatalogEntry: ProviderCatalogEntry = {
  id: "openai",
  name: "OpenAI",
  protocol: "openai",
  defaultBaseUrl: "https://api.openai.com/v1",
  auth: "api_key",
  allowsCustomModels: true,
  models: [
    {
      id: "gpt-4o",
      name: "GPT-4o",
      contextWindow: 128000,
      maxOutputTokens: 16384,
      capabilities: { vision: true, toolCalls: true, reasoning: false, audio: true },
    },
    {
      id: "gpt-4o-mini",
      name: "GPT-4o mini",
      contextWindow: 128000,
      maxOutputTokens: 16384,
      capabilities: { vision: true, toolCalls: true, reasoning: false, audio: false },
      default: true,
    },
  ],
};

const ollamaCatalogEntry: ProviderCatalogEntry = {
  id: "ollama",
  name: "Ollama",
  protocol: "openai",
  defaultBaseUrl: "http://localhost:11434/v1",
  auth: "none",
  allowsCustomModels: true,
  models: [
    {
      id: "llama3.2",
      name: "Llama 3.2",
      contextWindow: 131072,
      maxOutputTokens: 4096,
      capabilities: { vision: false, toolCalls: true, reasoning: false, audio: false },
      default: true,
    },
  ],
};

function baseState(): ConnectionFormState {
  return {
    providerId: "openai",
    displayName: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    defaultModel: "gpt-4o-mini",
    customModels: [],
    apiKey: "",
    customModelDraft: "",
  };
}

describe("initialFormForCatalogProvider", () => {
  it("seeds defaults from the catalog default model", () => {
    const state = initialFormForCatalogProvider(openaiCatalogEntry);
    expect(state.providerId).toBe("openai");
    expect(state.displayName).toBe("OpenAI");
    expect(state.baseUrl).toBe("https://api.openai.com/v1");
    expect(state.defaultModel).toBe("gpt-4o-mini");
    expect(state.customModels).toEqual([]);
    expect(state.apiKey).toBe("");
  });
});

describe("initialFormForConnection", () => {
  it("clones connection fields and clears the api key", () => {
    const connection: ProviderConnectionView = {
      id: "openai",
      providerId: "openai",
      displayName: "Work key",
      baseUrl: "https://api.openai.com/v1",
      defaultModel: "gpt-4o",
      customModels: ["custom-1"],
      hasApiKey: true,
    };
    const state = initialFormForConnection(connection);
    expect(state.providerId).toBe("openai");
    expect(state.displayName).toBe("Work key");
    expect(state.defaultModel).toBe("gpt-4o");
    expect(state.customModels).toEqual(["custom-1"]);
    expect(state.customModels).not.toBe(connection.customModels);
    expect(state.apiKey).toBe("");
  });
});

describe("modelOptions", () => {
  it("returns catalog ids first, then unique custom models, then the current default", () => {
    const state: ConnectionFormState = {
      ...baseState(),
      customModels: ["gpt-4o", "private-model"],
      defaultModel: "trailing-model",
    };
    const options = modelOptions(openaiCatalogEntry, state);
    expect(options).toEqual(["gpt-4o", "gpt-4o-mini", "private-model", "trailing-model"]);
  });

  it("falls back gracefully when provider is unknown", () => {
    const state: ConnectionFormState = {
      ...baseState(),
      customModels: ["x"],
      defaultModel: "y",
    };
    expect(modelOptions(undefined, state)).toEqual(["x", "y"]);
  });
});

describe("addCustomModel / removeCustomModel", () => {
  it("appends a trimmed draft and clears the input", () => {
    const next = addCustomModel({
      ...baseState(),
      customModelDraft: "  fancy-model  ",
    });
    expect(next.customModels).toEqual(["fancy-model"]);
    expect(next.customModelDraft).toBe("");
  });

  it("does not duplicate an existing custom model", () => {
    const next = addCustomModel({
      ...baseState(),
      customModels: ["a"],
      customModelDraft: "a",
    });
    expect(next.customModels).toEqual(["a"]);
    expect(next.customModelDraft).toBe("");
  });

  it("removes a model and clears the default if it matched", () => {
    const next = removeCustomModel(
      {
        ...baseState(),
        customModels: ["a", "b"],
        defaultModel: "a",
      },
      "a",
    );
    expect(next.customModels).toEqual(["b"]);
    expect(next.defaultModel).toBe("");
  });
});

describe("validateConnectionForm", () => {
  it("accepts a fully filled add form", () => {
    const result = validateConnectionForm(
      { ...baseState(), apiKey: "sk-..." },
      "add",
      openaiCatalogEntry,
      false,
    );
    expect(result.ok).toBe(true);
  });

  it("requires an API key on add for api_key providers", () => {
    const result = validateConnectionForm(baseState(), "add", openaiCatalogEntry, false);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.field).toBe("apiKey");
    }
  });

  it("allows empty api key on edit when one is already saved", () => {
    const result = validateConnectionForm(baseState(), "edit", openaiCatalogEntry, true);
    expect(result.ok).toBe(true);
  });

  it("requires api key on edit when none is saved yet", () => {
    const result = validateConnectionForm(baseState(), "edit", openaiCatalogEntry, false);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.field).toBe("apiKey");
    }
  });

  it("ignores api key requirement for providers with no auth", () => {
    const state: ConnectionFormState = {
      ...baseState(),
      providerId: "ollama",
      displayName: "Local",
      baseUrl: "http://localhost:11434/v1",
      defaultModel: "llama3.2",
    };
    const result = validateConnectionForm(state, "add", ollamaCatalogEntry, false);
    expect(result.ok).toBe(true);
  });

  it("rejects non-http(s) base URLs", () => {
    const state: ConnectionFormState = {
      ...baseState(),
      apiKey: "sk-...",
      baseUrl: "ftp://nope",
    };
    const result = validateConnectionForm(state, "add", openaiCatalogEntry, false);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.field).toBe("baseUrl");
    }
  });

  it("requires a default model", () => {
    const state: ConnectionFormState = {
      ...baseState(),
      apiKey: "sk-...",
      defaultModel: "",
    };
    const result = validateConnectionForm(state, "add", openaiCatalogEntry, false);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.field).toBe("defaultModel");
    }
  });
});
