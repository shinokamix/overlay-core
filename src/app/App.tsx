import { useRef } from "react";
import { ChatShell } from "@/features/chat-shell";
import { HotkeySettingsPanel } from "@/features/hotkey-settings";
import { OverlayHeader } from "@/features/overlay-header";
import { ProviderSettingsPanel } from "@/features/provider-settings";
import { SettingsModal } from "@/features/settings-modal";
import { useOverlayShellState } from "@/app/model/use-overlay-shell-state";
import { useOverlayWindowSizeSync } from "@/app/model/use-overlay-window-size-sync";
import { isTauriRuntime } from "@/shared/config/runtime";

export default function App() {
  const tauriRuntime = isTauriRuntime();
  const panelRef = useRef<HTMLElement | null>(null);
  const { closeSettings, isSettingsOpen, openSettings } = useOverlayShellState();

  useOverlayWindowSizeSync({ panelRef, tauriRuntime });

  return (
    <main className="p-3 text-foreground opacity-75">
      <section
        ref={panelRef}
        className="relative mx-auto flex w-full max-w-3xl flex-col gap-4 overflow-hidden rounded-2xl border border-border/80 bg-card/95 p-4 shadow-2xl backdrop-blur"
      >
        <OverlayHeader tauriRuntime={tauriRuntime} onOpenSettings={openSettings} />
        <ChatShell tauriRuntime={tauriRuntime} />

        <SettingsModal
          open={isSettingsOpen}
          onClose={closeSettings}
          sectionContent={{
            hotkeys: <HotkeySettingsPanel tauriRuntime={tauriRuntime} />,
            providers: <ProviderSettingsPanel tauriRuntime={tauriRuntime} />,
          }}
        />
      </section>
    </main>
  );
}
