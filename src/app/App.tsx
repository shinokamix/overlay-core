import { useQuery } from "@tanstack/react-query";
import { Button } from "@/shared/ui/button";
import { useOverlayStore } from "@/app/model/overlay-store";

async function getMilestoneStatus() {
  return {
    name: "hotkey -> screenshot -> attach -> ask -> answer",
    status: "in-progress",
  };
}

export default function App() {
  const isVisible = useOverlayStore((state) => state.isVisible);
  const toggleVisibility = useOverlayStore((state) => state.toggleVisibility);

  const { data, isLoading } = useQuery({
    queryKey: ["milestone-status"],
    queryFn: getMilestoneStatus,
  });

  return (
    <main className="min-h-screen bg-background p-8 text-foreground">
      <section className="mx-auto flex w-full max-w-2xl flex-col gap-6 rounded-xl border bg-card p-6 shadow-sm">
        <header className="space-y-2">
          <p className="text-sm text-muted-foreground">overlay-core bootstrap</p>
          <h1 className="text-2xl font-semibold tracking-tight">Local-first AI overlay</h1>
        </header>

        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={toggleVisibility}>{isVisible ? "Hide overlay" : "Show overlay"}</Button>
          <span className="text-sm text-muted-foreground">
            Overlay state: <strong>{isVisible ? "visible" : "hidden"}</strong>
          </span>
        </div>

        <div className="rounded-lg border bg-muted/40 p-4 text-sm">
          <p className="font-medium">Current milestone</p>
          {isLoading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : (
            <p className="text-muted-foreground">
              {data?.name} ({data?.status})
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
