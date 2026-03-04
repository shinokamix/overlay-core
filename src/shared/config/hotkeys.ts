export const hotkeyActions = ["toggle_overlay_visibility", "toggle_overlay_interactivity"] as const;

export type HotkeyAction = (typeof hotkeyActions)[number];

export type HotkeyBinding = {
  action: HotkeyAction;
  accelerator: string;
};
