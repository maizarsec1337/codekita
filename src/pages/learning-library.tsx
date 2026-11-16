import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, BookOpen, CheckCircle2, LockKeyhole } from 'lucide-react';
import { useLearning } from '@/hooks/useAcademy';
import { CardSkeletons, DataState, PageHeading, PathCard } from '@/components/academy/shared';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { managementApi } from '@/lib/management-api';
import { useAuth } from '@/hooks/useAuth';
export function LearningLibraryPage() {
    const learning = useLearning();
    const modules = useLocation().pathname.endsWith('modules');
    if (learning.isPending)
        return <CardSkeletons />;
    if (learning.isError)
        return (<DataState error title="Learning history unavailable" description={learning.error.message} retry={() => void learning.refetch()}/>);
    return (<>
      <PageHeading eyebrow="Your personal curriculum" title={modules ? 'Your modules' : 'My learning'} description="Your enrolled paths and real progress, all in one place." action={<Button variant="outline" asChild>
            <Link to="/paths">
              Find a new path
              <ArrowRight size={14} className="ml-2"/>
            </Link>
          </Button>}/>
      {learning.data.enrollments.length ? (<div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {learning.data.enrollments.map(item => (<PathCard key={item.id} path={item.path} progress={item.progress}/>))}
        </div>) : (<DataState title="Your learning library starts here" description="Enroll in a path to see its modules, track your progress, and continue where you left off."/>)}
      {modules && (<div className="panel mt-6 flex items-start gap-3 p-5">
          <BookOpen size={19} className="shrink-0 text-codekita-secondary"/>
          <p className="muted">
            Open a path to view its ordered modules. Module availability is determined by completed
            prerequisite sections on the server.
          </p>
        </div>)}
      {!modules && <LearningHistory />}
    </>);
}
function LearningHistory() {
    const { t, i18n } = useTranslation('dashboard');
    const { user } = useAuth();
    const [page, setPage] = useState(1);
    const history = useQuery({ queryKey: ['learning-history', user?.userId, page], queryFn: () => managementApi.history(page), enabled: !!user });
    return <section className="panel mt-6 p-6"><h2 className="mb-4 text-xl">{t('learningHistory')}</h2>{history.isPending ? <p role="status">{t('loading')}</p> : history.isError ? <DataState error title={t('unavailable')} description={history.error.message} retry={() => void history.refetch()} /> : <>{history.data.items.length ? <ul className="space-y-3">{history.data.items.map(item => <li className="border-b border-border pb-3 text-sm" key={item.id}>{item.lesson.title} · {item.enrollment.course.title}<span className="muted ml-3">{new Date(item.completedAt).toLocaleDateString(i18n.language)}</span></li>)}</ul> : <p className="muted">{t('noResults')}</p>}<div className="mt-5 flex justify-between"><Button variant="outline" disabled={page === 1} onClick={() => setPage(page - 1)}>{t('previous')}</Button><span>{t('pageCount', { page, total: history.data.total })}</span><Button variant="outline" disabled={page * 25 >= history.data.total} onClick={() => setPage(page + 1)}>{t('next')}</Button></div></>}</section>;
}
export function AchievementsPage() {
    const learning = useLearning();
    if (learning.isPending)
        return <CardSkeletons />;
    if (learning.isError)
        return (<DataState error title="Achievements unavailable" description={learning.error.message} retry={() => void learning.refetch()}/>);
    return (<>
      <PageHeading eyebrow="Evidence of effort" title="Your achievements" description="Not just decorations. Every milestone reflects validated learning activity."/>
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {learning.data.achievements.map(item => (<article className="panel p-7" key={item.id}>
            <span className={`mb-7 inline-flex rounded-2xl border p-5 ${item.earned ? 'border-primary/30 bg-primary/10 text-primary' : 'border-border bg-background text-muted-foreground'}`}>
              {item.earned ? <CheckCircle2 size={30}/> : <LockKeyhole size={30}/>}
            </span>
            <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              {item.earned ? 'Achievement unlocked' : 'Keep building'}
            </p>
            <h2 className="text-xl">{item.title}</h2>
            <p className="muted mt-3">{item.description}</p>
          </article>))}
      </div>
    </>);
}
