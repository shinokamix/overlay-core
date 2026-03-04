import { useOverlayWindowControls } from "@/features/overlay-header/model/use-overlay-window-controls";
import { Button } from "@/shared/ui/button";

type Props = {
  tauriRuntime: boolean;
  onOpenSettings: () => void;
};

export function OverlayHeader({ tauriRuntime, onOpenSettings }: Props) {
  const { closeOverlay, isClosePending } = useOverlayWindowControls(tauriRuntime);

  return (
    <header className="space-y-2">
      <div className="flex items-center gap-2">
        <div
          data-tauri-drag-region=""
          aria-hidden
          className="h-8 flex-1 rounded-md border border-dashed border-border/70 bg-muted/30"
        />

        <Button type="button" variant="outline" size="sm" onClick={onOpenSettings}>
          Settings
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void closeOverlay()}
          disabled={!tauriRuntime || isClosePending}
        >
          {isClosePending ? "Closing..." : "Close app"}
        </Button>
      </div>
    </header>
  );
}
