export type SettingsSectionId = "mcp-servers" | "hotkeys" | "skills" | "providers";

export type SettingsSection = {
  id: SettingsSectionId;
  label: string;
  title: string;
  description: string;
};

export const settingsSections: SettingsSection[] = [
  {
    id: "mcp-servers",
    label: "MCP servers",
    title: "MCP servers",
    description:
      "Manage MCP endpoints, transport options, and trust rules for tool integrations in a single place.Manage MCP endpoints, transport options, and trust rules for tool integrations in a single place.",
  },
  {
    id: "hotkeys",
    label: "Hotkeys",
    title: "Hotkeys",
    description:
      "Configure keyboard shortcuts for overlay visibility, interaction mode, and other quick actions.",
  },
  {
    id: "skills",
    label: "Skills",
    title: "Skills",
    description:
      "Review installed skills, connect local skill packs, and control which skills are available in sessions.",
  },
  {
    id: "providers",
    label: "Providers",
    title: "Providers",
    description:
      "Set up model providers, select defaults, and configure credentials, routing, and fallback behavior.",
  },
];
