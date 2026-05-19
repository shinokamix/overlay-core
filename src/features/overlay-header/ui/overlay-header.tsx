import { Settings2, X } from "lucide-react";
import { useOverlayWindowControls } from "@/features/overlay-header/model/use-overlay-window-controls";
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

  async function handleDragMouseDown() {
    if (!tauriRuntime) return;
    const { getCurrentWindow } = await import("@tauri-apps/api/window");
    await getCurrentWindow().startDragging();
  }

  return (
    <header
      onMouseDown={() => void handleDragMouseDown()}
      className="flex cursor-grab select-none items-center gap-3 border-b border-border px-4 py-3 active:cursor-grabbing"
    >
      <LogoMark />
      <div className="flex flex-1 flex-col gap-0.5">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold text-foreground">overlay-core</span>
        </div>
        <span className="text-[11px] text-muted-foreground">AI assistant</span>
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onMouseDown={(e) => e.stopPropagation()}
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
        onMouseDown={(e) => e.stopPropagation()}
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
