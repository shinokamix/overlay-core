import { Fragment, useEffect, useState } from "react";
import { X } from "lucide-react";
import { useHotkeySettings } from "@/features/hotkey-settings/model";
import { toHotkeyAccelerator } from "@/features/hotkey-settings/model/hotkey-accelerator";
import type { HotkeyAction } from "@/shared/config/hotkeys";
import { Button } from "@/shared/ui/button";
import { PanelHeader } from "@/shared/ui/panel-header";
import { cn } from "@/shared/lib/utils";

type Props = {
  tauriRuntime: boolean;
};

function KeyBadge({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded border border-b-2 border-[color:var(--input)] bg-surface-2 px-2 py-0.5 font-mono text-[10px] text-foreground/85">
      {children}
    </kbd>
  );
}

type BindingDisplayProps = {
  accelerator: string | null;
  isCapturing: boolean;
  disabled: boolean;
  onClick: () => void;
};

function BindingDisplay({ accelerator, isCapturing, disabled, onClick }: BindingDisplayProps) {
  const base =
    "flex min-w-[110px] cursor-pointer items-center justify-center gap-1 rounded-md border p-1 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50";

  if (isCapturing) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={cn(
          base,
          "animate-pulse border-indigo-500/50 bg-indigo-500/10 text-[11px] text-indigo-300",
        )}
      >
        Recording…
      </button>
    );
  }

  if (!accelerator) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={cn(
          base,
          "border-dashed border-border bg-surface-1 text-[11px] italic text-muted-foreground",
          "hover:border-indigo-500/30 hover:bg-indigo-500/5 hover:text-indigo-300",
        )}
      >
        Click to record
      </button>
    );
  }

  const parts = accelerator.split("+");
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        base,
        "border-[color:var(--input)] bg-surface-1 hover:border-indigo-500/30 hover:bg-indigo-500/5",
      )}
    >
      {parts.map((part, i) => (
        <Fragment key={i}>
          {i > 0 && <span className="text-[10px] text-muted-foreground">+</span>}
          <KeyBadge>{part}</KeyBadge>
        </Fragment>
      ))}
    </button>
  );
}

export function HotkeySettingsPanel({ tauriRuntime }: Props) {
  const {
    hotkeyRows,
    hotkeyError,
    hotkeyStatus,
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
      <PanelHeader eyebrow="Hotkeys" title="Keyboard shortcuts" />

      <ul className="flex flex-col gap-2">
        {hotkeyRows.map((hotkeyRow) => {
          const isCapturing = capturingAction === hotkeyRow.action;
          const canClear = !controlsDisabled && Boolean(hotkeyRow.accelerator);

          return (
            <li
              key={hotkeyRow.action}
              className="flex flex-col justify-between gap-3 rounded-md border border-border bg-surface-1 p-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{hotkeyRow.title}</p>
              </div>

              <div className="flex shrink-0 items-center justify-between">
                <BindingDisplay
                  accelerator={hotkeyRow.accelerator}
                  isCapturing={isCapturing}
                  disabled={controlsDisabled}
                  onClick={() => handleCaptureToggle(hotkeyRow.action)}
                />
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => void updateHotkey(hotkeyRow.action, "")}
                  disabled={!canClear}
                  aria-label="Clear shortcut"
                >
                  <X className="size-3.5" />
                </Button>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="flex flex-col gap-1 text-[11px]">
        {capturingAction ? (
          <p className="text-muted-foreground">Press a shortcut now. Escape to cancel.</p>
        ) : null}
        {captureError ? <p className="text-rose-400">{captureError}</p> : null}
        {savingAction ? <p className="text-muted-foreground">Saving…</p> : null}
        {hotkeyStatus ? <p className="text-muted-foreground">{hotkeyStatus}</p> : null}
        {hotkeyError ? <p className="text-rose-400">{hotkeyError}</p> : null}
      </div>
    </section>
  );
}
