import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/shared/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring/60 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-sm hover:bg-indigo-600",
        primary: "bg-primary text-primary-foreground shadow-sm hover:bg-indigo-600",
        secondary:
          "bg-surface-2 text-foreground border border-[color:var(--input)] hover:bg-surface-3",
        ghost:
          "bg-transparent text-muted-foreground border border-border hover:bg-surface-2 hover:text-foreground",
        outline:
          "bg-transparent text-muted-foreground border border-border hover:bg-surface-2 hover:text-foreground",
        danger:
          "bg-rose-500/15 text-rose-400 border border-rose-500/25 hover:bg-rose-500/25 hover:text-rose-400",
        destructive:
          "bg-rose-500/15 text-rose-400 border border-rose-500/25 hover:bg-rose-500/25 hover:text-rose-400",
        link: "text-indigo-200 underline-offset-4 hover:underline border-0 bg-transparent",
      },
      size: {
        default: "h-9 px-4 text-xs rounded-md [&_svg]:size-3.5",
        sm: "h-7 px-3 text-[11px] rounded-sm [&_svg]:size-3",
        lg: "h-10 px-5 text-sm rounded-md [&_svg]:size-4",
        icon: "h-9 w-9 rounded-md [&_svg]:size-4",
        "icon-sm": "h-7 w-7 rounded-sm [&_svg]:size-3.5",
        "icon-xs": "h-6 w-6 rounded-sm [&_svg]:size-3",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
