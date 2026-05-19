import { ArrowUp, User } from "lucide-react";
import { useEffect, useRef } from "react";
import type { ChatAvailability } from "@/features/chat-shell/model/use-chat-shell";
import { useChatShell } from "@/features/chat-shell/model/use-chat-shell";
import { cn } from "@/shared/lib/utils";
import { MarkdownMessage } from "./markdown-message";

type Props = {
  tauriRuntime: boolean;
};

function availabilityCopy(availability: ChatAvailability): string | null {
  switch (availability.status) {
    case "browser":
      return "Open the desktop runtime to chat with a configured provider.";
    case "loading":
      return "Loading active provider...";
    case "no-provider":
      return "Connect a provider in Settings → Providers to start chatting.";
    case "no-api-key":
      return `Add an API key for ${availability.provider.providerId} in Settings → Providers.`;
    case "ready":
      return null;
  }
}

export function ChatShell({ tauriRuntime }: Props) {
  const { availability, draft, isSending, messages, setDraft, submitDraft } =
    useChatShell(tauriRuntime);

  const cta = availabilityCopy(availability);
  const composerDisabled = availability.status !== "ready" || isSending;
  const sendDisabled = composerDisabled || draft.trim().length === 0;

  const lastMessage = messages[messages.length - 1];
  const showThinking = isSending && lastMessage?.role !== "assistant";

  const listRef = useRef<HTMLUListElement>(null);
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [draft]);

  return (
    <section className="flex flex-1 flex-col gap-4 px-4 py-4">
      <ul
        ref={listRef}
        aria-label="Conversation"
        className="lumina-scrollbar flex h-72 flex-col gap-3 overflow-y-auto rounded-md border border-border bg-surface-1 p-3"
      >
        {messages.length === 0 ? (
          <li className="m-auto max-w-[80%] text-center text-xs leading-relaxed text-muted-foreground">
            {cta ?? "Send a message to start the conversation."}
          </li>
        ) : (
          messages.map((message) => {
            const isUser = message.role === "user";
            return (
              <li
                key={message.id}
                className={cn("flex items-start gap-2", isUser ? "flex-row-reverse" : "flex-row")}
              >
                <span
                  className={cn(
                    "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-sm border text-[10px] font-semibold",
                    isUser
                      ? "border-[color:var(--input)] bg-surface-3 text-muted-foreground"
                      : "border-indigo-500/30 bg-indigo-900/60 text-indigo-200",
                  )}
                  aria-hidden
                >
                  {isUser ? <User className="size-3.5" /> : "AI"}
                </span>
                {isUser ? (
                  <p className="max-w-[78%] rounded-md rounded-br-[4px] bg-indigo-600 px-3 py-2 text-xs leading-relaxed text-white">
                    {message.text}
                  </p>
                ) : (
                  <MarkdownMessage
                    text={message.text}
                    className="max-w-[78%] rounded-md rounded-bl-[4px] border border-border bg-surface-2 px-3 py-2 text-xs text-foreground"
                  />
                )}
              </li>
            );
          })
        )}

        {showThinking ? (
          <li className="flex items-start gap-2">
            <span
              aria-hidden
              className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-sm border border-indigo-500/30 bg-indigo-900/60 text-[10px] font-semibold text-indigo-200"
            >
              AI
            </span>
            <span className="inline-flex items-center gap-2 rounded-md border border-border bg-surface-2 px-3 py-2 text-[11px] italic text-muted-foreground">
              <span className="lumina-bubble-blink" aria-hidden>
                <span />
                <span />
                <span />
              </span>
              Thinking...
            </span>
          </li>
        ) : null}
      </ul>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void submitDraft();
        }}
        className="flex items-end gap-2 rounded-md border border-[color:var(--input)] bg-surface-2 px-3.5 py-2 transition-shadow focus-within:border-indigo-500/40 focus-within:shadow-[0_0_0_3px_rgba(201,173,167,0.08)]"
      >
        <textarea
          ref={textareaRef}
          aria-label="Message"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              if (!sendDisabled) {
                void submitDraft();
              }
            }
          }}
          placeholder={cta ?? "Message..."}
          disabled={composerDisabled}
          rows={1}
          className="lumina-scrollbar flex-1 resize-none overflow-y-auto bg-transparent text-xs leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
          style={{ maxHeight: "8rem", height: "100%" }}
        />
        <button
          type="submit"
          disabled={sendDisabled}
          aria-label="Send"
          title="Send"
          className="flex size-5 shrink-0 items-center justify-center rounded-sm bg-primary text-white transition-all hover:bg-indigo-500 active:scale-90 disabled:cursor-not-allowed disabled:opacity-30 [&_svg]:size-3.5"
        >
          <ArrowUp />
          <span className="sr-only">{isSending ? "Sending..." : "Send"}</span>
        </button>
      </form>
    </section>
  );
}
