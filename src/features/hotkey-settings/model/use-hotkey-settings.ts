import { useCallback, useEffect, useMemo, useState } from "react";
import type { HotkeyAction } from "@/shared/config/hotkeys";
import { getHotkeyBindings, updateHotkeyBinding } from "./api";
import {
  HOTKEY_ACTION_LABELS,
  HOTKEY_SETTING_ITEMS,
  type HotkeySettingItem,
  DEFAULT_INTERACTIVITY_HOTKEY,
  DEFAULT_VISIBILITY_HOTKEY,
  TOGGLE_OVERLAY_INTERACTIVITY_ACTION,
  TOGGLE_OVERLAY_VISIBILITY_ACTION,
} from "./constants";
import { toErrorMessage } from "@/shared/lib/to-error-message";

type HotkeyBindingsMap = Record<HotkeyAction, string>;

function getDefaultHotkeyBindings(): HotkeyBindingsMap {
  return {
    [TOGGLE_OVERLAY_VISIBILITY_ACTION]: DEFAULT_VISIBILITY_HOTKEY,
    [TOGGLE_OVERLAY_INTERACTIVITY_ACTION]: DEFAULT_INTERACTIVITY_HOTKEY,
  } as HotkeyBindingsMap;
}

type HotkeySettingRow = HotkeySettingItem & {
  accelerator: string;
};

export function useHotkeySettings(tauriRuntime: boolean) {
  const [hotkeyBindings, setHotkeyBindings] = useState<HotkeyBindingsMap>(getDefaultHotkeyBindings);
  const [hotkeyStatus, setHotkeyStatus] = useState("");
  const [hotkeyError, setHotkeyError] = useState("");
  const [isHotkeysLoading, setIsHotkeysLoading] = useState(false);
  const [savingAction, setSavingAction] = useState<HotkeyAction | null>(null);

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

        const nextBindings = getDefaultHotkeyBindings();
        for (const binding of bindings) {
          nextBindings[binding.action] = binding.accelerator.trim();
        }

        setHotkeyBindings(nextBindings);
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

    return "Use Change to capture any key or key combination and Clear to disable it. Overlay is click-through by default; use the interaction hotkey to unlock controls temporarily.";
  }, [tauriRuntime]);

  const isHotkeySaving = savingAction !== null;

  const hotkeyRows = useMemo<HotkeySettingRow[]>(() => {
    return HOTKEY_SETTING_ITEMS.map((item) => ({
      ...item,
      accelerator: hotkeyBindings[item.action],
    }));
  }, [hotkeyBindings]);

  const updateHotkey = useCallback(
    async (action: HotkeyAction, accelerator: string) => {
      if (!tauriRuntime) {
        setHotkeyError("Hotkey updates are available only in desktop runtime.");
        return;
      }

      const nextAccelerator = accelerator.trim();
      const actionLabel = HOTKEY_ACTION_LABELS[action];

      setSavingAction(action);
      setHotkeyError("");
      setHotkeyStatus("");

      try {
        await updateHotkeyBinding(action, nextAccelerator);
        setHotkeyBindings((currentBindings) => ({
          ...currentBindings,
          [action]: nextAccelerator,
        }));

        if (nextAccelerator) {
          setHotkeyStatus(`${actionLabel} hotkey set to ${nextAccelerator}.`);
        } else {
          setHotkeyStatus(`${actionLabel} hotkey disabled.`);
        }
      } catch (error) {
        setHotkeyError(
          `Failed to update ${actionLabel.toLowerCase()} hotkey: ${toErrorMessage(error)}`,
        );
      } finally {
        setSavingAction(null);
      }
    },
    [tauriRuntime],
  );

  return {
    hotkeyRows,
    hotkeyError,
    hotkeyStatus,
    hotkeySupportHint,
    isHotkeySaving,
    isHotkeysLoading,
    savingAction,
    updateHotkey,
  };
}
