import type { FC } from "react";

export interface AcademyCategoryProps {
  icon: string;
  title: string;
  description: string;
  progress: number;
  routes: string[];
}

export const AcademyCategory: FC<AcademyCategoryProps> = ({
  icon,
  title,
  description,
}) => {
  return (
    <div
      className="group rounded-2xl bg-[var(--surface)] p-6 sm:p-8 hover:bg-[var(--surface-hover)] transition-colors border border-[var(--border)]"
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <span className="text-3xl">{icon}</span>
        </div>
        <div className="flex-1 pt-1">
          <h3 className="text-lg font-medium text-text-primary group-hover:text-accent-primary transition-colors">
            {title}
          </h3>
          <p className="mt-1 text-sm text-text-muted line-clamp-2">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
};