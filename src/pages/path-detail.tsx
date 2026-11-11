import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, BookOpen, Check, CheckCircle2, Clock3, LockKeyhole, Play, ShieldCheck, Trophy } from 'lucide-react';
import { academyApi } from '@/lib/academy-api';
import { useLearning } from '@/hooks/useAcademy';
import { useAuth } from '@/hooks/useAuth';
import { academies, CardSkeletons, DataState, ProgressBar } from '@/components/academy/shared';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { Reveal } from '@/components/motion';
export function PathDetailPage() {
    const { t } = useTranslation('courses');
    const { slug = '' } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const client = useQueryClient();
    const path = useQuery({ queryKey: ['path', slug], queryFn: () => academyApi.path(slug) });
    const learning = useLearning();
    const enrollment = learning.data?.enrollments.find(item => item.path.slug === slug);
    const enroll = useMutation({
        mutationFn: () => academyApi.enroll(slug),
        onSuccess: async () => {
            await client.invalidateQueries({ queryKey: ['learning'] });
            const first = path.data?.modules.find(module => module.lessons.length);
            if (first)
                navigate(`/learn/${first.slug}/${first.lessons[0].slug}`);
        },
    });
    if (path.isPending)
        return (<div className="page-container py-16">
        <CardSkeletons />
      </div>);
    if (path.isError)
        return (<div className="page-container py-16">
        <DataState error title={t('pathUnavailable')} description={path.error.message} retry={() => void path.refetch()}/>
      </div>);
    const data = path.data, academy = academies[data.academy] ?? academies.programming;
    const completed = enrollment?.completedLessonIds ?? [];
    const allSections = data.modules.flatMap(module => module.lessons);
    const start = () => {
        if (!user)
            navigate('/login', { state: { from: `/paths/${slug}` } });
        else if (enrollment?.next)
            navigate(`/learn/${enrollment.next.moduleSlug}/${enrollment.next.sectionSlug}`);
        else if (enrollment && data.modules[0]?.lessons[0])
            navigate(`/learn/${data.modules[0].slug}/${data.modules[0].lessons[0].slug}`);
        else
            enroll.mutate();
    };
    return (<div className="page-container py-10 sm:py-14">
      <Link className="mb-8 inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-primary" to="/paths">
        <ArrowLeft size={14}/>
        {t('allLearningPaths')}
      </Link>
      <div className="grid items-start gap-10 lg:grid-cols-[1fr_320px]">
        <Reveal>
          <div>
            <div className="mb-5 flex items-center gap-3">
              <span className={cn('rounded-xl p-3', academy.background, academy.color)}>
                <academy.icon size={28}/>
              </span>
              <div>
                <p className={cn('text-xs font-semibold', academy.color)}>
                  {t(data.academy)} Academy
                </p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {data.difficulty} · {t('structuredPath')}
                </p>
              </div>
            </div>
            <h1 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-5xl sm:leading-[1.15]">
              {t(data.slug, { defaultValue: data.title })}
            </h1>
            <p className="mt-5 max-w-2xl leading-7 text-muted-foreground">
              {t(`${data.slug}-description`, { defaultValue: data.description ?? '' })}
            </p>
            <div className="my-7 flex flex-wrap gap-5 border-y border-border py-5 text-xs text-muted-foreground">
              <span className="flex items-center gap-2">
                <BookOpen size={15}/>
                {data.moduleCount} {t('modules')} · {data.lessonCount} {t('sections')}
              </span>
              <span className="flex items-center gap-2">
                <Clock3 size={15}/>
                {data.estimatedMinutes} {t('minutesEstimated')}
              </span>
              <span className="flex items-center gap-2">
                <ShieldCheck size={15}/>
                {t('assessedProgression')}
              </span>
            </div>
            <h2 className="mb-4 text-lg">{t('skillsToBuild')}</h2>
            <div className="mb-9 flex flex-wrap gap-2">
              {data.skills.length ? (data.skills.map(skill => (<span key={skill} className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs">
                    <Check size={12} className="text-primary"/>
                    {skill}
                  </span>))) : (<p className="muted">{t('skillsInstructor')}</p>)}
            </div>
            <h2 className="mb-4 text-lg">{t('prerequisites')}</h2>
            <div className="mb-10">
              {data.prerequisites.length ? (data.prerequisites.map(item => (<Link className="mr-3 text-sm text-primary underline underline-offset-4" key={item} to={`/paths/${item}`}>
                    {t(item, { defaultValue: item.replaceAll('-', ' ') })}
                  </Link>))) : (<p className="muted">{t('noPrerequisites')}</p>)}
            </div>
            <div className="mb-7 flex items-center justify-between">
              <h2 className="text-xl">{t('learningRoadmap')}</h2>
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                {t('learnPracticeValidate')}
              </span>
            </div>
            <div className="space-y-0">
              {data.modules.map((module, index) => {
            const firstIndex = allSections.findIndex(lesson => lesson.id === module.lessons[0]?.id);
            const unlocked = (!!enrollment &&
                firstIndex >= 0 &&
                allSections
                    .slice(0, firstIndex)
                    .every(lesson => completed.includes(lesson.id)));
            const done = module.lessons.length > 0 &&
                module.lessons.every(lesson => completed.includes(lesson.id));
            return (<div key={module.id} className="relative flex gap-4 pb-7">
                    {index < data.modules.length - 1 && (<span className="absolute bottom-0 left-[19px] top-10 w-px bg-border"/>)}
                    <span className={cn('z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-background text-xs', done
                    ? 'border-primary/50 text-primary'
                    : unlocked
                        ? 'border-codekita-secondary/50 text-codekita-secondary'
                        : 'border-border text-muted-foreground')}>
                      {done ? (<Check size={17}/>) : unlocked ? (<Play size={14}/>) : (<LockKeyhole size={14}/>)}
                    </span>
                    <div className={cn('panel flex-1 p-5', unlocked && !done && 'border-primary/30')}>
                      <div className="flex flex-wrap justify-between gap-2">
                        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                          {t('moduleLabel')} {String(index + 1).padStart(2, '0')}
                        </p>
                        <span className={cn('text-[10px]', done ? 'text-primary' : 'text-muted-foreground')}>
                          {done
                    ? t('completed')
                    : unlocked
                        ? t('available')
                        : enrollment
                            ? t('locked')
                            : t('enrollToBegin')}
                        </span>
                      </div>
                      <h3 className="mt-2 text-base">
                        {t(module.slug, { defaultValue: module.title })}
                      </h3>
                      <ul className="mt-4 space-y-3">
                        {module.lessons.map(lesson => {
                    const available = (!!enrollment &&
                        allSections
                            .slice(0, allSections.findIndex(item => item.id === lesson.id))
                            .every(item => completed.includes(item.id)));
                    return (<li key={lesson.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                              {completed.includes(lesson.id) ? (<CheckCircle2 size={13} className="text-primary"/>) : (<BookOpen size={13}/>)}
                              {available ? (<Link className="hover:text-primary" to={`/learn/${module.slug}/${lesson.slug}`}>
                                  {t(lesson.slug, { defaultValue: lesson.title })}
                                </Link>) : (<span>{t(lesson.slug, { defaultValue: lesson.title })}</span>)}
                            </li>);
                })}
                      </ul>
                    </div>
                  </div>);
        })}
              <div className="flex items-center gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-codekita-purple/40 bg-codekita-purple/10 text-codekita-purple">
                  <Trophy size={17}/>
                </span>
                <p className="text-sm">{t('certificateCompletion')}</p>
              </div>
            </div>
          </div>
        </Reveal>
        <Reveal delay={80} className="lg:sticky lg:top-28">
          <aside className="panel p-6">
            <p className="eyebrow mb-4">{t('nextMilestone')}</p>
            <h2 className="text-xl">{t('dailyProgress')}</h2>
            <p className="muted mt-3">
              {t('savedProgressDescription')}
            </p>
            {enrollment && (<div className="my-6">
                <div className="mb-3 flex justify-between text-xs">
                  <span className="text-muted-foreground">{t('pathProgress')}</span>
                  <span className="text-primary">{enrollment.progress}%</span>
                </div>
                <ProgressBar value={enrollment.progress}/>
              </div>)}
            <Button className="mt-6 w-full" disabled={enroll.isPending || !data.lessonCount || (!!user && learning.isPending)} onClick={start}>
              {enroll.isPending
            ? t('enrolling')
            : enrollment
                ? enrollment.progress === 100
                    ? t('reviewPath')
                    : t('continueLearning')
                : t('startLearning')}
              <ArrowRight size={15} className="ml-2"/>
            </Button>
            {enroll.isError && (<p role="alert" className="mt-3 text-xs leading-5 text-codekita-warning">
                {enroll.error.message}
              </p>)}
            <p className="mt-4 flex items-center gap-2 text-[10px] text-muted-foreground">
              <LockKeyhole size={12}/>
              {t('serverVerifiedPrerequisites')}
            </p>
          </aside>
        </Reveal>
      </div>
    </div>);
}
