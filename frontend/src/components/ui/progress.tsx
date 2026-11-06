"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const Progress = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "w-full rounded-full border codekita-border bg-codekita-surface/50",
      className,
    )}
    {...props}
  />
));
Progress.displayName = "Progress";

const ProgressIndicator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex h-1 overflow-hidden rounded-full bg-codekita-primary",
      className,
    )}
    {...props}
  />
));
ProgressIndicator.displayName = "ProgressIndicator";

export { Progress, ProgressIndicator };