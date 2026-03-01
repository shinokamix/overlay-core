import { invoke } from "@tauri-apps/api/core";
import type {
  HotkeyAction,
  HotkeyBinding,
  HotkeyPlatformInfo,
  HyprlandHotkeyApplyResult,
} from "@/shared/config/hotkeys";

export async function getHotkeyBindings(): Promise<HotkeyBinding[]> {
  return invoke<HotkeyBinding[]>("get_hotkey_bindings");
}

export async function updateHotkeyBinding(
  action: HotkeyAction,
  accelerator: string,
): Promise<void> {
  await invoke("update_hotkey_binding", { action, accelerator });
}

export async function getHotkeyPlatformInfo(): Promise<HotkeyPlatformInfo> {
  return invoke<HotkeyPlatformInfo>("get_hotkey_platform_info");
}

export async function applyHyprlandHotkeyBinding(
  action: HotkeyAction,
): Promise<HyprlandHotkeyApplyResult> {
  return invoke<HyprlandHotkeyApplyResult>("apply_hyprland_hotkey_binding", { action });
}
