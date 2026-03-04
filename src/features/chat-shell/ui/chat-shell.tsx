import { useChatShell } from "@/features/chat-shell/model/use-chat-shell";
import { Button } from "@/shared/ui/button";

export function ChatShell() {
  const { draft, messages, sendStatus, setDraft, submitDraft } = useChatShell();

  return (
    <section className="flex flex-1 flex-col gap-3">
      <ul className="flex max-h-72 min-h-56 flex-col gap-3 overflow-y-auto rounded-xl border border-border/70 bg-muted/30 p-3">
        {messages.map((message) => (
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
        ))}
      </ul>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          submitDraft();
        }}
        className="flex items-center gap-2"
      >
        <input
          aria-label="Message"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Type your message..."
          className="h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm shadow-sm"
        />
        <Button type="submit">Send</Button>
      </form>

      {sendStatus ? <p className="text-xs text-muted-foreground">{sendStatus}</p> : null}
    </section>
  );
}
