import { FC } from "react";

export interface ProgressTrackerProps {
  progress: number;
  xp: number;
}

export const ProgressTracker: FC<ProgressTrackerProps> = ({ progress, xp }) => {
  return (
    <div className="space-y-4">
      <div className="relative height-2 rounded-full bg-[var(--surface-hover)] overflow-hidden">
        <div
          className="progress-bar-fill"
          style={{ width: `${progress}%` }}
          aria-label={`Progress: ${progress}%`}
        />
      </div>
      <div className="flex items-center gap-3 text-sm text-text-muted">
        <span>Progress</span>
        <span>{progress}%</span>
      </div>
      <div className="flex items-center gap-2 text-xs">
        <span>XP: {xp}</span>
      </div>
    </div>
  );
};