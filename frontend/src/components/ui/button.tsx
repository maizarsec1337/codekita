import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Slot } from "@radix-ui/react-slot";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-codekita-primary text-codekita-primary-foreground hover:bg-codekita-primary/90",
        destructive: "bg-codekita-error text-white hover:bg-codekita-error/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-codekita-primary underline-offset-4 hover:underline",
        codekita: "bg-codekita-primary text-codekita-primary-foreground hover:bg-codekita-primary/90 shadow-ck-glow",
        codekitaOutline: "border border-codekita-border bg-codekita-surface hover:bg-codekita-surface/80 hover:text-codekita-text-primary",
        codekitaGhost: "hover:bg-codekita-surface/50 hover:text-codekita-text-primary",
        codekitaSecondary: "bg-codekita-secondary text-codekita-secondary-foreground hover:bg-codekita-secondary/90",
        codekitaPurple: "bg-codekita-purple text-codekita-purple-foreground hover:bg-codekita-purple/90",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}