import type { SettingsSection } from "@/features/settings-modal/model";

type Props = {
  section: SettingsSection;
};

export function SettingsCategoryPlaceholder({ section }: Props) {
  return (
    <section className="flex flex-col gap-4">
      <header>
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--text-muted-strong)]">
          Planned section
        </p>
        <h3 className="mt-1 text-base font-semibold tracking-tight text-foreground">
          {section.title}
        </h3>
        <p className="mt-2 max-w-prose text-xs leading-relaxed text-muted-foreground">
          {section.description}
        </p>
      </header>

      <div className="rounded-lg border border-dashed border-border bg-surface-1 px-4 py-6 text-center text-xs text-muted-foreground">
        Settings controls for this category will be added in follow-up tasks.
      </div>
    </section>
  );
}
