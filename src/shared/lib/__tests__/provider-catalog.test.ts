import { describe, expect, it, vi } from "vitest";
import {
  fetchProviderCatalog,
  findCatalogModel,
  findCatalogProvider,
  getDefaultModel,
  type ProviderCatalog,
} from "@/shared/lib/providers";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

import { invoke } from "@tauri-apps/api/core";

const sampleCatalog: ProviderCatalog = {
  version: 1,
  providers: [
    {
      id: "openai",
      name: "OpenAI",
      protocol: "openai",
      defaultBaseUrl: "https://api.openai.com/v1",
      auth: "api_key",
      allowsCustomModels: true,
      models: [
        {
          id: "gpt-4o-mini",
          name: "GPT-4o mini",
          contextWindow: 128000,
          maxOutputTokens: 16384,
          capabilities: { vision: true, toolCalls: true, reasoning: false, audio: false },
          default: true,
        },
        {
          id: "gpt-4o",
          name: "GPT-4o",
          contextWindow: 128000,
          maxOutputTokens: 16384,
          capabilities: { vision: true, toolCalls: true, reasoning: false, audio: true },
        },
      ],
    },
  ],
};

describe("provider catalog helpers", () => {
  it("findCatalogProvider returns the matching entry", () => {
    expect(findCatalogProvider(sampleCatalog, "openai")?.name).toBe("OpenAI");
    expect(findCatalogProvider(sampleCatalog, "missing")).toBeUndefined();
    expect(findCatalogProvider(undefined, "openai")).toBeUndefined();
  });

  it("findCatalogModel locates a model inside a provider", () => {
    const provider = findCatalogProvider(sampleCatalog, "openai");
    expect(findCatalogModel(provider, "gpt-4o")?.name).toBe("GPT-4o");
    expect(findCatalogModel(provider, "missing")).toBeUndefined();
    expect(findCatalogModel(undefined, "gpt-4o")).toBeUndefined();
  });

  it("getDefaultModel prefers the flagged default, otherwise the first model", () => {
    const provider = findCatalogProvider(sampleCatalog, "openai");
    expect(getDefaultModel(provider)?.id).toBe("gpt-4o-mini");

    const providerWithoutFlag = {
      ...provider!,
      models: provider!.models.map((model) => ({ ...model, default: false })),
    };
    expect(getDefaultModel(providerWithoutFlag)?.id).toBe("gpt-4o-mini");

    const providerWithoutModels = { ...provider!, models: [] };
    expect(getDefaultModel(providerWithoutModels)).toBeUndefined();
    expect(getDefaultModel(undefined)).toBeUndefined();
  });

  it("fetchProviderCatalog forwards the Tauri invoke result", async () => {
    vi.mocked(invoke).mockResolvedValueOnce(sampleCatalog);
    await expect(fetchProviderCatalog()).resolves.toEqual(sampleCatalog);
    expect(invoke).toHaveBeenCalledWith("list_provider_catalog");
  });
});
