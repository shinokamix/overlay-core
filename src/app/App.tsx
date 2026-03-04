import { useRef } from "react";
import { HotkeySettingsPanel } from "@/features/hotkey-settings";
import { OverlayInteractionControls } from "@/features/overlay-interaction";
import { useOverlayWindowSizeSync } from "@/app/model/use-overlay-window-size-sync";
import { isTauriRuntime } from "@/shared/config/runtime";

export default function App() {
  const tauriRuntime = isTauriRuntime();
  const panelRef = useRef<HTMLElement | null>(null);

  useOverlayWindowSizeSync({ panelRef, tauriRuntime });

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

        <OverlayInteractionControls tauriRuntime={tauriRuntime} />
        <HotkeySettingsPanel tauriRuntime={tauriRuntime} />
      </section>
    </main>
  );
}
