import type { FC } from "react";

export interface AcademyCardProps {
  size?: "sm" | "md" | "lg";
}

export const AcademyCard: FC<AcademyCardProps> = ({ size = "sm" }) => {
  const dimensions = {
    sm: { width: "48px", height: "48px", padding: "p-2" },
    md: { width: "64px", height: "64px", padding: "p-3" },
    lg: { width: "80px", height: "80px", padding: "p-4" },
  };

  const { width, height } = dimensions[size];

  return (
    <div
      className="group relative rounded-lg bg-[var(--surface)] p-3 transition-colors hover:bg-[var(--surface-hover)] border border-[var(--border)]"
      style={{ width, height }}
    >
      <div className="w-full h-full rounded-lg overflow-hidden flex items-center justify-center">
        {/* Animated border effect */}
        <div
          className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        >
          <div
            className="w-full h-full rounded-lg animate-[blob_3s_ease_in_out_infinite]"
            style={{
              background:
                "conic-gradient(from 0deg, var(--accent-primary), transparent, var(--accent-primary), transparent)",
            }}
          />
        </div>
        
        <span
          className={`inline-flex items-center justify-center w-full h-full`}
          style={{ fontSize: size === "sm" ? "1.25rem" : size === "md" ? "1.5rem" : "1.75rem" }}
        >
          {size === "sm" ? "▶" : size === "md" ? "▶▶" : "▶▶▶"}
        </span>
      </div>
    </div>
  );
};