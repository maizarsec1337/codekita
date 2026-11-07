"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { isStaticFrontend } from "@/lib/mode";

type BackendStatus = "ok" | "degraded" | "offline";

export function ApiStatusIndicator() {
  const [status, setStatus] = useState<BackendStatus>("offline");

  useEffect(() => {
    if (isStaticFrontend) return;
    let cancelled = false;
    api
      .health()
      .then((health) => {
        if (!cancelled) {
          setStatus(
            health.services.database === "connected" ? "ok" : "degraded",
          );
        }
      })
      .catch(() => {
        if (!cancelled) setStatus("offline");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const config = isStaticFrontend ? { label: "Static demo", className: "bg-amber-500" } : {
    ok: { label: "Backend online", className: "bg-emerald-500" },
    degraded: { label: "Database unavailable", className: "bg-amber-500" },
    offline: { label: "Backend offline", className: "bg-rose-500" },
  }[status];

  return (
    <span
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium"
      title={config.label}
    >
      <span className={`h-2 w-2 rounded-full ${config.className}`} />
      {config.label}
    </span>
  );
}