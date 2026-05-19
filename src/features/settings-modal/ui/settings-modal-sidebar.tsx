import { Cpu, Keyboard } from "lucide-react";
import type { SettingsSection, SettingsSectionId } from "@/features/settings-modal/model";
import { TabsList, TabsTrigger } from "@/shared/ui/tabs";

type Props = {
  sections: SettingsSection[];
};

const SECTION_ICONS: Record<SettingsSectionId, React.ComponentType<{ className?: string }>> = {
  providers: Cpu,
  hotkeys: Keyboard,
};

export function SettingsModalSidebar({ sections }: Props) {
  return (
    <TabsList
      aria-label="Settings categories"
      className="flex h-full w-[140px] shrink-0 flex-col items-stretch justify-start gap-0.5 rounded-none border-r border-border bg-surface-1 p-2"
    >
      <p className="px-2 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--text-muted-strong)]">
        Categories
      </p>
      {sections.map((section) => {
        const Icon = SECTION_ICONS[section.id];
        return (
          <TabsTrigger
            key={section.id}
            value={section.id}
            className="h-auto justify-start gap-2 rounded-md px-3 py-2 text-left text-xs font-medium data-[state=active]:border data-[state=active]:border-indigo-500/30 data-[state=active]:bg-indigo-500/10 data-[state=active]:text-foreground hover:bg-surface-2"
          >
            <Icon className="size-3.5 shrink-0 opacity-70" />
            {section.label}
          </TabsTrigger>
        );
      })}
    </TabsList>
  );
}
