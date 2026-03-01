import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/shared/ui/button";
import { useOverlayStore } from "@/app/model/overlay-store";
import {
  applyHyprlandHotkeyBinding,
  getHotkeyBindings,
  getHotkeyPlatformInfo,
  updateHotkeyBinding,
} from "@/app/model/hotkeys-api";
import type { HotkeyPlatformInfo } from "@/shared/config/hotkeys";
import { isTauriRuntime } from "@/shared/config/runtime";

const TOGGLE_OVERLAY_ACTION = "toggle_overlay_visibility";

const DEFAULT_PLATFORM_INFO: HotkeyPlatformInfo = {
  isLinux: false,
  isWayland: false,
  isHyprland: false,
  supportsNativeGlobalShortcuts: true,
  canAutoConfigureHyprland: false,
};

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
  const isVisible = useOverlayStore((state) => state.isVisible);
  const toggleVisibility = useOverlayStore((state) => state.toggleVisibility);

  const [platformInfo, setPlatformInfo] = useState<HotkeyPlatformInfo>(DEFAULT_PLATFORM_INFO);
  const [toggleHotkey, setToggleHotkey] = useState("Ctrl+Shift+Space");
  const [hotkeyStatus, setHotkeyStatus] = useState("");
  const [hotkeyError, setHotkeyError] = useState("");
  const [hyprlandStatus, setHyprlandStatus] = useState("");
  const [isHotkeysLoading, setIsHotkeysLoading] = useState(false);
  const [isHotkeySaving, setIsHotkeySaving] = useState(false);
  const [isHyprlandApplying, setIsHyprlandApplying] = useState(false);

  const tauriRuntime = isTauriRuntime();

  useEffect(() => {
    if (!tauriRuntime) {
      return;
    }

    let canceled = false;

    async function loadHotkeySettings() {
      setIsHotkeysLoading(true);
      setHotkeyError("");
      setHotkeyStatus("");
      setHyprlandStatus("");

      try {
        const [bindings, platform] = await Promise.all([
          getHotkeyBindings(),
          getHotkeyPlatformInfo(),
        ]);

        if (canceled) {
          return;
        }

        const toggleBinding = bindings.find((binding) => binding.action === TOGGLE_OVERLAY_ACTION);
        if (toggleBinding) {
          setToggleHotkey(toggleBinding.accelerator);
        }

        setPlatformInfo(platform);
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

  const hotkeySupportHint = useMemo(() => {
    if (!tauriRuntime) {
      return "Open in Tauri desktop runtime to configure hotkeys.";
    }

    if (platformInfo.canAutoConfigureHyprland) {
      return "Hyprland detected. You can apply compositor bind directly from this panel.";
    }

    if (platformInfo.isWayland && !platformInfo.supportsNativeGlobalShortcuts) {
      return "Pure Wayland session detected. Native global shortcuts may not fire without compositor bind.";
    }

    return "Native global shortcut backend is available for this session.";
  }, [platformInfo, tauriRuntime]);

  const { data, isLoading } = useQuery({
    queryKey: ["milestone-status"],
    queryFn: getMilestoneStatus,
  });

  async function handleSaveHotkey() {
    if (!tauriRuntime) {
      setHotkeyError("Hotkey updates are available only in desktop runtime.");
      return;
    }

    const nextHotkey = toggleHotkey.trim();
    if (!nextHotkey) {
      setHotkeyError("Hotkey cannot be empty.");
      return;
    }

    setIsHotkeySaving(true);
    setHotkeyError("");
    setHotkeyStatus("");
    setHyprlandStatus("");

    try {
      await updateHotkeyBinding(TOGGLE_OVERLAY_ACTION, nextHotkey);
      setToggleHotkey(nextHotkey);
      setHotkeyStatus(`Hotkey saved: ${nextHotkey}`);
    } catch (error) {
      setHotkeyError(`Failed to save hotkey: ${toErrorMessage(error)}`);
    } finally {
      setIsHotkeySaving(false);
    }
  }

  async function handleApplyHyprlandBind() {
    if (!tauriRuntime) {
      setHotkeyError("Hyprland apply is available only in desktop runtime.");
      return;
    }

    const nextHotkey = toggleHotkey.trim();
    if (!nextHotkey) {
      setHotkeyError("Hotkey cannot be empty.");
      return;
    }

    setIsHyprlandApplying(true);
    setHotkeyError("");
    setHotkeyStatus("");
    setHyprlandStatus("");

    try {
      await updateHotkeyBinding(TOGGLE_OVERLAY_ACTION, nextHotkey);
      setToggleHotkey(nextHotkey);
      const result = await applyHyprlandHotkeyBinding(TOGGLE_OVERLAY_ACTION);
      setHotkeyStatus(`Hotkey saved: ${nextHotkey}`);
      setHyprlandStatus(
        `Applied to Hyprland: ${result.bindFilePath}. Source line: ${result.sourceLine}`,
      );
    } catch (error) {
      setHotkeyError(`Failed to apply Hyprland bind: ${toErrorMessage(error)}`);
    } finally {
      setIsHyprlandApplying(false);
    }
  }

  return (
    <main className="min-h-screen bg-background p-8 text-foreground">
      <section className="mx-auto flex w-full max-w-2xl flex-col gap-6 rounded-xl border bg-card p-6 shadow-sm">
        <header className="space-y-2">
          <p className="text-sm text-muted-foreground">overlay-core bootstrap</p>
          <h1 className="text-2xl font-semibold tracking-tight">Local-first AI overlay</h1>
        </header>

        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={toggleVisibility}>{isVisible ? "Hide overlay" : "Show overlay"}</Button>
          <span className="text-sm text-muted-foreground">
            Overlay state: <strong>{isVisible ? "visible" : "hidden"}</strong>
          </span>
        </div>

        <section className="rounded-lg border bg-muted/40 p-4 text-sm">
          <p className="font-medium">Hotkeys</p>
          <p className="mt-1 text-muted-foreground">{hotkeySupportHint}</p>

          <div className="mt-4 grid gap-2">
            <label
              htmlFor="toggle-overlay-hotkey"
              className="text-xs font-medium text-muted-foreground"
            >
              Toggle overlay visibility
            </label>
            <input
              id="toggle-overlay-hotkey"
              value={toggleHotkey}
              onChange={(event) => setToggleHotkey(event.target.value)}
              placeholder="Ctrl+Shift+Space"
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

            <Button
              variant="secondary"
              onClick={handleApplyHyprlandBind}
              disabled={!platformInfo.canAutoConfigureHyprland || isHyprlandApplying}
            >
              {isHyprlandApplying ? "Applying..." : "Apply to Hyprland"}
            </Button>
          </div>

          {hotkeyStatus ? (
            <p className="mt-3 text-xs text-muted-foreground">{hotkeyStatus}</p>
          ) : null}
          {hyprlandStatus ? (
            <p className="mt-2 text-xs text-muted-foreground">{hyprlandStatus}</p>
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
