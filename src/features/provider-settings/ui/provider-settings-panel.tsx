import { useMemo, useState } from "react";
import {
  useActiveProvider,
  useProviderCatalog,
  type ProviderCatalogEntry,
} from "@/shared/lib/providers";
import { Button } from "@/shared/ui/button";
import { toErrorMessage } from "@/shared/lib/to-error-message";
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
      <section className="rounded-lg border bg-muted/40 p-4 text-sm">
        <h2 className="font-medium">Providers</h2>
        <p className="mt-2 text-muted-foreground">
          Open in Tauri desktop runtime to manage provider connections.
        </p>
      </section>
    );
  }

  if (catalogQuery.isLoading || connectionsQuery.isLoading) {
    return (
      <section className="rounded-lg border bg-muted/40 p-4 text-sm">
        <h2 className="font-medium">Providers</h2>
        <p className="mt-2 text-muted-foreground">Loading providers...</p>
      </section>
    );
  }

  if (catalogQuery.error || connectionsQuery.error) {
    return (
      <section className="rounded-lg border bg-muted/40 p-4 text-sm">
        <h2 className="font-medium">Providers</h2>
        <p className="mt-2 text-destructive">
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
      <section className="rounded-lg border bg-muted/40 p-4 text-sm">
        <ConnectionEditor
          mode="add"
          catalog={catalog}
          onDone={(created) => {
            setStatus(`${created.displayName} added.`);
            setView({ mode: "list" });
          }}
          onCancel={() => setView({ mode: "list" })}
        />
      </section>
    );
  }

  if (view.mode === "edit") {
    return (
      <section className="rounded-lg border bg-muted/40 p-4 text-sm">
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
      </section>
    );
  }

  return (
    <section className="rounded-lg border bg-muted/40 p-4 text-sm">
      <header className="flex items-start justify-between gap-2">
        <div>
          <h2 className="font-medium">Providers</h2>
          <p className="mt-1 text-muted-foreground">
            Add provider connections and pick which one the chat uses. API keys are stored in the OS
            credential store and never returned to the UI.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          onClick={() => {
            clearMessages();
            setView({ mode: "add" });
          }}
        >
          Add provider
        </Button>
      </header>

      {connections.length === 0 ? (
        <p className="mt-4 rounded-md border border-border/70 bg-background/80 p-3 text-xs text-muted-foreground">
          No provider connections yet. Add one to enable the chat composer.
        </p>
      ) : (
        <ul className="mt-4 grid gap-2">
          {connections.map((connection) => {
            const isActive = active?.connectionId === connection.id;
            const isBusy = pendingId === connection.id;
            return (
              <li
                key={connection.id}
                className="flex flex-col gap-2 rounded-md border border-border/70 bg-background/80 p-3 md:flex-row md:items-center md:justify-between"
              >
                <div className="grid gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{connection.displayName}</span>
                    <span className="rounded-full border border-border/70 px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                      {providerLabel(catalog, connection.providerId)}
                    </span>
                    {isActive ? (
                      <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] uppercase tracking-wider text-primary-foreground">
                        Active
                      </span>
                    ) : null}
                    {!connection.hasApiKey ? (
                      <span className="rounded-full border border-destructive/60 px-2 py-0.5 text-[10px] uppercase tracking-wider text-destructive">
                        No API key
                      </span>
                    ) : null}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Model:{" "}
                    <span className="font-mono text-foreground/80">{connection.defaultModel}</span>
                  </div>
                  <div className="break-all text-[11px] text-muted-foreground">
                    {connection.baseUrl}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1">
                  {!isActive ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => void makeActive(connection)}
                      disabled={isBusy}
                    >
                      {isBusy ? "Switching..." : "Use this"}
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
                    variant="ghost"
                    onClick={() => void remove(connection)}
                    disabled={isBusy}
                  >
                    {isBusy ? "..." : "Remove"}
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {status ? <p className="mt-3 text-xs text-muted-foreground">{status}</p> : null}
      {actionError ? <p className="mt-2 text-xs text-destructive">{actionError}</p> : null}
    </section>
  );
}
