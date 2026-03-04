import { useEffect, useMemo, useState } from "react";
import { getHotkeyBindings, updateHotkeyBinding } from "./api";
import {
  DEFAULT_INTERACTIVITY_HOTKEY,
  DEFAULT_VISIBILITY_HOTKEY,
  TOGGLE_OVERLAY_INTERACTIVITY_ACTION,
  TOGGLE_OVERLAY_VISIBILITY_ACTION,
} from "./constants";
import { toErrorMessage } from "@/shared/lib/to-error-message";

export function useHotkeySettings(tauriRuntime: boolean) {
  const [toggleVisibilityHotkey, setToggleVisibilityHotkey] = useState(DEFAULT_VISIBILITY_HOTKEY);
  const [toggleInteractivityHotkey, setToggleInteractivityHotkey] = useState(
    DEFAULT_INTERACTIVITY_HOTKEY,
  );
  const [hotkeyStatus, setHotkeyStatus] = useState("");
  const [hotkeyError, setHotkeyError] = useState("");
  const [isHotkeysLoading, setIsHotkeysLoading] = useState(false);
  const [isHotkeySaving, setIsHotkeySaving] = useState(false);

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

  const hotkeySupportHint = useMemo(() => {
    if (!tauriRuntime) {
      return "Open in Tauri desktop runtime to configure hotkeys.";
    }

    return "Overlay is click-through by default. Use the interaction hotkey to unlock UI controls temporarily.";
  }, [tauriRuntime]);

  async function saveHotkeys() {
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

  return {
    hotkeyError,
    hotkeyStatus,
    hotkeySupportHint,
    isHotkeySaving,
    isHotkeysLoading,
    saveHotkeys,
    setToggleInteractivityHotkey,
    setToggleVisibilityHotkey,
    toggleInteractivityHotkey,
    toggleVisibilityHotkey,
  };
}
