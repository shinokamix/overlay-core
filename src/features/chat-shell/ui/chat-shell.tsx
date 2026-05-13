import type { ChatAvailability } from "@/features/chat-shell/model/use-chat-shell";
import { useChatShell } from "@/features/chat-shell/model/use-chat-shell";
import { Button } from "@/shared/ui/button";

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

function subtitle(availability: ChatAvailability): string {
  if (availability.status === "ready" || availability.status === "no-api-key") {
    return `${availability.provider.providerId} · ${availability.provider.model}`;
  }
  return "No provider connected";
}

export function ChatShell({ tauriRuntime }: Props) {
  const { availability, draft, isSending, messages, sendError, sendStatus, setDraft, submitDraft } =
    useChatShell(tauriRuntime);

  const cta = availabilityCopy(availability);
  const composerDisabled = availability.status !== "ready" || isSending;
  const sendDisabled = composerDisabled || draft.trim().length === 0;

  return (
    <section className="flex flex-1 flex-col gap-3">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Overlay Chat</p>
        <div className="flex items-baseline justify-between gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">Chat</h1>
          <span className="text-xs text-muted-foreground">{subtitle(availability)}</span>
        </div>
      </div>

      <ul
        aria-label="Conversation"
        className="flex max-h-72 min-h-56 flex-col gap-3 overflow-y-auto rounded-xl border border-border/70 bg-muted/30 p-3"
      >
        {messages.length === 0 ? (
          <li className="m-auto max-w-[80%] text-center text-sm text-muted-foreground">
            {cta ?? "Send a message to start the conversation."}
          </li>
        ) : (
          messages.map((message) => (
            <li
              key={message.id}
              className={message.role === "user" ? "flex justify-end" : "flex justify-start"}
            >
              <p
                className={
                  message.role === "user"
                    ? "max-w-[80%] rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-sm text-primary-foreground"
                    : "max-w-[80%] rounded-2xl rounded-bl-sm border border-border/80 bg-card px-3 py-2 text-sm"
                }
              >
                {message.text}
              </p>
            </li>
          ))
        )}
      </ul>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void submitDraft();
        }}
        className="flex items-center gap-2"
      >
        <input
          aria-label="Message"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={cta ?? "Type your message..."}
          disabled={composerDisabled}
          className="h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
        />
        <Button type="submit" disabled={sendDisabled}>
          {isSending ? "Sending..." : "Send"}
        </Button>
      </form>

      {messages.length > 0 && cta ? <p className="text-xs text-muted-foreground">{cta}</p> : null}
      {sendStatus ? <p className="text-xs text-muted-foreground">{sendStatus}</p> : null}
      {sendError ? <p className="text-xs text-destructive">{sendError}</p> : null}
    </section>
  );
}
