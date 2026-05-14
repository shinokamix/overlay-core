import { Settings2, X } from "lucide-react";
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
        <Settings2 />
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
        <X />
      </Button>
    </header>
  );
}
