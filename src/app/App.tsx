import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/shared/ui/button";
import { getHotkeyBindings, updateHotkeyBinding } from "@/app/model/hotkeys-api";
import {
  getOverlayInteractionEnabled,
  onOverlayInteractionChanged,
  setOverlayInteractionEnabled,
  toggleOverlayInteractionEnabled,
} from "@/app/model/overlay-api";
import { isTauriRuntime } from "@/shared/config/runtime";

const TOGGLE_OVERLAY_VISIBILITY_ACTION = "toggle_overlay_visibility";
const TOGGLE_OVERLAY_INTERACTIVITY_ACTION = "toggle_overlay_interactivity";

async function getMilestoneStatus() {
  return {
    name: "hotkey -> screenshot -> attach -> ask -> answer",
    status: "in-progress",
  };
}

function toErrorMessage(error: unknown): string {
  if (typeof error === "string") {
    return error;
  }

  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string") {
      return message;
    }
  }

  return "Unexpected error";
}

export default function App() {
  const [toggleVisibilityHotkey, setToggleVisibilityHotkey] = useState("Ctrl+Shift+Space");
  const [toggleInteractivityHotkey, setToggleInteractivityHotkey] = useState("Ctrl+Shift+Enter");
  const [hotkeyStatus, setHotkeyStatus] = useState("");
  const [hotkeyError, setHotkeyError] = useState("");
  const [isHotkeysLoading, setIsHotkeysLoading] = useState(false);
  const [isHotkeySaving, setIsHotkeySaving] = useState(false);
  const [interactionEnabled, setInteractionEnabled] = useState(false);
  const [isInteractionLoading, setIsInteractionLoading] = useState(false);

  const tauriRuntime = isTauriRuntime();
  const panelRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!tauriRuntime) {
      return;
    }

    let canceled = false;

    async function loadHotkeySettings() {
      setIsHotkeysLoading(true);
      setHotkeyError("");
      setHotkeyStatus("");

      try {
        const bindings = await getHotkeyBindings();

        if (canceled) {
          return;
        }

        const visibilityBinding = bindings.find(
          (binding) => binding.action === TOGGLE_OVERLAY_VISIBILITY_ACTION,
        );
        if (visibilityBinding) {
          setToggleVisibilityHotkey(visibilityBinding.accelerator);
        }

        const interactivityBinding = bindings.find(
          (binding) => binding.action === TOGGLE_OVERLAY_INTERACTIVITY_ACTION,
        );
        if (interactivityBinding) {
          setToggleInteractivityHotkey(interactivityBinding.accelerator);
        }
      } catch (error) {
        if (!canceled) {
          setHotkeyError(`Failed to load hotkey settings: ${toErrorMessage(error)}`);
        }
      } finally {
        if (!canceled) {
          setIsHotkeysLoading(false);
        }
      }
    }

    void loadHotkeySettings();

    return () => {
      canceled = true;
    };
  }, [tauriRuntime]);

  useEffect(() => {
    if (!tauriRuntime) {
      return;
    }

    let canceled = false;
    let unlisten: (() => void) | null = null;

    async function bindInteractionState() {
      setIsInteractionLoading(true);

      try {
        const enabled = await getOverlayInteractionEnabled();
        if (!canceled) {
          setInteractionEnabled(enabled);
        }

        unlisten = await onOverlayInteractionChanged((nextEnabled) => {
          setInteractionEnabled(nextEnabled);
        });
      } catch (error) {
        if (!canceled) {
          setHotkeyError(`Failed to sync overlay interaction state: ${toErrorMessage(error)}`);
        }
      } finally {
        if (!canceled) {
          setIsInteractionLoading(false);
        }
      }
    }

    void bindInteractionState();

    return () => {
      canceled = true;
      if (unlisten) {
        unlisten();
      }
    };
  }, [tauriRuntime]);

  useEffect(() => {
    if (!tauriRuntime || !interactionEnabled) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }

      event.preventDefault();
      void setOverlayInteractionEnabled(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [interactionEnabled, tauriRuntime]);

  useEffect(() => {
    if (!tauriRuntime || !panelRef.current) {
      return;
    }

    let disposed = false;
    let observer: ResizeObserver | null = null;

    async function bindWindowSizeSync() {
      const { LogicalSize, getCurrentWindow } = await import("@tauri-apps/api/window");
      if (disposed || !panelRef.current) {
        return;
      }

      const appWindow = getCurrentWindow();

      const applySize = async () => {
        if (!panelRef.current) {
          return;
        }

        const rect = panelRef.current.getBoundingClientRect();
        const width = Math.min(980, Math.max(520, Math.ceil(rect.width + 24)));
        const height = Math.min(820, Math.max(220, Math.ceil(rect.height + 24)));

        try {
          await appWindow.setSize(new LogicalSize(width, height));
        } catch (error) {
          setHotkeyError(`Failed to resize overlay window: ${toErrorMessage(error)}`);
        }
      };

      observer = new ResizeObserver(() => {
        void applySize();
      });
      observer.observe(panelRef.current);

      void applySize();
    }

    void bindWindowSizeSync();

    return () => {
      disposed = true;
      if (observer) {
        observer.disconnect();
      }
    };
  }, [tauriRuntime]);

  const hotkeySupportHint = useMemo(() => {
    if (!tauriRuntime) {
      return "Open in Tauri desktop runtime to configure hotkeys.";
    }

    return "Overlay is click-through by default. Use the interaction hotkey to unlock UI controls temporarily.";
  }, [tauriRuntime]);

  const { data, isLoading } = useQuery({
    queryKey: ["milestone-status"],
    queryFn: getMilestoneStatus,
  });

  async function handleSaveHotkey() {
    if (!tauriRuntime) {
      setHotkeyError("Hotkey updates are available only in desktop runtime.");
      return;
    }

    const nextVisibilityHotkey = toggleVisibilityHotkey.trim();
    const nextInteractivityHotkey = toggleInteractivityHotkey.trim();

    if (!nextVisibilityHotkey || !nextInteractivityHotkey) {
      setHotkeyError("Hotkeys cannot be empty.");
      return;
    }

    setIsHotkeySaving(true);
    setHotkeyError("");
    setHotkeyStatus("");

    try {
      await updateHotkeyBinding(TOGGLE_OVERLAY_VISIBILITY_ACTION, nextVisibilityHotkey);
      await updateHotkeyBinding(TOGGLE_OVERLAY_INTERACTIVITY_ACTION, nextInteractivityHotkey);

      setToggleVisibilityHotkey(nextVisibilityHotkey);
      setToggleInteractivityHotkey(nextInteractivityHotkey);
      setHotkeyStatus(
        `Hotkeys saved: visibility ${nextVisibilityHotkey}, interaction ${nextInteractivityHotkey}`,
      );
    } catch (error) {
      setHotkeyError(`Failed to save hotkey: ${toErrorMessage(error)}`);
    } finally {
      setIsHotkeySaving(false);
    }
  }

  async function handleToggleInteraction() {
    if (!tauriRuntime) {
      return;
    }

    try {
      setIsInteractionLoading(true);
      const enabled = await toggleOverlayInteractionEnabled();
      setInteractionEnabled(enabled);
    } catch (error) {
      setHotkeyError(`Failed to toggle interaction mode: ${toErrorMessage(error)}`);
    } finally {
      setIsInteractionLoading(false);
    }
  }

  return (
    <main className="p-3 text-foreground opacity-70">
      <section
        ref={panelRef}
        className="mx-auto flex w-full max-w-2xl flex-col gap-6 rounded-xl border bg-card/95 p-6 shadow-xl backdrop-blur"
      >
        <header className="space-y-2">
          <p className="text-sm text-muted-foreground">overlay-core bootstrap</p>
          <h1 className="text-2xl font-semibold tracking-tight">Local-first AI overlay</h1>
        </header>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={handleToggleInteraction}
            disabled={!tauriRuntime || isInteractionLoading}
          >
            {interactionEnabled ? "Lock interaction" : "Unlock interaction"}
          </Button>
          <span className="text-sm text-muted-foreground">
            Interaction mode: <strong>{interactionEnabled ? "interactive" : "passive"}</strong>
          </span>
          <span className="text-sm text-muted-foreground">Esc locks interaction</span>
        </div>

        <section className="rounded-lg border bg-muted/40 p-4 text-sm">
          <p className="font-medium">Hotkeys</p>
          <p className="mt-1 text-muted-foreground">{hotkeySupportHint}</p>

          <div className="mt-4 grid gap-2">
            <label
              htmlFor="toggle-overlay-visibility-hotkey"
              className="text-xs font-medium text-muted-foreground"
            >
              Toggle overlay visibility
            </label>
            <input
              id="toggle-overlay-visibility-hotkey"
              value={toggleVisibilityHotkey}
              onChange={(event) => setToggleVisibilityHotkey(event.target.value)}
              placeholder="Ctrl+Shift+Space"
              disabled={!tauriRuntime || isHotkeysLoading || isHotkeySaving}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm"
            />

            <label
              htmlFor="toggle-overlay-interaction-hotkey"
              className="mt-2 text-xs font-medium text-muted-foreground"
            >
              Toggle interaction mode
            </label>
            <input
              id="toggle-overlay-interaction-hotkey"
              value={toggleInteractivityHotkey}
              onChange={(event) => setToggleInteractivityHotkey(event.target.value)}
              placeholder="Ctrl+Shift+Enter"
              disabled={!tauriRuntime || isHotkeysLoading || isHotkeySaving}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm"
            />
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              onClick={handleSaveHotkey}
              disabled={!tauriRuntime || isHotkeysLoading || isHotkeySaving}
            >
              {isHotkeySaving ? "Saving..." : "Save hotkey"}
            </Button>
          </div>

          {hotkeyStatus ? (
            <p className="mt-3 text-xs text-muted-foreground">{hotkeyStatus}</p>
          ) : null}
          {hotkeyError ? <p className="mt-2 text-xs text-destructive">{hotkeyError}</p> : null}
        </section>

        <div className="rounded-lg border bg-muted/40 p-4 text-sm">
          <p className="font-medium">Current milestone</p>
          {isLoading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : (
            <p className="text-muted-foreground">
              {data?.name} ({data?.status})
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
