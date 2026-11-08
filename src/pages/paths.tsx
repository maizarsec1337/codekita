import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, Layers3 } from 'lucide-react';
import { academyApi } from '@/lib/academy-api';
import { useLearning } from '@/hooks/useAcademy';
import {
  academies,
  CardSkeletons,
  DataState,
  PageHeading,
  PathCard,
} from '@/components/academy/shared';
import { cn } from '@/lib/utils';
export function PathsPage() {
  const paths = useQuery({ queryKey: ['paths'], queryFn: academyApi.paths });
  const learning = useLearning();
  const [params, setParams] = useSearchParams();
  const category = params.get('academy') ?? 'all',
    search = params.get('q') ?? '',
    difficulty = params.get('difficulty') ?? 'all',
    status = params.get('status') ?? 'all';
  const update = (key: string, value: string) =>
    setParams(
      previous => {
        const next = new URLSearchParams(previous);
        if (value && value !== 'all') next.set(key, value);
        else next.delete(key);
        return next;
      },
      { replace: true }
    );
  const filtered =
    paths.data?.filter(path => {
      const enrollment = learning.data?.enrollments.find(item => item.path.id === path.id);
      return (
        (category === 'all' || path.academy === category) &&
        (difficulty === 'all' || path.difficulty === difficulty) &&
        `${path.title} ${path.description} ${path.skills.join(' ')}`
          .toLowerCase()
          .includes(search.toLowerCase()) &&
        (status === 'all' ||
          (status === 'enrolled' && !!enrollment) ||
          (status === 'completed' && enrollment?.progress === 100))
      );
    }) ?? [];
  return (
    <div className="page-container py-12 sm:py-16">
      <PageHeading
        eyebrow="Your next chapter"
        title="Learning paths"
        description="A clear direction. A practical curriculum. Choose a path and build skills that connect."
      />
      <div className="mb-8 flex flex-wrap gap-2" role="group" aria-label="Academy category">
        {[
          { key: 'all', name: 'All academies', icon: Layers3 },
          ...Object.entries(academies).map(([key, academy]) => ({
            key,
            name: academy.name,
            icon: academy.icon,
          })),
        ].map(item => (
          <button
            key={item.key}
            aria-pressed={category === item.key}
            onClick={() => update('academy', item.key)}
            className={cn(
              'flex items-center gap-2 rounded-lg border px-4 py-2.5 text-xs font-medium transition-colors',
              category === item.key
                ? 'border-primary/40 bg-primary/10 text-primary'
                : 'border-border bg-card text-muted-foreground hover:text-foreground'
            )}
          >
            <item.icon size={15} />
            {item.name}
          </button>
        ))}
      </div>
      <div className="mb-8 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-3">
        <div className="relative min-w-0 flex-1 basis-56">
          <Search size={17} className="absolute left-3 top-3 text-muted-foreground" />
          <input
            aria-label="Search learning paths"
            className="field pl-10"
            placeholder="Search paths, topics, or skills…"
            value={search}
            onChange={event => update('q', event.target.value)}
          />
        </div>
        <SlidersHorizontal size={16} className="hidden text-muted-foreground sm:block" />
        <select
          aria-label="Difficulty"
          className="field w-auto"
          value={difficulty}
          onChange={event => update('difficulty', event.target.value)}
        >
          {['all', 'Beginner', 'Intermediate', 'Advanced'].map(item => (
            <option key={item} value={item}>
              {item === 'all' ? 'All difficulties' : item}
            </option>
          ))}
        </select>
        <select
          aria-label="Enrollment status"
          className="field w-auto"
          value={status}
          onChange={event => update('status', event.target.value)}
        >
          <option value="all">All paths</option>
          <option value="enrolled">Enrolled</option>
          <option value="completed">Completed</option>
        </select>
      </div>
      {paths.isPending ? (
        <CardSkeletons count={6} />
      ) : paths.isError ? (
        <DataState
          error
          title="We couldn’t load the catalogue"
          description="Your learning data has not changed. Check the content service and try again."
          retry={() => void paths.refetch()}
        />
      ) : !filtered.length ? (
        <DataState
          title="No paths found"
          description={
            paths.data.length
              ? 'Try another search, category, difficulty, or enrollment filter.'
              : 'Published paths will appear here when an administrator adds curriculum. No sample paths are presented as live content.'
          }
        />
      ) : (
        <>
          <p className="mb-5 font-mono text-xs text-muted-foreground">
            {filtered.length} PATH{filtered.length === 1 ? '' : 'S'} TO EXPLORE
          </p>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map(path => (
              <PathCard
                key={path.id}
                path={path}
                progress={
                  learning.data?.enrollments.find(item => item.path.id === path.id)?.progress
                }
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
