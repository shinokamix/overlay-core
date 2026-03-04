import { useRef, useState } from "react";

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

export function useChatShell() {
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [sendStatus, setSendStatus] = useState("");
  const sequenceRef = useRef(0);

  function submitDraft() {
    const nextDraft = draft.trim();

    if (!nextDraft) {
      setSendStatus("Type a message before sending.");
      return;
    }

    sequenceRef.current += 1;
    const idPrefix = String(sequenceRef.current);

    setMessages((prev) => [
      ...prev,
      {
        id: `user-${idPrefix}`,
        role: "user",
        text: nextDraft,
      },
      {
        id: `assistant-${idPrefix}`,
        role: "assistant",
        text: "Mock response: backend integration will be added in a next step.",
      },
    ]);
    setDraft("");
    setSendStatus("Message sent in mock mode.");
  }

  return {
    draft,
    messages,
    sendStatus,
    setDraft,
    submitDraft,
  };
}
