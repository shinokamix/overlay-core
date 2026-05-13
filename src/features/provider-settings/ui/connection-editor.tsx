import { useMemo, useState } from "react";
import { findCatalogProvider, type ProviderCatalog } from "@/shared/lib/providers";
import { Button } from "@/shared/ui/button";
import { toErrorMessage } from "@/shared/lib/to-error-message";
import type { ProviderConnectionView } from "@/features/provider-settings/model/api";
import {
  addCustomModel,
  initialFormForCatalogProvider,
  initialFormForConnection,
  modelOptions,
  removeCustomModel,
  validateConnectionForm,
  type ConnectionFormMode,
  type ConnectionFormState,
} from "@/features/provider-settings/model/connection-form";
import { useProviderConnectionMutations } from "@/features/provider-settings/model/use-provider-connections";

type Props = {
  mode: ConnectionFormMode;
  catalog: ProviderCatalog;
  initialConnection?: ProviderConnectionView;
  onDone: (connection: ProviderConnectionView) => void;
  onCancel: () => void;
};

function defaultInitialState(
  mode: ConnectionFormMode,
  catalog: ProviderCatalog,
  initialConnection?: ProviderConnectionView,
): ConnectionFormState {
  if (mode === "edit" && initialConnection) {
    return initialFormForConnection(initialConnection);
  }
  const firstProvider = catalog.providers[0];
  if (!firstProvider) {
    return {
      providerId: "",
      displayName: "",
      baseUrl: "",
      defaultModel: "",
      customModels: [],
      apiKey: "",
      customModelDraft: "",
    };
  }
  return initialFormForCatalogProvider(firstProvider);
}

export function ConnectionEditor({ mode, catalog, initialConnection, onDone, onCancel }: Props) {
  const [state, setState] = useState<ConnectionFormState>(() =>
    defaultInitialState(mode, catalog, initialConnection),
  );
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const mutations = useProviderConnectionMutations();

  const provider = useMemo(
    () => findCatalogProvider(catalog, state.providerId),
    [catalog, state.providerId],
  );
  const options = useMemo(() => modelOptions(provider, state), [provider, state]);
  const apiKeyRequired = provider?.auth === "api_key";

  function applyProvider(providerId: string) {
    const nextProvider = findCatalogProvider(catalog, providerId);
    if (!nextProvider) {
      setState((current) => ({ ...current, providerId }));
      return;
    }
    setState(initialFormForCatalogProvider(nextProvider));
    setError("");
  }

  async function submit() {
    setError("");
    const validation = validateConnectionForm(
      state,
      mode,
      provider,
      initialConnection?.hasApiKey ?? false,
    );
    if (!validation.ok) {
      setError(validation.message);
      return;
    }

    setIsSubmitting(true);
    try {
      const apiKey = state.apiKey.trim();
      const payload = {
        displayName: state.displayName.trim(),
        baseUrl: state.baseUrl.trim(),
        defaultModel: state.defaultModel.trim(),
        customModels: state.customModels,
        apiKey: apiKey.length === 0 ? undefined : apiKey,
      };

      if (mode === "add") {
        const created = await mutations.add({
          providerId: state.providerId,
          ...payload,
        });
        onDone(created);
      } else if (initialConnection) {
        const updated = await mutations.update({
          id: initialConnection.id,
          ...payload,
        });
        onDone(updated);
      }
    } catch (submissionError) {
      setError(`Failed to save connection: ${toErrorMessage(submissionError)}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  function patch(partial: Partial<ConnectionFormState>) {
    setState((current) => ({ ...current, ...partial }));
  }

  function resetBaseUrl() {
    if (provider) {
      patch({ baseUrl: provider.defaultBaseUrl });
    }
  }

  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <header className="flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-medium">
          {mode === "add" ? "Add provider connection" : `Edit ${initialConnection?.displayName}`}
        </h3>
        <span className="text-xs text-muted-foreground">
          {provider?.protocol ? `Protocol: ${provider.protocol}` : null}
        </span>
      </header>

      <label className="grid gap-1.5">
        <span className="text-xs font-medium text-muted-foreground">Provider</span>
        <select
          value={state.providerId}
          onChange={(event) => applyProvider(event.target.value)}
          disabled={mode === "edit" || isSubmitting}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm shadow-sm disabled:opacity-60"
        >
          {catalog.providers.map((entry) => (
            <option key={entry.id} value={entry.id}>
              {entry.name}
            </option>
          ))}
        </select>
        {provider?.description ? (
          <span className="text-xs text-muted-foreground">{provider.description}</span>
        ) : null}
      </label>

      <label className="grid gap-1.5">
        <span className="text-xs font-medium text-muted-foreground">Display name</span>
        <input
          value={state.displayName}
          onChange={(event) => patch({ displayName: event.target.value })}
          disabled={isSubmitting}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm shadow-sm"
        />
      </label>

      <label className="grid gap-1.5">
        <span className="flex items-center justify-between text-xs font-medium text-muted-foreground">
          <span>Base URL</span>
          {provider && state.baseUrl !== provider.defaultBaseUrl ? (
            <button
              type="button"
              onClick={resetBaseUrl}
              disabled={isSubmitting}
              className="text-xs font-normal text-foreground/70 underline-offset-2 hover:underline"
            >
              Reset to default
            </button>
          ) : null}
        </span>
        <input
          value={state.baseUrl}
          onChange={(event) => patch({ baseUrl: event.target.value })}
          disabled={isSubmitting}
          placeholder="https://api.example.com/v1"
          className="h-10 rounded-md border border-input bg-background px-3 text-sm shadow-sm"
        />
      </label>

      <label className="grid gap-1.5">
        <span className="text-xs font-medium text-muted-foreground">Default model</span>
        <input
          list={`models-${state.providerId}`}
          value={state.defaultModel}
          onChange={(event) => patch({ defaultModel: event.target.value })}
          disabled={isSubmitting}
          placeholder="model-id"
          className="h-10 rounded-md border border-input bg-background px-3 text-sm shadow-sm"
        />
        <datalist id={`models-${state.providerId}`}>
          {options.map((model) => (
            <option key={model} value={model} />
          ))}
        </datalist>
      </label>

      <fieldset className="grid gap-2 rounded-md border border-border/70 p-3">
        <legend className="px-1 text-xs font-medium text-muted-foreground">Custom models</legend>
        {state.customModels.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Catalog models are always available. Add user-supplied model ids if your endpoint
            exposes models not in the catalog.
          </p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {state.customModels.map((model) => (
              <li
                key={model}
                className="flex items-center gap-1 rounded-full border border-border/70 bg-background px-2 py-0.5 text-xs"
              >
                <span>{model}</span>
                <button
                  type="button"
                  onClick={() => setState((current) => removeCustomModel(current, model))}
                  disabled={isSubmitting}
                  aria-label={`Remove ${model}`}
                  className="text-muted-foreground hover:text-destructive"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="flex items-center gap-2">
          <input
            value={state.customModelDraft}
            onChange={(event) => patch({ customModelDraft: event.target.value })}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                setState((current) => addCustomModel(current));
              }
            }}
            disabled={isSubmitting}
            placeholder="add-model-id"
            className="h-9 flex-1 rounded-md border border-input bg-background px-3 text-sm shadow-sm"
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setState((current) => addCustomModel(current))}
            disabled={isSubmitting || state.customModelDraft.trim().length === 0}
          >
            Add
          </Button>
        </div>
      </fieldset>

      <label className="grid gap-1.5">
        <span className="text-xs font-medium text-muted-foreground">
          API key {apiKeyRequired ? null : "(not required)"}
        </span>
        <input
          type="password"
          value={state.apiKey}
          onChange={(event) => patch({ apiKey: event.target.value })}
          disabled={isSubmitting}
          placeholder={
            initialConnection?.hasApiKey ? "Leave blank to keep the saved key" : "Provider token"
          }
          className="h-10 rounded-md border border-input bg-background px-3 text-sm shadow-sm"
        />
      </label>

      {error ? <p className="text-xs text-destructive">{error}</p> : null}

      <footer className="flex justify-end gap-2">
        <Button type="button" size="sm" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : mode === "add" ? "Add connection" : "Save changes"}
        </Button>
      </footer>
    </form>
  );
}
