"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export type Toast = {
  id: string;
  title?: string;
  description?: string;
  duration?: number;
};

const ToastContext = createContext<{
  toasts: Toast[];
  toast: (props: Omit<Toast, "id">) => string;
  dismiss: (id: string) => void;
} | null>(null);

export function ToastProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((props: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).slice(2, 10);
    const item: Toast = { ...props, id, duration: props.duration ?? 5000 };
    setToasts((prev) => [...prev, item]);
    return id;
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Auto-dismiss toasts after their duration.
  useEffect(() => {
    const timers: Record<string, ReturnType<typeof setTimeout>> = {};
    toasts.forEach((t) => {
      timers[t.id] = setTimeout(() => dismiss(t.id), t.duration);
    });
    return () => {
      Object.values(timers).forEach((timer) => clearTimeout(timer));
    };
  }, [toasts, dismiss]);

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}