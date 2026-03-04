import { useCallback, useState } from "react";

export function useOverlayShellState() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const openSettings = useCallback(() => {
    setIsSettingsOpen(true);
  }, []);

  const closeSettings = useCallback(() => {
    setIsSettingsOpen(false);
  }, []);

  return {
    closeSettings,
    isSettingsOpen,
    openSettings,
  };
}
