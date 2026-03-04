import { useHotkeySettings } from "@/features/hotkey-settings/model";
import { Button } from "@/shared/ui/button";

type Props = {
  tauriRuntime: boolean;
};

export function HotkeySettingsPanel({ tauriRuntime }: Props) {
  const {
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
  } = useHotkeySettings(tauriRuntime);

  return (
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
          onClick={saveHotkeys}
          disabled={!tauriRuntime || isHotkeysLoading || isHotkeySaving}
        >
          {isHotkeySaving ? "Saving..." : "Save hotkey"}
        </Button>
      </div>

      {hotkeyStatus ? <p className="mt-3 text-xs text-muted-foreground">{hotkeyStatus}</p> : null}
      {hotkeyError ? <p className="mt-2 text-xs text-destructive">{hotkeyError}</p> : null}
    </section>
  );
}
