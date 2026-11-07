import type { FC } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import type { DashboardData, PathSummary, SessionPayload } from "@codekita/shared";

export interface LearningPathCardProps {
  path: PathSummary;
  user?: SessionPayload | null;
  dashboard?: DashboardData;
  onEnroll?: () => void;
}

export const LearningPathCard: FC<LearningPathCardProps> = ({
  path,
  dashboard,
}) => {
  const enrollment = dashboard?.enrollments?.find(
    (e) => e.path.id === path.id
  );

  return (
    <Link
      to={`/paths/${path.slug}`}
      className="group rounded-2xl bg-[var(--surface)] overflow-hidden border border-[var(--border)] transition-colors hover:border-[var(--border-active)]"
    >
      <div className="relative h-64">
        {/* Path cover illustration */}
        <div
          className="relative h-48 w-full bg-gradient-to-b from-[var(--surface-deep)] to-[var(--surface)] overflow-hidden"
        >
          {/* Gradient overlay */}
          <div
            className="absolute inset-0 bg-[linear-gradient(180deg,transparent_40%,var(--surface)_100%)]"
          />
          {/* Subject icon */}
          <div
            className="absolute top-4 left-4 flex items-center gap-2"
          >
            <ShieldCheck size={20} className="text-accent-primary" />
            <span className="text-xs text-text-muted capitalize">
              {path.academy}
            </span>
          </div>
          {/* Progress bar */}
          <div
            className="absolute bottom-4 left-4 right-4 h-2 bg-[var(--surface-hover)] rounded-full overflow-hidden"
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-hover)] transition-colors"
              style={{ width: enrollment?.progress ? `${enrollment.progress}%` : "0%" }}
            />
          </div>
        </div>
        
        {/* Path title and metadata */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-lg font-medium text-text-primary group-hover:text-accent-primary transition-colors">
            {path.title}
          </h3>
          <p className="mt-1 text-sm text-text-muted">
            {path.difficulty} · {path.estimatedMinutes} min · {path.moduleCount} modules
          </p>
        </div>
      </div>
      
      {/* Enroll CTA */}
      <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end justify-end">
        {enrollment
          ? <span className="text-xs text-text-muted/80">
              {enrollment.progress}% complete
            </span>
          : <span className="px-4 py-2 rounded-full text-sm font-medium bg-accent-primary text-background">Explore path</span>}
      </div>
    </Link>
  );
};