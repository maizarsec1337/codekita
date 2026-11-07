"use client";

import { useToast } from "./use-toast";
import { X } from "lucide-react";

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-4 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex w-full max-w-sm flex-col gap-1 p-4 text-sm"
        >
          <div className="flex items-start gap-3 rounded-xl border bg-background p-4 shadow-lg">
            {toast.title && (
              <h3 className="font-semibold">{toast.title}</h3>
            )}
            {toast.description && (
              <p className="text-muted-foreground">{toast.description}</p>
            )}
            <button
              onClick={() => dismiss(toast.id)}
              className="rounded-sm opacity-50 hover:opacity-100 transition-opacity"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}