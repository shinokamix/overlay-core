import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useChatShell } from "@/features/chat-shell/model/use-chat-shell";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

import { invoke } from "@tauri-apps/api/core";

const invokeMock = vi.mocked(invoke);

function wrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

function freshClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
}

beforeEach(() => {
  invokeMock.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useChatShell", () => {
  it("starts in browser availability when not in Tauri runtime", () => {
    const { result } = renderHook(() => useChatShell(false), {
      wrapper: wrapper(freshClient()),
    });

    expect(result.current.availability.status).toBe("browser");
    expect(result.current.messages).toHaveLength(0);
    expect(invokeMock).not.toHaveBeenCalled();
  });

  it("reports no-provider when get_active_provider resolves to null", async () => {
    invokeMock.mockImplementation(async (command: string) => {
      if (command === "get_active_provider") {
        return null;
      }
      throw new Error(`unexpected command ${command}`);
    });

    const { result } = renderHook(() => useChatShell(true), {
      wrapper: wrapper(freshClient()),
    });

    await waitFor(() => {
      expect(result.current.availability.status).toBe("no-provider");
    });
  });

  it("reports no-api-key when active provider has no key saved", async () => {
    invokeMock.mockImplementation(async (command: string) => {
      if (command === "get_active_provider") {
        return {
          connectionId: "openai",
          providerId: "openai",
          protocol: "openai",
          baseUrl: "https://api.openai.com/v1",
          model: "gpt-4o-mini",
          hasApiKey: false,
        };
      }
      throw new Error(`unexpected command ${command}`);
    });

    const { result } = renderHook(() => useChatShell(true), {
      wrapper: wrapper(freshClient()),
    });

    await waitFor(() => {
      expect(result.current.availability.status).toBe("no-api-key");
    });
  });

  it("submitDraft is a no-op while availability is not ready", async () => {
    invokeMock.mockImplementation(async (command: string) => {
      if (command === "get_active_provider") {
        return null;
      }
      throw new Error(`unexpected command ${command}`);
    });

    const { result } = renderHook(() => useChatShell(true), {
      wrapper: wrapper(freshClient()),
    });

    await waitFor(() => {
      expect(result.current.availability.status).toBe("no-provider");
    });

    act(() => {
      result.current.setDraft("hi");
    });
    await act(async () => {
      await result.current.submitDraft();
    });

    expect(result.current.messages).toHaveLength(0);
    expect(invokeMock).not.toHaveBeenCalledWith("send_chat_message", expect.anything());
  });

  it("sends the full conversation history when ready and appends the reply", async () => {
    invokeMock.mockImplementation(async (command: string, args?: unknown) => {
      if (command === "get_active_provider") {
        return {
          connectionId: "openai",
          providerId: "openai",
          protocol: "openai",
          baseUrl: "https://api.openai.com/v1",
          model: "gpt-4o-mini",
          hasApiKey: true,
        };
      }
      if (command === "send_chat_message") {
        const messages =
          (args as { input?: { messages?: { role: string; content: string }[] } } | undefined)
            ?.input?.messages ?? [];
        // Echo the last user message for assertion convenience.
        const lastUser = [...messages].reverse().find((message) => message.role === "user");
        return { text: `echo: ${lastUser?.content ?? ""}` };
      }
      throw new Error(`unexpected command ${command}`);
    });

    const { result } = renderHook(() => useChatShell(true), {
      wrapper: wrapper(freshClient()),
    });

    await waitFor(() => {
      expect(result.current.availability.status).toBe("ready");
    });

    act(() => {
      result.current.setDraft("hello");
    });
    await act(async () => {
      await result.current.submitDraft();
    });

    expect(result.current.messages.map((message) => message.text)).toEqual([
      "hello",
      "echo: hello",
    ]);

    act(() => {
      result.current.setDraft("second");
    });
    await act(async () => {
      await result.current.submitDraft();
    });

    expect(result.current.messages.map((message) => message.text)).toEqual([
      "hello",
      "echo: hello",
      "second",
      "echo: second",
    ]);

    const sendCalls = invokeMock.mock.calls.filter(([command]) => command === "send_chat_message");
    expect(sendCalls).toHaveLength(2);
    const secondCallInput = sendCalls[1][1] as {
      input: { messages: { role: string; content: string }[] };
    };
    expect(secondCallInput.input.messages).toEqual([
      { role: "user", content: "hello" },
      { role: "assistant", content: "echo: hello" },
      { role: "user", content: "second" },
    ]);
  });
});
