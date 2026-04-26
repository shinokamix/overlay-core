import {
  getProviderPreset,
  PROVIDER_PRESETS,
  useProviderSettings,
} from "@/features/provider-settings/model";
import { Button } from "@/shared/ui/button";

type Props = {
  tauriRuntime: boolean;
};

export function ProviderSettingsPanel({ tauriRuntime }: Props) {
  const {
    applyPreset,
    error,
    form,
    isLoading,
    isRemovingCredentials,
    isSaving,
    removeCredentials,
    save,
    savedSettings,
    setForm,
    status,
  } = useProviderSettings(tauriRuntime);
  const selectedPreset = getProviderPreset(form.providerId);
  const controlsDisabled = !tauriRuntime || isLoading || isSaving || isRemovingCredentials;

  return (
    <section className="rounded-lg border bg-muted/40 p-4 text-sm">
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="font-medium">Providers</h2>
          <p className="mt-1 text-muted-foreground">
            Configure an OpenAI-compatible provider for chat requests. API keys are stored in the OS
            credential store and are not returned to the UI.
          </p>
        </div>

        <span className="w-fit rounded-full border border-border/70 bg-background/80 px-3 py-1 text-xs text-muted-foreground">
          {savedSettings?.hasApiKey ? "Connected" : "No API key saved"}
        </span>
      </div>

      {!tauriRuntime ? (
        <p className="mt-4 rounded-md border border-border/70 bg-background/80 p-3 text-xs text-muted-foreground">
          Open in Tauri desktop runtime to save provider credentials and send real chat requests.
        </p>
      ) : null}

      <div className="mt-4 grid gap-4">
        <label className="grid gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Provider preset</span>
          <select
            value={form.providerId}
            onChange={(event) => applyPreset(event.target.value)}
            disabled={controlsDisabled}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm shadow-sm"
          >
            {PROVIDER_PRESETS.map((preset) => (
              <option key={preset.providerId} value={preset.providerId}>
                {preset.providerName}
              </option>
            ))}
          </select>
          <span className="text-xs text-muted-foreground">{selectedPreset.description}</span>
        </label>

        {form.providerId === "custom" ? (
          <label className="grid gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Provider name</span>
            <input
              value={form.providerName}
              onChange={(event) =>
                setForm((current) => ({ ...current, providerName: event.target.value }))
              }
              disabled={controlsDisabled}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm shadow-sm"
            />
          </label>
        ) : null}

        <label className="grid gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Base URL</span>
          <input
            value={form.baseUrl}
            onChange={(event) =>
              setForm((current) => ({ ...current, baseUrl: event.target.value }))
            }
            disabled={controlsDisabled}
            placeholder="https://api.example.com/v1"
            className="h-10 rounded-md border border-input bg-background px-3 text-sm shadow-sm"
          />
        </label>

        <label className="grid gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Model</span>
          <input
            value={form.model}
            onChange={(event) => setForm((current) => ({ ...current, model: event.target.value }))}
            disabled={controlsDisabled}
            placeholder="model-id"
            className="h-10 rounded-md border border-input bg-background px-3 text-sm shadow-sm"
          />
        </label>

        <label className="grid gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">
            {selectedPreset.apiKeyLabel}
          </span>
          <input
            type="password"
            value={form.apiKey}
            onChange={(event) => setForm((current) => ({ ...current, apiKey: event.target.value }))}
            disabled={controlsDisabled}
            placeholder={
              savedSettings?.hasApiKey
                ? "Leave blank to keep the saved key"
                : selectedPreset.apiKeyPlaceholder
            }
            className="h-10 rounded-md border border-input bg-background px-3 text-sm shadow-sm"
          />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" onClick={() => void save()} disabled={controlsDisabled}>
          {isSaving ? "Saving..." : "Save provider"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => void removeCredentials()}
          disabled={controlsDisabled || !savedSettings?.hasApiKey}
        >
          {isRemovingCredentials ? "Removing..." : "Remove API key"}
        </Button>
      </div>

      {isLoading ? (
        <p className="mt-3 text-xs text-muted-foreground">Loading providers...</p>
      ) : null}
      {status ? <p className="mt-3 text-xs text-muted-foreground">{status}</p> : null}
      {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}
    </section>
  );
}
