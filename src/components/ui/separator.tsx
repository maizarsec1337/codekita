import * as React from "react";
import { cn } from "@/lib/utils";

const Separator = React.forwardRef<
  HTMLDivElement,
  {
    className?: string;
    orientation?: "horizontal" | "vertical";
    decorative?: boolean;
  }
>(({ className, orientation = "horizontal", decorative = true, ...props }, ref) => (
  <div
    ref={ref}
    role={decorative ? "none" : undefined}
    aria-orientation={orientation}
    className={cn(
      "shrink-0 border-y",
      orientation === "horizontal" ? "w-full" : "h-full",
      className,
    )}
    {...props}
  />
));
Separator.displayName = "Separator";

export { Separator };