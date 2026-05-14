import { useOverlayWindowControls } from "@/features/overlay-header/model/use-overlay-window-controls";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";

type Props = {
  tauriRuntime: boolean;
  onOpenSettings: () => void;
};

function LogoMark() {
  return (
    <span
      aria-hidden
      className="flex size-8 items-center justify-center rounded-md bg-primary text-white shadow-sm"
    >
      <svg viewBox="0 0 18 18" className="size-4 fill-current">
        <path d="M9 2L3 6v6l6 4 6-4V6L9 2zm0 2.2L13.5 7v4.5L9 14l-4.5-2.5V7L9 4.2z" opacity="0.5" />
        <circle cx="9" cy="9" r="2.5" />
      </svg>
    </span>
  );
}

function GearIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.03 1.56V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1.11-1.56 1.7 1.7 0 0 0-1.87.34l-.06.06A2 2 0 1 1 4.13 16.92l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.56-1.03H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.65 8.85a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34H9a1.7 1.7 0 0 0 1.03-1.56V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1.03 1.56 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87V9a1.7 1.7 0 0 0 1.56 1.03H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.51 1z" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
    </svg>
  );
}

export function OverlayHeader({ tauriRuntime, onOpenSettings }: Props) {
  const { closeOverlay, isClosePending } = useOverlayWindowControls(tauriRuntime);

  return (
    <header className="flex items-center gap-3 border-b border-border px-4 py-3">
      <LogoMark />
      <div
        data-tauri-drag-region=""
        className="flex flex-1 cursor-grab select-none flex-col gap-0.5 active:cursor-grabbing"
      >
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold text-foreground">
            Lumina <span className="text-indigo-400">Chat</span>
          </span>
          <Badge
            tone="indigo"
            className="font-mono text-[10px]"
            style={{ paddingTop: 2, paddingBottom: 2 }}
          >
            v1.0
          </Badge>
        </div>
        <span className="text-[11px] text-muted-foreground">AI overlay assistant</span>
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={onOpenSettings}
        aria-label="Settings"
        title="Settings"
      >
        <GearIcon />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={() => void closeOverlay()}
        disabled={!tauriRuntime || isClosePending}
        aria-label={isClosePending ? "Closing..." : "Close app"}
        title={isClosePending ? "Closing..." : "Close app"}
      >
        <CloseIcon />
      </Button>
    </header>
  );
}
