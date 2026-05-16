import { useMemo, useState } from "react";
import { Plus } from "lucide-react";

const PROVIDER_COLORS: Record<string, string> = {
  openai: "bg-emerald-500",
  anthropic: "bg-amber-500",
  gemini: "bg-blue-500",
};
import {
  useActiveProvider,
  useProviderCatalog,
  type ProviderCatalogEntry,
} from "@/shared/lib/providers";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { PanelHeader } from "@/shared/ui/panel-header";
import { toErrorMessage } from "@/shared/lib/to-error-message";
import { cn } from "@/shared/lib/utils";
import type { ProviderConnectionView } from "@/features/provider-settings/model/api";
import {
  useProviderConnectionMutations,
  useProviderConnections,
} from "@/features/provider-settings/model/use-provider-connections";
import { ConnectionEditor } from "./connection-editor";

type Props = {
  tauriRuntime: boolean;
};

type View =
  | { mode: "list" }
  | { mode: "add" }
  | { mode: "edit"; connection: ProviderConnectionView };

function providerLabel(
  catalog: { providers: ProviderCatalogEntry[] } | undefined,
  providerId: string,
): string {
  const entry = catalog?.providers.find((provider) => provider.id === providerId);
  return entry?.name ?? providerId;
}

function MessageRow({ status, error }: { status?: string; error?: string }) {
  if (!status && !error) {
    return null;
  }
  return (
    <div className="flex flex-col gap-1 text-[11px]">
      {status ? <p className="text-muted-foreground">{status}</p> : null}
      {error ? <p className="text-rose-400">{error}</p> : null}
    </div>
  );
}

export function ProviderSettingsPanel({ tauriRuntime }: Props) {
  const [view, setView] = useState<View>({ mode: "list" });
  const [actionError, setActionError] = useState("");
  const [status, setStatus] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);

  const catalogQuery = useProviderCatalog(tauriRuntime);
  const connectionsQuery = useProviderConnections(tauriRuntime);
  const activeQuery = useActiveProvider(tauriRuntime);
  const mutations = useProviderConnectionMutations();

  const catalog = catalogQuery.data;
  const connections = useMemo(() => connectionsQuery.data ?? [], [connectionsQuery.data]);
  const active = activeQuery.data ?? null;

  function clearMessages() {
    setActionError("");
    setStatus("");
  }

  async function makeActive(connection: ProviderConnectionView) {
    clearMessages();
    setPendingId(connection.id);
    try {
      await mutations.setActive(connection.id, connection.defaultModel);
      setStatus(`Active: ${connection.displayName} · ${connection.defaultModel}`);
    } catch (error) {
      setActionError(`Failed to switch active provider: ${toErrorMessage(error)}`);
    } finally {
      setPendingId(null);
    }
  }

  async function remove(connection: ProviderConnectionView) {
    clearMessages();
    setPendingId(connection.id);
    try {
      await mutations.remove(connection.id);
      setStatus(`${connection.displayName} removed.`);
    } catch (error) {
      setActionError(`Failed to remove connection: ${toErrorMessage(error)}`);
    } finally {
      setPendingId(null);
    }
  }

  if (!tauriRuntime) {
    return (
      <section className="flex flex-col gap-3">
        <PanelHeader
          eyebrow="Providers"
          title="Providers"
          description="Open in Tauri desktop runtime to manage provider connections."
        />
      </section>
    );
  }

  if (catalogQuery.isLoading || connectionsQuery.isLoading) {
    return (
      <section className="flex flex-col gap-3">
        <PanelHeader eyebrow="Providers" title="Providers" description="Loading providers..." />
      </section>
    );
  }

  if (catalogQuery.error || connectionsQuery.error) {
    return (
      <section className="flex flex-col gap-3">
        <PanelHeader eyebrow="Providers" title="Providers" />
        <p className="rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-400">
          Failed to load providers: {toErrorMessage(catalogQuery.error ?? connectionsQuery.error)}
        </p>
      </section>
    );
  }

  if (!catalog) {
    return null;
  }

  if (view.mode === "add") {
    return (
      <ConnectionEditor
        mode="add"
        catalog={catalog}
        onDone={(created) => {
          setStatus(`${created.displayName} added.`);
          setView({ mode: "list" });
        }}
        onCancel={() => setView({ mode: "list" })}
      />
    );
  }

  if (view.mode === "edit") {
    return (
      <ConnectionEditor
        mode="edit"
        catalog={catalog}
        initialConnection={view.connection}
        onDone={(updated) => {
          setStatus(`${updated.displayName} updated.`);
          setView({ mode: "list" });
        }}
        onCancel={() => setView({ mode: "list" })}
      />
    );
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <PanelHeader
          eyebrow="Providers"
          title="Connections"
          description="Add provider connections and pick which one the chat uses. API keys are stored in the OS credential store and never returned to the UI."
        />
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={() => {
            clearMessages();
            setView({ mode: "add" });
          }}
        >
          <Plus /> Add provider
        </Button>
      </div>

      {connections.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-surface-1 px-4 py-6 text-center text-xs text-muted-foreground">
          No provider connections yet. Add one to enable the chat composer.
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {connections.map((connection) => {
            const isActive = active?.connectionId === connection.id;
            const isBusy = pendingId === connection.id;
            return (
              <li
                key={connection.id}
                className={cn(
                  "rounded-lg border border-border bg-surface-1 px-3 py-3 transition-colors",
                  isActive && "border-l-2 border-l-indigo-500",
                )}
              >
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div className="grid min-w-0 gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "mt-0.5 size-2 shrink-0 rounded-full",
                          PROVIDER_COLORS[connection.providerId] ?? "bg-neutral-500",
                        )}
                      />
                      <span className="text-sm font-medium text-foreground">
                        {connection.displayName}
                      </span>
                      <Badge tone="neutral">{providerLabel(catalog, connection.providerId)}</Badge>
                      {isActive ? (
                        <Badge tone="indigo" withDot>
                          Active
                        </Badge>
                      ) : null}
                      {!connection.hasApiKey ? (
                        <Badge tone="rose" withDot>
                          No API key
                        </Badge>
                      ) : null}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      Model:{" "}
                      <span className="font-mono text-foreground/80">
                        {connection.defaultModel}
                      </span>
                    </div>
                    <div className="break-all font-mono text-[10px] text-[color:var(--text-muted-strong)]">
                      {connection.baseUrl}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {!isActive ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => void makeActive(connection)}
                        disabled={isBusy}
                      >
                        {isBusy ? "Setting…" : "Set as default"}
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        clearMessages();
                        setView({ mode: "edit", connection });
                      }}
                      disabled={isBusy}
                    >
                      Edit
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="danger"
                      onClick={() => void remove(connection)}
                      disabled={isBusy}
                    >
                      {isBusy ? "..." : "Remove"}
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <MessageRow status={status} error={actionError} />
    </section>
  );
}
