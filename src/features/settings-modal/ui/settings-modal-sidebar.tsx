import type { SettingsSection } from "@/features/settings-modal/model";
import { TabsList, TabsTrigger } from "@/shared/ui/tabs";

type Props = {
  sections: SettingsSection[];
};

export function SettingsModalSidebar({ sections }: Props) {
  return (
    <TabsList
      aria-label="Settings categories"
      className="flex h-full w-[25vw] shrink-0 flex-col items-stretch justify-start gap-1 rounded-none border-r border-border/70 bg-muted/25 p-2"
    >
      {sections.map((section) => (
        <TabsTrigger
          key={section.id}
          value={section.id}
          className="h-auto justify-start rounded-lg px-3 py-2 text-left text-sm"
        >
          {section.label}
        </TabsTrigger>
      ))}
    </TabsList>
  );
}
