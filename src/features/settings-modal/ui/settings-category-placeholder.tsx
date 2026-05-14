import type { SettingsSection } from "@/features/settings-modal/model";
import { PanelHeader } from "@/shared/ui/panel-header";

type Props = {
  section: SettingsSection;
};

export function SettingsCategoryPlaceholder({ section }: Props) {
  return (
    <section className="flex flex-col gap-4">
      <PanelHeader
        as="h3"
        eyebrow="Planned section"
        title={section.title}
        description={section.description}
      />

      <div className="rounded-lg border border-dashed border-border bg-surface-1 px-4 py-6 text-center text-xs text-muted-foreground">
        Settings controls for this category will be added in follow-up tasks.
      </div>
    </section>
  );
}
