import { useCallback, useMemo, useRef, useState } from "react";
import { toErrorMessage } from "@/shared/lib/to-error-message";
import { useActiveProvider, type ActiveProviderView } from "@/shared/lib/providers";
import { streamChatMessage, type WireChatMessage } from "./api";

export type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  text: string;
};

export type ChatAvailability =
  | { status: "browser" }
  | { status: "loading" }
  | { status: "no-provider" }
  | { status: "no-api-key"; provider: ActiveProviderView }
  | { status: "ready"; provider: ActiveProviderView };

export type UseChatShellResult = {
  availability: ChatAvailability;
  draft: string;
  isSending: boolean;
  messages: ChatMessage[];
  sendError: string;
  sendStatus: string;
  setDraft: (value: string) => void;
  submitDraft: () => Promise<void>;
};

function deriveAvailability(
  tauriRuntime: boolean,
  isLoading: boolean,
  provider: ActiveProviderView | null | undefined,
): ChatAvailability {
  if (!tauriRuntime) {
    return { status: "browser" };
  }
  if (isLoading) {
    return { status: "loading" };
  }
  if (!provider) {
    return { status: "no-provider" };
  }
  if (!provider.hasApiKey) {
    return { status: "no-api-key", provider };
  }
  return { status: "ready", provider };
}

export function useChatShell(tauriRuntime: boolean): UseChatShellResult {
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sendStatus, setSendStatus] = useState("");
  const [sendError, setSendError] = useState("");
  const [isSending, setIsSending] = useState(false);
  const sequenceRef = useRef(0);
  const pendingChunkRef = useRef("");
  const rafRef = useRef<number | null>(null);

  const activeProviderQuery = useActiveProvider(tauriRuntime);
  const availability = useMemo(
    () => deriveAvailability(tauriRuntime, activeProviderQuery.isLoading, activeProviderQuery.data),
    [tauriRuntime, activeProviderQuery.isLoading, activeProviderQuery.data],
  );

  const flushPending = useCallback((assistantId: string, firstChunkRef: { current: boolean }) => {
    const text = pendingChunkRef.current;
    if (!text) return;
    pendingChunkRef.current = "";

    if (firstChunkRef.current) {
      firstChunkRef.current = false;
      setMessages((previous) => [...previous, { id: assistantId, role: "assistant", text }]);
    } else {
      setMessages((previous) =>
        previous.map((m) => (m.id === assistantId ? { ...m, text: m.text + text } : m)),
      );
    }
  }, []);

  async function submitDraft() {
    if (availability.status !== "ready") {
      return;
    }

    const nextDraft = draft.trim();

    if (!nextDraft) {
      setSendStatus("Type a message before sending.");
      setSendError("");
      return;
    }

    sequenceRef.current += 1;
    const idPrefix = String(sequenceRef.current);
    const userMessage: ChatMessage = {
      id: `user-${idPrefix}`,
      role: "user",
      text: nextDraft,
    };

    const history: WireChatMessage[] = [
      ...messages.map((message) => ({
        role: message.role,
        content: message.text,
      })),
      { role: "user", content: nextDraft },
    ];

    setMessages((previous) => [...previous, userMessage]);
    setDraft("");
    setSendStatus("");
    setSendError("");
    setIsSending(true);

    const assistantId = `assistant-${idPrefix}`;
    const firstChunkRef = { current: true };
    pendingChunkRef.current = "";

    const scheduleFlush = () => {
      if (rafRef.current !== null) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        flushPending(assistantId, firstChunkRef);
      });
    };

    try {
      await streamChatMessage(history, ({ text }) => {
        pendingChunkRef.current += text;
        scheduleFlush();
      });
      // flush any remaining buffered text after stream ends
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      flushPending(assistantId, firstChunkRef);
      setSendStatus("Provider response received.");
    } catch (error) {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      setSendError(`Failed to send message: ${toErrorMessage(error)}`);
    } finally {
      setIsSending(false);
    }
  }

  return {
    availability,
    draft,
    isSending,
    messages,
    sendError,
    sendStatus,
    setDraft,
    submitDraft,
  };
}
