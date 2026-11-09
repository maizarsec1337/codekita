import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, BookOpen, CheckCircle2, LockKeyhole } from 'lucide-react';
import { useLearning } from '@/hooks/useAcademy';
import { CardSkeletons, DataState, PageHeading, PathCard } from '@/components/academy/shared';
import { Button } from '@/components/ui/button';
import { isStaticFrontend } from '@/lib/mode';
import { useTranslation } from 'react-i18next';
export function LearningLibraryPage() {
  const { t } = useTranslation('common');
  const learning = useLearning();
  const modules = useLocation().pathname.endsWith('modules');
  if (isStaticFrontend) return <><PageHeading eyebrow={t('personalDataUnavailable')} title={modules ? 'Modules' : 'My learning'} description={t('backendRequired')} /><DataState title={t('personalDataUnavailable')} description={t('backendRequired')} /></>;
  if (learning.isPending) return <CardSkeletons />;
  if (learning.isError)
    return (
      <DataState
        error
        title="Learning history unavailable"
        description={learning.error.message}
        retry={() => void learning.refetch()}
      />
    );
  return (
    <>
      <PageHeading
        eyebrow="Your personal curriculum"
        title={modules ? 'Your modules' : 'My learning'}
        description="Your enrolled paths and real progress, all in one place."
        action={
          <Button variant="outline" asChild>
            <Link to="/paths">
              Find a new path
              <ArrowRight size={14} className="ml-2" />
            </Link>
          </Button>
        }
      />
      {learning.data.enrollments.length ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {learning.data.enrollments.map(item => (
            <PathCard key={item.id} path={item.path} progress={item.progress} />
          ))}
        </div>
      ) : (
        <DataState
          title="Your learning library starts here"
          description="Enroll in a path to see its modules, track your progress, and continue where you left off."
        />
      )}
      {modules && (
        <div className="panel mt-6 flex items-start gap-3 p-5">
          <BookOpen size={19} className="shrink-0 text-codekita-secondary" />
          <p className="muted">
            Open a path to view its ordered modules. Module availability is determined by completed
            prerequisite sections on the server.
          </p>
        </div>
      )}
    </>
  );
}
export function AchievementsPage() {
  const { t } = useTranslation('common');
  const learning = useLearning();
  if (isStaticFrontend) return <><PageHeading eyebrow={t('personalDataUnavailable')} title="Achievements" description={t('backendRequired')} /><DataState title={t('personalDataUnavailable')} description={t('backendRequired')} /></>;
  if (learning.isPending) return <CardSkeletons />;
  if (learning.isError)
    return (
      <DataState
        error
        title="Achievements unavailable"
        description={learning.error.message}
        retry={() => void learning.refetch()}
      />
    );
  return (
    <>
      <PageHeading
        eyebrow="Evidence of effort"
        title="Your achievements"
        description="Not just decorations. Every milestone reflects validated learning activity."
      />
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {learning.data.achievements.map(item => (
          <article className="panel p-7" key={item.id}>
            <span
              className={`mb-7 inline-flex rounded-2xl border p-5 ${item.earned ? 'border-primary/30 bg-primary/10 text-primary' : 'border-border bg-background text-muted-foreground'}`}
            >
              {item.earned ? <CheckCircle2 size={30} /> : <LockKeyhole size={30} />}
            </span>
            <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              {item.earned ? 'Achievement unlocked' : 'Keep building'}
            </p>
            <h2 className="text-xl">{item.title}</h2>
            <p className="muted mt-3">{item.description}</p>
          </article>
        ))}
      </div>
    </>
  );
}
