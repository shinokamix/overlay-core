import { invoke } from "@tauri-apps/api/core";
import type { HotkeyAction, HotkeyBinding } from "@/shared/config/hotkeys";

export async function getHotkeyBindings(): Promise<HotkeyBinding[]> {
  return invoke<HotkeyBinding[]>("get_hotkey_bindings");
}

export async function updateHotkeyBinding(
  action: HotkeyAction,
  accelerator: string,
): Promise<void> {
  await invoke("update_hotkey_binding", { action, accelerator });
}
