import { useEffect, useState } from "react";
import { useHotkeySettings } from "@/features/hotkey-settings/model";
import { toHotkeyAccelerator } from "@/features/hotkey-settings/model/hotkey-accelerator";
import type { HotkeyAction } from "@/shared/config/hotkeys";
import { Button } from "@/shared/ui/button";

type Props = {
  tauriRuntime: boolean;
};

export function HotkeySettingsPanel({ tauriRuntime }: Props) {
  const {
    hotkeyRows,
    hotkeyError,
    hotkeyStatus,
    hotkeySupportHint,
    isHotkeySaving,
    isHotkeysLoading,
    savingAction,
    updateHotkey,
  } = useHotkeySettings(tauriRuntime);
  const [capturingAction, setCapturingAction] = useState<HotkeyAction | null>(null);
  const [captureError, setCaptureError] = useState("");

  useEffect(() => {
    if (!capturingAction || !tauriRuntime) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      event.preventDefault();
      event.stopPropagation();

      if (
        event.key === "Escape" &&
        !event.ctrlKey &&
        !event.altKey &&
        !event.shiftKey &&
        !event.metaKey
      ) {
        setCapturingAction(null);
        setCaptureError("");
        return;
      }

      const accelerator = toHotkeyAccelerator(event);
      if (!accelerator) {
        setCaptureError("Use at least one non-modifier key for the hotkey.");
        return;
      }

      setCaptureError("");
      setCapturingAction(null);
      void updateHotkey(capturingAction, accelerator);
    };

    window.addEventListener("keydown", onKeyDown, true);
    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
    };
  }, [capturingAction, tauriRuntime, updateHotkey]);

  const controlsDisabled = !tauriRuntime || isHotkeysLoading || isHotkeySaving;

  function handleCaptureToggle(action: HotkeyAction) {
    if (capturingAction === action) {
      setCapturingAction(null);
      setCaptureError("");
      return;
    }

    setCapturingAction(action);
    setCaptureError("");
  }

  return (
    <section className="rounded-lg border bg-muted/40 p-4 text-sm">
      <p className="font-medium">Hotkeys</p>
      <p className="mt-1 text-muted-foreground">{hotkeySupportHint}</p>

      <div className="mt-4 space-y-3">
        {hotkeyRows.map((hotkeyRow) => {
          const isCapturing = capturingAction === hotkeyRow.action;
          const currentValue = hotkeyRow.accelerator || "Not set";
          const canClear = !controlsDisabled && Boolean(hotkeyRow.accelerator);

          return (
            <div
              key={hotkeyRow.action}
              className="grid gap-3 rounded-lg border border-border/70 bg-background/80 p-3 md:grid-cols-[1fr_auto] md:items-center"
            >
              <div>
                <p className="text-sm font-medium">{hotkeyRow.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{hotkeyRow.description}</p>
              </div>

              <div className="flex flex-wrap items-center justify-start gap-2 md:justify-end">
                <span className="rounded-md border border-border/70 bg-muted/20 px-3 py-1.5 font-mono text-xs">
                  {isCapturing ? "Press shortcut..." : currentValue}
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant={isCapturing ? "secondary" : "outline"}
                  onClick={() => handleCaptureToggle(hotkeyRow.action)}
                  disabled={controlsDisabled}
                >
                  {isCapturing ? "Cancel" : "Change"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => void updateHotkey(hotkeyRow.action, "")}
                  disabled={!canClear}
                >
                  Clear
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {capturingAction ? (
        <p className="mt-3 text-xs text-muted-foreground">
          Press a shortcut now. Press Escape to cancel capture.
        </p>
      ) : null}
      {captureError ? <p className="mt-2 text-xs text-destructive">{captureError}</p> : null}
      {savingAction ? <p className="mt-2 text-xs text-muted-foreground">Saving hotkey...</p> : null}
      {hotkeyStatus ? <p className="mt-3 text-xs text-muted-foreground">{hotkeyStatus}</p> : null}
      {hotkeyError ? <p className="mt-2 text-xs text-destructive">{hotkeyError}</p> : null}
    </section>
  );
}
