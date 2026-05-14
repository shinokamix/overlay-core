import type { ReactNode } from "react";
import { cn } from "@/shared/lib/utils";

type Props = {
  eyebrow: string;
  title: ReactNode;
  description?: string;
  as?: "h1" | "h2" | "h3";
  className?: string;
};

export function PanelHeader({ eyebrow, title, description, as: Tag = "h2", className }: Props) {
  return (
    <header className={cn("flex flex-col gap-1", className)}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--text-muted-strong)]">
        {eyebrow}
      </p>
      <Tag className="text-base font-semibold leading-tight text-foreground">{title}</Tag>
      {description ? (
        <p className="max-w-prose text-xs leading-relaxed text-muted-foreground">{description}</p>
      ) : null}
    </header>
  );
}
