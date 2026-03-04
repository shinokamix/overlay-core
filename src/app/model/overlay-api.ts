import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

const OVERLAY_INTERACTION_CHANGED_EVENT = "overlay://interaction-changed";

export async function getOverlayInteractionEnabled(): Promise<boolean> {
  return invoke<boolean>("get_overlay_interaction_enabled");
}

export async function setOverlayInteractionEnabled(enabled: boolean): Promise<boolean> {
  return invoke<boolean>("set_overlay_interaction_enabled_command", { enabled });
}

export async function toggleOverlayInteractionEnabled(): Promise<boolean> {
  return invoke<boolean>("toggle_overlay_interaction_enabled_command");
}

export async function onOverlayInteractionChanged(
  callback: (enabled: boolean) => void,
): Promise<() => void> {
  const unlisten = await listen<boolean>(OVERLAY_INTERACTION_CHANGED_EVENT, (event) => {
    callback(Boolean(event.payload));
  });

  return unlisten;
}
