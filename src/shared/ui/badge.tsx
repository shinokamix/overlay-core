import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/shared/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2 py-[3px] text-[10px] font-medium leading-none whitespace-nowrap border",
  {
    variants: {
      tone: {
        indigo: "bg-indigo-500/15 text-indigo-200 border-indigo-500/25",
        amber: "bg-amber-500/15 text-amber-400 border-amber-500/25",
        teal: "bg-teal-500/12 text-teal-400 border-teal-500/20",
        rose: "bg-rose-500/12 text-rose-400 border-rose-500/20",
        green: "bg-green-500/12 text-green-400 border-green-500/20",
        neutral: "bg-surface-2 text-muted-foreground border-[color:var(--input)]",
      },
    },
    defaultVariants: {
      tone: "neutral",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {
  withDot?: boolean;
}

export function Badge({ className, tone, withDot, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ tone }), className)} {...props}>
      {withDot ? (
        <span aria-hidden className="inline-block size-[5px] rounded-full bg-current" />
      ) : null}
      {children}
    </span>
  );
}
