import { ArrowUp, User } from "lucide-react";
import type { ChatAvailability } from "@/features/chat-shell/model/use-chat-shell";
import { useChatShell } from "@/features/chat-shell/model/use-chat-shell";
import { Badge } from "@/shared/ui/badge";
import { PanelHeader } from "@/shared/ui/panel-header";
import { cn } from "@/shared/lib/utils";

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

function StatusIndicator({ availability }: { availability: ChatAvailability }) {
  switch (availability.status) {
    case "ready":
      return (
        <Badge tone="green" withDot>
          Online
        </Badge>
      );
    case "loading":
      return (
        <Badge tone="amber" withDot>
          Loading
        </Badge>
      );
    case "no-api-key":
      return (
        <Badge tone="amber" withDot>
          API key required
        </Badge>
      );
    case "no-provider":
      return (
        <Badge tone="rose" withDot>
          No provider
        </Badge>
      );
    case "browser":
      return (
        <Badge tone="neutral" withDot>
          Browser preview
        </Badge>
      );
  }
}

function providerModel(availability: ChatAvailability): string | null {
  if (availability.status === "ready" || availability.status === "no-api-key") {
    return availability.provider.model;
  }
  return null;
}

export function ChatShell({ tauriRuntime }: Props) {
  const { availability, draft, isSending, messages, sendError, sendStatus, setDraft, submitDraft } =
    useChatShell(tauriRuntime);

  const cta = availabilityCopy(availability);
  const composerDisabled = availability.status !== "ready" || isSending;
  const sendDisabled = composerDisabled || draft.trim().length === 0;
  const model = providerModel(availability);

  return (
    <section className="flex flex-1 flex-col gap-4 px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <PanelHeader eyebrow="Overlay Chat" title="Chat" as="h1" />
        <div className="flex flex-col items-end gap-1.5">
          <StatusIndicator availability={availability} />
          {model ? (
            <span className="font-mono text-[10px] text-muted-foreground">{model}</span>
          ) : null}
        </div>
      </div>

      <ul
        aria-label="Conversation"
        className="lumina-scrollbar flex max-h-72 min-h-56 flex-col gap-3 overflow-y-auto rounded-xl border border-border bg-surface-1 p-3"
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
                <p
                  className={cn(
                    "max-w-[78%] px-3 py-2 text-xs leading-relaxed",
                    isUser
                      ? "rounded-md rounded-br-[4px] bg-indigo-600 text-white"
                      : "rounded-md rounded-bl-[4px] border border-border bg-surface-2 text-foreground",
                  )}
                >
                  {message.text}
                </p>
              </li>
            );
          })
        )}

        {isSending ? (
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
        className="flex items-end gap-2 rounded-xl border border-[color:var(--input)] bg-surface-2 px-3 py-2 focus-within:border-indigo-500/40"
      >
        <textarea
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
          placeholder={cta ?? "Type your message..."}
          disabled={composerDisabled}
          rows={1}
          className="lumina-scrollbar max-h-32 flex-1 resize-none bg-transparent text-xs text-foreground placeholder:text-[color:var(--text-muted-strong)] focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={sendDisabled}
          aria-label="Send"
          title="Send"
          className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-white shadow-sm transition-colors hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:size-4"
        >
          <ArrowUp />
          <span className="sr-only">{isSending ? "Sending..." : "Send"}</span>
        </button>
      </form>

      {(messages.length > 0 && cta) || sendStatus || sendError ? (
        <div className="flex flex-col gap-1 text-[11px]">
          {messages.length > 0 && cta ? <p className="text-muted-foreground">{cta}</p> : null}
          {sendStatus ? <p className="text-muted-foreground">{sendStatus}</p> : null}
          {sendError ? <p className="text-rose-400">{sendError}</p> : null}
        </div>
      ) : null}
    </section>
  );
}
