import * as React from "react";
import { cn } from "@/lib/utils";

const CKCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { variant?: "default" | "elevated" | "glass" | "interactive" }
>(({ className, variant, ...props }, ref) => {
  const variantStyles = {
    default: "bg-codekita-surface border codekita-border shadow-ck-sm",
    elevated: "bg-codekita-surface-elevated border codekita-border shadow-ck-md",
    glass: "bg-codekita-surface/80 backdrop-blur-md border border-codekita-border/50",
    interactive:
      "bg-codekita-surface border codekita-border hover:border-codekita-primary/50 transition-all duration-200",
  };

  return (
    <div
      ref={ref}
      className={cn(
        "rounded-xl overflow-hidden",
        variantStyles[variant ?? "default"],
        className,
      )}
      {...props}
    />
  );
});
CKCard.displayName = "CKCard";

const CKCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CKCardHeader.displayName = "CKCardHeader";

const CKCardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-xl font-semibold tracking-tight text-codekita-text-primary",
      className,
    )}
    {...props}
  />
));
CKCardTitle.displayName = "CKCardTitle";

const CKCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-codekita-text-secondary", className)}
    {...props}
  />
));
CKCardDescription.displayName = "CKCardDescription";

const CKCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CKCardContent.displayName = "CKCardContent";

const CKCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("mt-6 p-6 pt-0 border-t border-codekita-border/30", className)}
    {...props}
  />
));
CKCardFooter.displayName = "CKCardFooter";

export {
  CKCard,
  CKCardHeader,
  CKCardTitle,
  CKCardDescription,
  CKCardContent,
  CKCardFooter,
};