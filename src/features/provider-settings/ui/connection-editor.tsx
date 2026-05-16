import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { findCatalogProvider, type ProviderCatalog } from "@/shared/lib/providers";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { PanelHeader } from "@/shared/ui/panel-header";
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

const fieldLabelClass =
  "text-[10px] font-semibold uppercase tracking-[0.12em] text-[color:var(--text-muted-strong)]";
const sectionLabelClass =
  "text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground";
const inputClass =
  "h-9 rounded-md border border-[color:var(--input)] bg-surface-1 px-3 text-xs text-foreground placeholder:text-[color:var(--text-muted-strong)] outline-none transition-colors focus:border-indigo-500/50 disabled:cursor-not-allowed disabled:opacity-60";

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
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <PanelHeader
          as="h3"
          eyebrow={mode === "add" ? "New connection" : "Edit connection"}
          title={
            mode === "add" ? "Add provider connection" : (initialConnection?.displayName ?? "")
          }
        />
        {provider?.protocol ? (
          <Badge tone="indigo" className="font-mono">
            {provider.protocol}
          </Badge>
        ) : null}
      </div>

      <div className="grid gap-5">
        {/* Connection */}
        <div className="grid gap-3">
          <p className={sectionLabelClass}>Connection</p>

          <label className="grid gap-1.5">
            <span className={fieldLabelClass}>Provider</span>
            <select
              value={state.providerId}
              onChange={(event) => applyProvider(event.target.value)}
              disabled={mode === "edit" || isSubmitting}
              className={inputClass}
            >
              {catalog.providers.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.name}
                </option>
              ))}
            </select>
            {provider?.description ? (
              <span className="text-[11px] text-muted-foreground">{provider.description}</span>
            ) : null}
          </label>

          <label className="grid gap-1.5">
            <span className={fieldLabelClass}>Display name</span>
            <input
              value={state.displayName}
              onChange={(event) => patch({ displayName: event.target.value })}
              disabled={isSubmitting}
              className={inputClass}
            />
          </label>
        </div>

        <div className="h-px bg-border" />

        {/* Endpoint */}
        <div className="grid gap-3">
          <p className={sectionLabelClass}>Endpoint</p>

          <label className="grid gap-1.5">
            <span className={`flex items-center justify-between ${fieldLabelClass}`}>
              <span>Base URL</span>
              {provider && state.baseUrl !== provider.defaultBaseUrl ? (
                <button
                  type="button"
                  onClick={resetBaseUrl}
                  disabled={isSubmitting}
                  className="text-[10px] font-normal normal-case tracking-normal text-indigo-200 underline-offset-2 hover:underline"
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
              className={`${inputClass} font-mono`}
            />
          </label>

          <label className="grid gap-1.5">
            <span className={fieldLabelClass}>Default model</span>
            <input
              list={`models-${state.providerId}`}
              value={state.defaultModel}
              onChange={(event) => patch({ defaultModel: event.target.value })}
              disabled={isSubmitting}
              placeholder="model-id"
              className={`${inputClass} font-mono`}
            />
            <datalist id={`models-${state.providerId}`}>
              {options.map((model) => (
                <option key={model} value={model} />
              ))}
            </datalist>
          </label>

          <fieldset className="grid gap-2 rounded-md border border-border bg-surface-1 p-3">
            <legend className={`${fieldLabelClass} px-1`}>Custom models</legend>
            {state.customModels.length === 0 ? (
              <p className="text-[11px] text-muted-foreground">
                Catalog models are always available. Add user-supplied model IDs if your endpoint
                exposes models not in the catalog.
              </p>
            ) : (
              <ul className="flex flex-wrap gap-1.5">
                {state.customModels.map((model) => (
                  <li
                    key={model}
                    className="flex items-center gap-1 rounded-full border border-[color:var(--input)] bg-surface-2 px-2 py-0.5 font-mono text-[10px] text-foreground"
                  >
                    <span>{model}</span>
                    <button
                      type="button"
                      onClick={() => setState((current) => removeCustomModel(current, model))}
                      disabled={isSubmitting}
                      aria-label={`Remove ${model}`}
                      className="ml-1 flex items-center text-muted-foreground transition-colors hover:text-rose-400"
                    >
                      <X className="size-3" />
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
                className={`${inputClass} font-mono`}
              />
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => setState((current) => addCustomModel(current))}
                disabled={isSubmitting || state.customModelDraft.trim().length === 0}
              >
                Add
              </Button>
            </div>
          </fieldset>
        </div>

        <div className="h-px bg-border" />

        {/* Security */}
        <div className="grid gap-3">
          <p className={sectionLabelClass}>Security</p>

          <label className="grid gap-1.5">
            <span className={fieldLabelClass}>
              API key {apiKeyRequired ? null : <span className="normal-case">(not required)</span>}
            </span>
            <input
              type="password"
              value={state.apiKey}
              onChange={(event) => patch({ apiKey: event.target.value })}
              disabled={isSubmitting}
              placeholder={
                initialConnection?.hasApiKey
                  ? "Leave blank to keep the saved key"
                  : "Provider token"
              }
              className={inputClass}
            />
          </label>
        </div>
      </div>

      {error ? (
        <p className="rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-[11px] text-rose-400">
          {error}
        </p>
      ) : null}

      <footer className="flex items-center justify-end gap-2 pt-1">
        <Button type="button" size="sm" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" size="sm" variant="primary" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : mode === "add" ? "Add connection" : "Save changes"}
        </Button>
      </footer>
    </form>
  );
}
