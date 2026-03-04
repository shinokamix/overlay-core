import { useOverlayInteraction } from "@/features/overlay-interaction/model";
import { Button } from "@/shared/ui/button";

type Props = {
  tauriRuntime: boolean;
};

export function OverlayInteractionControls({ tauriRuntime }: Props) {
  const { interactionEnabled, interactionError, isInteractionLoading, toggleInteraction } =
    useOverlayInteraction(tauriRuntime);

  return (
    <section>
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={toggleInteraction} disabled={!tauriRuntime || isInteractionLoading}>
          {interactionEnabled ? "Lock interaction" : "Unlock interaction"}
        </Button>
        <span className="text-sm text-muted-foreground">
          Interaction mode: <strong>{interactionEnabled ? "interactive" : "passive"}</strong>
        </span>
        <span className="text-sm text-muted-foreground">Esc locks interaction</span>
      </div>

      {interactionError ? (
        <p className="mt-2 text-xs text-destructive">{interactionError}</p>
      ) : null}
    </section>
  );
}
