"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { CKCard } from "./ck-card";

interface CKStatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changePositive?: boolean;
  icon?: React.ReactNode;
  trend?: "up" | "down" | "neutral";
}

export function CKStatCard({
  title,
  value,
  change,
  icon,
  trend = "neutral",
}: CKStatCardProps) {
  const trendColors = {
    up: "text-codekita-success",
    down: "text-codekita-error",
    neutral: "text-codekita-text-secondary",
  };

  return (
    <CKCard variant="interactive" className="group">
      <div className="flex items-center justify-between p-6">
        <div>
          <p className="text-sm text-codekita-text-secondary">{title}</p>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-2xl font-bold text-codekita-text-primary">
              {value}
            </span>
          </div>
        </div>
        {icon && (
          <div className="w-10 h-10 rounded-xl bg-codekita-surface/50 border border-codekita-border/50 flex items-center justify-center text-codekita-text-secondary group-hover:bg-codekita-primary group-hover:text-codekita-primary-foreground transition-colors">
            {icon}
          </div>
        )}
      </div>
      {change !== undefined && (
        <div className="px-6 pb-6 border-t border-codekita-border/30">
          <div className="flex items-center gap-1 text-xs font-medium">
            <span className={cn(trendColors[trend])}>
              {trend === "up" ? "↑" : trend === "down" ? "↓" : "•"}
            </span>
            <span>{change}</span>
          </div>
        </div>
      )}
    </CKCard>
  );
}