import { useEffect, useState } from "react";
import { useHotkeySettings } from "@/features/hotkey-settings/model";
import { toHotkeyAccelerator } from "@/features/hotkey-settings/model/hotkey-accelerator";
import type { HotkeyAction } from "@/shared/config/hotkeys";
import { Button } from "@/shared/ui/button";
import { PanelHeader } from "@/shared/ui/panel-header";

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
    <section className="flex flex-col gap-4">
      <PanelHeader eyebrow="Hotkeys" title="Keyboard shortcuts" description={hotkeySupportHint} />

      <ul className="flex flex-col gap-2">
        {hotkeyRows.map((hotkeyRow) => {
          const isCapturing = capturingAction === hotkeyRow.action;
          const currentValue = hotkeyRow.accelerator || "Not set";
          const canClear = !controlsDisabled && Boolean(hotkeyRow.accelerator);

          return (
            <li
              key={hotkeyRow.action}
              className="grid gap-3 rounded-lg border border-border bg-surface-1 p-3 md:grid-cols-[1fr_auto] md:items-center"
            >
              <div>
                <p className="text-sm font-medium text-foreground">{hotkeyRow.title}</p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                  {hotkeyRow.description}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-start gap-1.5 md:justify-end">
                <span
                  className={
                    "rounded-sm border px-2.5 py-1 font-mono text-[11px] " +
                    (isCapturing
                      ? "border-indigo-500/40 bg-indigo-500/10 text-indigo-200"
                      : "border-[color:var(--input)] bg-surface-2 text-foreground/85")
                  }
                >
                  {isCapturing ? "Press shortcut..." : currentValue}
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant={isCapturing ? "primary" : "secondary"}
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
            </li>
          );
        })}
      </ul>

      <div className="flex flex-col gap-1 text-[11px]">
        {capturingAction ? (
          <p className="text-muted-foreground">
            Press a shortcut now. Press Escape to cancel capture.
          </p>
        ) : null}
        {captureError ? <p className="text-rose-400">{captureError}</p> : null}
        {savingAction ? <p className="text-muted-foreground">Saving hotkey...</p> : null}
        {hotkeyStatus ? <p className="text-muted-foreground">{hotkeyStatus}</p> : null}
        {hotkeyError ? <p className="text-rose-400">{hotkeyError}</p> : null}
      </div>
    </section>
  );
}
