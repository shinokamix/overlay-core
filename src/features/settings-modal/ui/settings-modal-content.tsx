import type { ReactNode } from "react";
import type { SettingsSection } from "@/features/settings-modal/model";
import { TabsContent } from "@/shared/ui/tabs";
import { SettingsCategoryPlaceholder } from "./settings-category-placeholder";
import { ScrollArea } from "@/shared/ui/scroll-area";

type Props = {
  sections: SettingsSection[];
  sectionContent?: Partial<Record<SettingsSection["id"], ReactNode>>;
};

export function SettingsModalContent({ sections, sectionContent }: Props) {
  return (
    <ScrollArea className="min-h-0 flex-1">
      <div className="p-4">
        {sections.map((section) => (
          <TabsContent key={section.id} value={section.id} className="m-0 h-full">
            {sectionContent?.[section.id] ?? <SettingsCategoryPlaceholder section={section} />}
          </TabsContent>
        ))}
      </div>
    </ScrollArea>
  );
}
