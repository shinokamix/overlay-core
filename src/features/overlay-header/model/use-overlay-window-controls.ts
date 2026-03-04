import { useState } from "react";
import { logger } from "@/shared/lib/logger";
import { toErrorMessage } from "@/shared/lib/to-error-message";

export function useOverlayWindowControls(tauriRuntime: boolean) {
  const [isClosePending, setIsClosePending] = useState(false);

  async function closeOverlay() {
    if (!tauriRuntime || isClosePending) {
      return;
    }

    setIsClosePending(true);

    try {
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      await getCurrentWindow().close();
    } catch (error) {
      logger.error("Failed to close overlay window", {
        error: toErrorMessage(error),
      });
    } finally {
      setIsClosePending(false);
    }
  }

  return {
    closeOverlay,
    isClosePending,
  };
}
