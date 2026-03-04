import { useEffect, type RefObject } from "react";
import { logger } from "@/shared/lib/logger";
import { toErrorMessage } from "@/shared/lib/to-error-message";

type Params = {
  panelRef: RefObject<HTMLElement | null>;
  tauriRuntime: boolean;
};

export function useOverlayWindowSizeSync({ panelRef, tauriRuntime }: Params) {
  useEffect(() => {
    if (!tauriRuntime || !panelRef.current) {
      return;
    }

    let disposed = false;
    let observer: ResizeObserver | null = null;

    async function bindWindowSizeSync() {
      try {
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
            logger.error("Failed to resize overlay window", { error: toErrorMessage(error) });
          }
        };

        observer = new ResizeObserver(() => {
          void applySize();
        });
        observer.observe(panelRef.current);

        void applySize();
      } catch (error) {
        if (!disposed) {
          logger.error("Failed to bind overlay window size sync", {
            error: toErrorMessage(error),
          });
        }
      }
    }

    void bindWindowSizeSync();

    return () => {
      disposed = true;
      if (observer) {
        observer.disconnect();
      }
    };
  }, [panelRef, tauriRuntime]);
}
