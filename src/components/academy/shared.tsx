import { Link, useInRouterContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowRight,
  Atom,
  BookOpen,
  Clock3,
  Code2,
  ShieldCheck,
  Terminal,
  TriangleAlert,
} from 'lucide-react';
import type { Academy, PathSummary } from '@codekita/shared';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const academies = {
  programming: {
    name: 'Programming',
    icon: Code2,
    color: 'text-codekita-primary',
    background: 'bg-codekita-primary/10',
    description:
      'Turn ideas into software. Build a solid foundation, then engineer for the real world.',
    tags: ['Web development', 'Python', 'Software engineering'],
  },
  cybersecurity: {
    name: 'Cybersecurity',
    icon: ShieldCheck,
    color: 'text-codekita-secondary',
    background: 'bg-codekita-secondary/10',
    description:
      'Think like a defender. Understand systems, investigate threats, and build securely.',
    tags: ['Linux & networking', 'Defensive security', 'Secure coding'],
  },
  ai: {
    name: 'AI Engineering',
    icon: Atom,
    color: 'text-codekita-purple',
    background: 'bg-codekita-purple/10',
    description:
      'Go beyond the prompt. Understand data, evaluate models, and build intelligent applications.',
    tags: ['Machine learning', 'LLM applications', 'AI agents'],
  },
} satisfies Record<
  Academy,
  {
    name: string;
    icon: typeof Code2;
    color: string;
    background: string;
    description: string;
    tags: string[];
  }
>;

export function Logo({ compact = false, reloadDocument = false }: { compact?: boolean; reloadDocument?: boolean }) {
  const { t } = useTranslation('common');
  const inRouter = useInRouterContext();
  const content = (
    <>
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Terminal size={23} strokeWidth={2.5} aria-hidden="true" />
      </span>
      {!compact && (
        <span className="text-xl font-bold tracking-tight">
          code<span className="text-primary">kita</span>
          <span className="ml-2 hidden rounded border border-border px-1.5 py-0.5 align-middle font-mono text-[9px] font-normal uppercase tracking-widest text-muted-foreground sm:inline">
            academy
          </span>
        </span>
      )}
    </>
  );
  const props = { className: 'inline-flex shrink-0 items-center gap-2.5', 'aria-label': t('logoHome'), children: content };
  return inRouter ? <Link to="/" reloadDocument={reloadDocument} {...props} /> : <a href="/" {...props} />;
}
export function ProgressBar({
  value,
  label = 'Learning progress',
  className,
}: {
  value: number;
  label?: string;
  className?: string;
}) {
  const progress = Math.min(100, Math.max(0, value));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn('h-1.5 overflow-hidden rounded-full bg-codekita-surface-elevated', className)}
    >
      <div
        className="h-full rounded-full bg-primary transition-[width]"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
      <div>
        {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  );
}
export function DataState({
  title,
  description,
  retry,
  error = false,
}: {
  title: string;
  description: string;
  retry?: () => void;
  error?: boolean;
}) {
  return (
    <div className="panel px-6 py-12 text-center" role={error ? 'alert' : 'status'}>
      {error ? (
        <TriangleAlert className="mx-auto mb-4 text-codekita-warning" size={28} />
      ) : (
        <BookOpen className="mx-auto mb-4 text-muted-foreground" size={28} />
      )}
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="muted mx-auto mt-2 max-w-md">{description}</p>
      {retry && (
        <Button variant="outline" className="mt-5" onClick={retry}>
          Try again
        </Button>
      )}
    </div>
  );
}
export function PathCard({ path, progress }: { path: PathSummary; progress?: number }) {
  const academy = academies[path.academy] ?? academies.programming;
  const Icon = academy.icon;
  return (
    <article className="panel group flex h-full flex-col overflow-hidden transition-colors hover:border-primary/50">
      <div className="academy-grid relative flex h-36 items-center justify-center border-b border-border bg-background/40">
        <div
          className={cn(
            'flex h-16 w-16 items-center justify-center rounded-2xl border border-current/20',
            academy.background,
            academy.color
          )}
        >
          <Icon size={32} strokeWidth={1.5} />
        </div>
        <span className="absolute left-5 top-4 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Learning path
        </span>
        <span className="absolute right-5 top-4 rounded-md border border-border bg-card px-2 py-1 text-[10px] text-muted-foreground">
          {path.difficulty}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className={cn('mb-2 text-xs font-medium', academy.color)}>{academy.name}</p>
        <h3 className="text-lg font-semibold leading-7">
          <Link className="transition-colors hover:text-primary" to={`/paths/${path.slug}`}>
            {path.title}
          </Link>
        </h3>
        <p className="muted mt-2 line-clamp-2">{path.description}</p>
        <div className="mt-auto pt-6">
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <BookOpen size={13} />
              {path.moduleCount} modules
            </span>
            <span className="flex items-center gap-1.5">
              <Clock3 size={13} />
              {Math.round((path.estimatedMinutes / 60) * 10) / 10} hours
            </span>
          </div>
          {progress !== undefined && (
            <div className="mt-4">
              <div className="mb-2 flex justify-between text-xs text-muted-foreground">
                <span>{progress === 100 ? 'Completed' : 'Enrolled'}</span>
                <span>{progress}%</span>
              </div>
              <ProgressBar value={progress} />
            </div>
          )}
          <Link
            to={`/paths/${path.slug}`}
            className="mt-5 flex items-center justify-between border-t border-border pt-4 text-sm font-medium transition-colors group-hover:text-primary"
          >
            {progress === undefined
              ? 'Explore path'
              : progress === 100
                ? 'Review path'
                : 'Continue learning'}
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </article>
  );
}
export function CardSkeletons({ count = 3 }: { count?: number }) {
  return (
    <div aria-label="Loading content" className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="panel h-80 animate-pulse bg-codekita-surface-elevated/40" />
      ))}
    </div>
  );
}
