import * as React from "react";
import { cn } from "@/lib/utils";

const CKAvatar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative shrink-0 overflow-hidden rounded-full bg-codekita-surface-elevated",
      className,
    )}
    {...props}
  />
));
CKAvatar.displayName = "CKAvatar";

const CKAvatarImage = React.forwardRef<
  HTMLImageElement,
  React.ImgHTMLAttributes<HTMLImageElement>
>(({ className, ...props }, ref) => (
  <img
    ref={ref}
    className={cn("aspect-square h-full w-full object-cover", className)}
    {...props}
  />
));
CKAvatarImage.displayName = "CKAvatarImage";

const CKAvatarFallback = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-codekita-surface-elevated text-codekita-text-secondary",
      className,
    )}
    {...props}
  />
));
CKAvatarFallback.displayName = "CKAvatarFallback";

export { CKAvatar, CKAvatarImage, CKAvatarFallback };