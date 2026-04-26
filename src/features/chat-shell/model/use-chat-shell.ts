import { useRef, useState } from "react";
import { toErrorMessage } from "@/shared/lib/to-error-message";
import { sendChatMessage } from "./api";

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  text: string;
};

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "assistant-welcome",
    role: "assistant",
    text: "Mock chat is ready. Type any text and press Send.",
  },
];

export function useChatShell(tauriRuntime: boolean) {
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [sendStatus, setSendStatus] = useState("");
  const [sendError, setSendError] = useState("");
  const [isSending, setIsSending] = useState(false);
  const sequenceRef = useRef(0);

  async function submitDraft() {
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

    setMessages((prev) => [...prev, userMessage]);
    setDraft("");
    setSendStatus("");
    setSendError("");

    if (!tauriRuntime) {
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${idPrefix}`,
          role: "assistant",
          text: "Mock response: open the desktop runtime to use a configured provider.",
        },
      ]);
      setSendStatus("Message sent in mock mode.");
      return;
    }

    setIsSending(true);

    try {
      const response = await sendChatMessage(nextDraft);
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${idPrefix}`,
          role: "assistant",
          text: response.text,
        },
      ]);
      setSendStatus("Provider response received.");
    } catch (error) {
      setSendError(`Failed to send message: ${toErrorMessage(error)}`);
    } finally {
      setIsSending(false);
    }
  }

  return {
    draft,
    isSending,
    messages,
    sendError,
    sendStatus,
    setDraft,
    submitDraft,
  };
}
