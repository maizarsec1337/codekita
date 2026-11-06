import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "bg-codekita-primary text-codekita-primary-foreground",
        secondary: "bg-codekita-surface text-codekita-text-primary border codekita-border",
        destructive: "bg-codekita-error text-white",
        outline: "text-codekita-text-primary border codekita-border",
        codekita: "bg-codekita-primary text-codekita-primary-foreground",
        codekitaSecondary: "bg-codekita-secondary text-codekita-secondary-foreground",
        codekitaPurple: "bg-codekita-purple text-codekita-purple-foreground",
        codekitaSuccess: "bg-codekita-success text-white",
        codekitaWarning: "bg-codekita-warning text-white",
        codekitaError: "bg-codekita-error text-white",
        codekitaOutline: "text-codekita-text-primary border codekita-border",
        codekitaSubtle: "bg-codekita-surface/50 text-codekita-text-secondary border codekita-border/50",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span
      className={cn(badgeVariants({ variant, className }))}
      {...props}
    />
  );
}