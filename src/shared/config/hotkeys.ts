export const hotkeyActions = ["toggle_overlay_visibility"] as const;

export type HotkeyAction = (typeof hotkeyActions)[number];

export type HotkeyBinding = {
  action: HotkeyAction;
  accelerator: string;
};

export type HotkeyPlatformInfo = {
  isLinux: boolean;
  isWayland: boolean;
  isHyprland: boolean;
  supportsNativeGlobalShortcuts: boolean;
  canAutoConfigureHyprland: boolean;
};

export type HyprlandHotkeyApplyResult = {
  bindFilePath: string;
  mainConfigPath: string;
  sourceLine: string;
  bindLine: string;
};
