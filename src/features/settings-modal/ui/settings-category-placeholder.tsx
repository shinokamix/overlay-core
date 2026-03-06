import type { SettingsSection } from "@/features/settings-modal/model";

type Props = {
  section: SettingsSection;
};

export function SettingsCategoryPlaceholder({ section }: Props) {
  return (
    <section className="flex flex-col rounded-xl border border-dashed border-border/70 bg-muted/20 p-5">
      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Planned section</p>
      <h3 className="mt-3 text-lg font-semibold tracking-tight">{section.title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{section.description}</p>

      <div className="mt-6 rounded-lg border border-border/70 bg-background/70 p-4 text-sm text-muted-foreground">
        Settings controls for this category will be added in follow-up tasks.
      </div>
    </section>
  );
}
