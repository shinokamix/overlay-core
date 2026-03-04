import { useEffect } from "react";
import { Button } from "@/shared/ui/button";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function SettingsModal({ open, onClose }: Props) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/60 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
        className="w-full max-w-lg rounded-xl border border-border/80 bg-card p-4 shadow-2xl"
      >
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold">Settings</h2>
          <Button type="button" size="sm" variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="mt-4 min-h-28 rounded-lg border border-dashed border-border/70 bg-muted/30 p-4 text-sm text-muted-foreground">
          Temporary empty modal. Settings content will be added later.
        </div>
      </div>
    </div>
  );
}
