import type { HotkeyAction } from "@/shared/config/hotkeys";

export const TOGGLE_OVERLAY_VISIBILITY_ACTION: HotkeyAction = "toggle_overlay_visibility";
export const TOGGLE_OVERLAY_INTERACTIVITY_ACTION: HotkeyAction = "toggle_overlay_interactivity";

export const DEFAULT_VISIBILITY_HOTKEY = "Ctrl+Shift+Space";
export const DEFAULT_INTERACTIVITY_HOTKEY = "Ctrl+Shift+Enter";

export type HotkeySettingItem = {
  action: HotkeyAction;
  title: string;
  description: string;
};

export const HOTKEY_SETTING_ITEMS: HotkeySettingItem[] = [
  {
    action: TOGGLE_OVERLAY_VISIBILITY_ACTION,
    title: "Toggle overlay visibility",
    description: "Show or hide the overlay window globally.",
  },
  {
    action: TOGGLE_OVERLAY_INTERACTIVITY_ACTION,
    title: "Toggle interaction mode",
    description: "Temporarily switch between click-through and interactive overlay modes.",
  },
];

export const HOTKEY_ACTION_LABELS: Record<HotkeyAction, string> = {
  [TOGGLE_OVERLAY_VISIBILITY_ACTION]: "Overlay visibility",
  [TOGGLE_OVERLAY_INTERACTIVITY_ACTION]: "Interaction mode",
};
