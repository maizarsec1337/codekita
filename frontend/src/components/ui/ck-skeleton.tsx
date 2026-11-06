import { cn } from "@/lib/utils";

export function CKSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-codekita-surface/50 border border-codekita-border/30",
        className,
      )}
    />
  );
}

export function CKSkeletonCircle({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-full bg-codekita-surface/50 border border-codekita-border/30",
        className,
      )}
    />
  );
}

export function CKSkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {[...Array(lines)].map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-4 bg-codekita-surface/50 border border-codekita-border/30 rounded",
            i === lines - 1 ? "w-3/4" : "w-full",
          )}
        />
      ))}
    </div>
  );
}