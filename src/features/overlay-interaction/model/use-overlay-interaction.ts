import { useEffect, useState } from "react";
import {
  getOverlayInteractionEnabled,
  onOverlayInteractionChanged,
  setOverlayInteractionEnabled,
  toggleOverlayInteractionEnabled,
} from "./api";
import { toErrorMessage } from "@/shared/lib/to-error-message";

export function useOverlayInteraction(tauriRuntime: boolean) {
  const [interactionEnabled, setInteractionEnabled] = useState(false);
  const [isInteractionLoading, setIsInteractionLoading] = useState(false);
  const [interactionError, setInteractionError] = useState("");

  useEffect(() => {
    if (!tauriRuntime) {
      return;
    }

    let canceled = false;
    let unlisten: (() => void) | null = null;

    async function bindInteractionState() {
      setIsInteractionLoading(true);
      setInteractionError("");

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
          setInteractionError(`Failed to sync overlay interaction state: ${toErrorMessage(error)}`);
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

  async function toggleInteraction() {
    if (!tauriRuntime) {
      return;
    }

    try {
      setIsInteractionLoading(true);
      setInteractionError("");
      const enabled = await toggleOverlayInteractionEnabled();
      setInteractionEnabled(enabled);
    } catch (error) {
      setInteractionError(`Failed to toggle interaction mode: ${toErrorMessage(error)}`);
    } finally {
      setIsInteractionLoading(false);
    }
  }

  return {
    interactionEnabled,
    interactionError,
    isInteractionLoading,
    toggleInteraction,
  };
}
