import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, Layers3 } from 'lucide-react';
import { academyApi } from '@/lib/academy-api';
import { useLearning } from '@/hooks/useAcademy';
import { academies, CardSkeletons, DataState, PageHeading, PathCard } from '@/components/academy/shared';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { Reveal } from '@/components/motion';
import { managementApi } from '@/lib/management-api';
export function PathsPage() {
    const { t } = useTranslation('courses');
    const paths = useQuery({ queryKey: ['paths'], queryFn: academyApi.paths });
    const categories = useQuery({ queryKey: ['categories'], queryFn: managementApi.categories });
    const learning = useLearning();
    const { user } = useAuth();
    const [params, setParams] = useSearchParams();
    const category = params.get('academy') ?? 'all', search = params.get('q') ?? '', difficulty = params.get('difficulty') ?? 'all', status = user ? (params.get('status') ?? 'all') : 'all';
    const update = (key: string, value: string) => setParams(previous => {
        const next = new URLSearchParams(previous);
        if (value && value !== 'all')
            next.set(key, value);
        else
            next.delete(key);
        return next;
    }, { replace: true });
    const filtered = paths.data?.filter(path => {
        const enrollment = learning.data?.enrollments.find(item => item.path.id === path.id);
        return ((category === 'all' || path.academy === category) &&
            (!params.get('category') || path.categoryId === params.get('category')) &&
            (difficulty === 'all' || path.difficulty === difficulty) &&
            `${path.title} ${path.description} ${path.skills.join(' ')}`
                .toLowerCase()
                .includes(search.toLowerCase()) &&
            (status === 'all' ||
                (status === 'enrolled' && !!enrollment) ||
                (status === 'completed' && enrollment?.progress === 100)));
    }) ?? [];
    return (<div className="page-container py-12 sm:py-16">
      <PageHeading eyebrow={t('catalogueEyebrow')} title={t('learningPaths')} description={t('catalogueDescription')}/>
      {null}
      <div className="mb-8 flex flex-wrap gap-2" role="group" aria-label={t('academyCategory')}>
        {[
            { key: 'all', name: t('allAcademies'), icon: Layers3 },
            ...Object.entries(academies).map(([key, academy]) => ({
                key,
                name: t(key),
                icon: academy.icon,
            })),
        ].map(item => (<button key={item.key} aria-pressed={category === item.key} onClick={() => update('academy', item.key)} className={cn('flex items-center gap-2 rounded-lg border px-4 py-2.5 text-xs font-medium transition-colors', category === item.key
                ? 'border-primary/40 bg-primary/10 text-primary'
                : 'border-border bg-card text-muted-foreground hover:text-foreground')}>
            <item.icon size={15}/>
            {item.name}
          </button>))}
      </div>
      <div className="mb-8 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-3">
        <div className="relative min-w-0 flex-1 basis-56">
          <Search size={17} className="absolute left-3 top-3 text-muted-foreground"/>
          <input aria-label={t('searchPaths')} className="field pl-10" placeholder={t('searchPlaceholder')} value={search} onChange={event => update('q', event.target.value)}/>
        </div>
        <SlidersHorizontal size={16} className="hidden text-muted-foreground sm:block"/>
        <select className="field w-auto" aria-label="Category" disabled={categories.isPending || categories.isError} value={params.get('category') ?? ''} onChange={event => update('category', event.target.value)}><option value="">All categories</option>{categories.data?.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
        <select aria-label={t('difficulty')} className="field w-auto" value={difficulty} onChange={event => update('difficulty', event.target.value)}>
          {['all', 'Beginner', 'Intermediate', 'Advanced'].map(item => (<option key={item} value={item}>
              {item === 'all' ? t('allDifficulties') : item}
            </option>))}
        </select>
        {user && (<select aria-label={t('enrollmentStatus')} className="field w-auto" value={status} onChange={event => update('status', event.target.value)}>
            <option value="all">{t('allPaths')}</option>
            <option value="enrolled">{t('enrolled')}</option>
            <option value="completed">{t('completed')}</option>
          </select>)}
      </div>
      {paths.isPending ? (<CardSkeletons count={6}/>) : paths.isError ? (<DataState error title={t('catalogueErrorTitle')} description={t('catalogueErrorDescription')} retry={() => void paths.refetch()}/>) : !filtered.length ? (<DataState title={t('noPathsFound')} description={paths.data.length ? t('adjustFilters') : t('emptyCatalogue')}/>) : (<>
          <p className="mb-5 font-mono text-xs text-muted-foreground">
            {t('pathCount', { count: filtered.length })}
          </p>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((path, index) => (<Reveal key={path.id} delay={index * 50} className="h-full">
                <PathCard path={path} progress={learning.data?.enrollments.find(item => item.path.id === path.id)?.progress}/>
              </Reveal>))}
          </div>
        </>)}
    </div>);
}
