export type SettingsSectionId = "hotkeys" | "providers";

export type SettingsSection = {
  id: SettingsSectionId;
  label: string;
  title: string;
  description: string;
};

export const settingsSections: SettingsSection[] = [
  {
    id: "providers",
    label: "Providers",
    title: "Providers",
    description:
      "Set up model providers, select defaults, and configure credentials, routing, and fallback behavior.",
  },
  {
    id: "hotkeys",
    label: "Hotkeys",
    title: "Hotkeys",
    description:
      "Configure keyboard shortcuts for overlay visibility, interaction mode, and other quick actions.",
  },
];
