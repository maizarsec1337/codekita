import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, Download, FilePlus2, Save, ShieldCheck } from 'lucide-react';
import { pathInputSchema, type PathInput } from '@codekita/shared';
import { academyApi, type AdminPath } from '@/lib/academy-api';
import { Button } from '@/components/ui/button';
import { DataState, PageHeading } from '@/components/academy/shared';
import { ManagementPanel } from '@/components/academy/management-panel';
import { managementApi } from '@/lib/management-api';
import { useTranslation } from 'react-i18next';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
const empty: PathInput = {
    title: '',
    slug: '',
    description: '',
    academy: 'programming',
    difficulty: 'Beginner',
    estimatedMinutes: 60,
    skills: [],
    prerequisites: [],
    isPublished: false,
    modules: [],
};
const moduleTemplate = [
    {
        slug: 'unique-path-module-slug',
        title: 'Module title',
        lessons: [
            {
                slug: 'first-section',
                title: 'Section title',
                content: '## Learning objective\n\nWrite a complete original lesson here.',
                objectives: ['Explain the core concept'],
                assessment: {
                    question: 'Which answer demonstrates the objective?',
                    options: ['First answer', 'Second answer'],
                    correctIndex: 0,
                },
            },
        ],
    },
];
export function AdminDashboardPage() {
    const { t } = useTranslation('dashboard');
    const [navigationOpen, setNavigationOpen] = useState(false);
    const [pathPage, setPathPage] = useState(1), [pathSearch, setPathSearch] = useState(''), [pathStatus, setPathStatus] = useState('all');
    const paths = useQuery({ queryKey: ['admin-paths', pathPage, pathSearch, pathStatus], queryFn: () => academyApi.adminPathPage(pathPage, pathSearch, pathStatus) });
    const templates = useQuery({ queryKey: ['admin-starter'], queryFn: academyApi.adminStarter });
    const categories = useQuery({ queryKey: ['admin-categories'], queryFn: managementApi.adminCategories });
    const client = useQueryClient();
    const [selected, setSelected] = useState<AdminPath | null>(null), [form, setForm] = useState<PathInput>(empty), [modules, setModules] = useState(JSON.stringify(moduleTemplate, null, 2)), [error, setError] = useState(''), [message, setMessage] = useState('');
    const write = useMutation({
        mutationFn: (input: PathInput) => academyApi.writePath(input, selected?.id),
        onSuccess: async () => {
            setMessage('Curriculum saved. Existing learning records have been preserved.');
            await Promise.all([
                client.invalidateQueries({ queryKey: ['admin-paths'] }),
                client.invalidateQueries({ queryKey: ['paths'] }),
                client.invalidateQueries({ queryKey: ['path'] }),
                client.invalidateQueries({ queryKey: ['learning'] }),
                client.invalidateQueries({ queryKey: ['lesson'] }),
                client.invalidateQueries({ queryKey: ['admin-statistics'] }),
            ]);
        },
        onError: failure => setError(failure.message),
    });
    const archive = useMutation({ mutationFn: managementApi.archivePath, onSuccess: async () => { setSelected(null); setForm(empty); setMessage('Path archived. Learning records preserved.'); await Promise.all(['admin-paths', 'paths', 'path', 'learning'].map(key => client.invalidateQueries({ queryKey: [key] }))); }, onError: failure => setError(failure.message) });
    const set = <K extends keyof PathInput>(key: K, value: PathInput[K]) => {
        setForm(previous => ({ ...previous, [key]: value }));
        setMessage('');
    };
    const edit = (path: AdminPath) => {
        setSelected(path);
        setForm({ ...path, modules: [] });
        setError('');
        setMessage('');
        setModules(JSON.stringify(path.modules.map(module => ({
            id: module.id,
            slug: module.slug ?? module.id,
            title: module.title,
            lessons: module.lessons.map(lesson => ({
                id: lesson.id,
                slug: lesson.slug ?? lesson.id,
                title: lesson.title,
                content: lesson.content ?? '',
                objectives: lesson.objectives,
                assessment: lesson.assessment,
            })),
        })), null, 2));
    };
    const save = (event: React.FormEvent) => {
        event.preventDefault();
        setError('');
        setMessage('');
        try {
            const parsed = pathInputSchema.safeParse({
                ...form,
                skills: form.skills.filter(Boolean),
                modules: JSON.parse(modules),
            });
            if (!parsed.success) {
                setError(parsed.error.issues
                    .map(issue => `${issue.path.join('.')}: ${issue.message}`)
                    .slice(0, 5)
                    .join(' · '));
                return;
            }
            if (!selected || window.confirm(t('confirmCurriculum'))) write.mutate(parsed.data);
        }
        catch {
            setError('Modules must be valid JSON. Check commas, quotation marks, and brackets.');
        }
    };
    const navigation = <nav aria-label={t('adminNav')} className="space-y-2">{[['admin-overview', 'overview'], ['admin-curriculum', 'curriculum'], ['admin-categories', 'categories'], ['admin-users', 'users'], ['admin-activity', 'activityMonitoring'], ['admin-certificates', 'certificateManagement'], ['admin-settings', 'platformSettings']].map(([id, label]) => <a key={id} href={`#${id}`} onClick={() => setNavigationOpen(false)} className="block rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground">{t(label)}</a>)}<Link className="block px-3 py-2 text-sm text-primary" to="/dashboard">{t('studentWorkspace')}</Link></nav>;
    return (<div className="page-container py-12"><div className="mb-4 lg:hidden"><Sheet open={navigationOpen} onOpenChange={setNavigationOpen}><SheetTrigger asChild><Button variant="outline">{t('openAdminNav')}</Button></SheetTrigger><SheetContent><SheetHeader><SheetTitle>{t('adminNav')}</SheetTitle><SheetDescription>{t('overview')}</SheetDescription></SheetHeader><div className="overflow-y-auto px-5">{navigation}</div></SheetContent></Sheet></div><div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]"><aside className="hidden lg:block"><div className="panel sticky top-4 p-4">{navigation}</div></aside><div className="min-w-0" id="admin-curriculum">
      <Link className="mb-7 inline-flex items-center gap-2 text-xs text-muted-foreground" to="/dashboard">
        <ArrowLeft size={13}/>
        Back to workspace
      </Link>
      <PageHeading eyebrow="Administrator workspace" title="Curriculum management" description="The existing CodeKita admin panel, extended with validated path, module, section, lesson, and assessment editing." action={<Button variant="outline" onClick={() => {
                setSelected(null);
                setForm(empty);
                setModules(JSON.stringify(moduleTemplate, null, 2));
                setError('');
                setMessage('');
            }}>
            <FilePlus2 size={15} className="mr-2"/>
            New path
          </Button>}/>
      <div className="mb-7 flex gap-3 rounded-xl border border-codekita-secondary/20 bg-codekita-secondary/5 p-4">
        <ShieldCheck size={18} className="mt-0.5 shrink-0 text-codekita-secondary"/>
        <p className="text-xs leading-6 text-muted-foreground">
          {'Server-side ADMIN/SUPER_ADMIN permissions apply to every content request. Editing preserves IDs and learner records. Existing assessed answer keys cannot be changed after completion; create a new lesson version. Manual XP awards and certificate overrides are intentionally unavailable.'}
        </p>
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-[290px_minmax(0,1fr)]">
        <aside className="space-y-5">
          <div className="panel p-4">
            <h2 className="mb-4 flex items-center gap-2 text-sm">
              <BookOpen size={16}/>
              Existing curriculum
            </h2>
            <input className="field mb-3" aria-label={t('search')} placeholder={t('search')} value={pathSearch} maxLength={100} onChange={event => { setPathPage(1); setPathSearch(event.target.value); }}/><select className="field mb-3" aria-label={t('status')} value={pathStatus} onChange={event => { setPathPage(1); setPathStatus(event.target.value); }}><option value="all">{t('all')}</option><option value="published">{t('published')}</option><option value="draft">{t('draft')}</option></select>
            {paths.isPending ? (<p className="muted">Loading paths…</p>) : paths.isError ? (<DataState error title="Content service unavailable" description={paths.error.message} retry={() => void paths.refetch()}/>) : !paths.data.items.length ? (<p className="muted">
                No paths yet. Create your first curriculum or load an original starter below.
              </p>) : (<ul className="space-y-2">
                {paths.data.items.map(path => (<li key={path.id}>
                    <button className={`w-full rounded-lg border p-3 text-left ${selected?.id === path.id ? 'border-primary/40 bg-primary/5' : 'border-border hover:bg-accent'}`} onClick={() => edit(path)}>
                      <span className="block text-xs leading-6">{path.title}</span>
                      <span className="mt-1 block font-mono text-[9px] uppercase text-muted-foreground">
                        {path.isPublished ? 'Published' : 'Draft'} · {path.academy}
                      </span>
                    </button>
                  </li>))}
              </ul>)}
            {paths.data && <div className="mt-4 flex justify-between gap-1"><Button size="sm" variant="outline" disabled={pathPage === 1} onClick={() => setPathPage(pathPage - 1)}>{t('previous')}</Button><Button size="sm" variant="outline" disabled={pathPage * 25 >= paths.data.total} onClick={() => setPathPage(pathPage + 1)}>{t('next')}</Button></div>}
          </div>
          <div className="panel p-4">
            <h2 className="mb-3 flex items-center gap-2 text-sm">
              <Download size={15}/>
              Original starter content
            </h2>
            <p className="mb-4 text-xs leading-6 text-muted-foreground">
              Optional original lessons. Loading a template does not save or publish it. Review the
              full content, choose a unique slug, then save.
            </p>
            {templates.isPending ? (<p className="muted">Loading templates…</p>) : templates.isError ? (<p className="muted">Templates are unavailable.</p>) : (templates.data.map(template => (<button key={template.slug} className="mb-2 w-full rounded-lg border border-border p-3 text-left text-xs leading-5 hover:border-primary/40" onClick={() => {
                setSelected(null);
                setForm({ ...template, isPublished: false });
                setModules(JSON.stringify(template.modules, null, 2));
                setError('');
                setMessage('Template loaded as a draft. Review the curriculum before saving.');
            }}>
                  {template.title}
                </button>)))}
          </div>
        </aside>
        <form onSubmit={save} className="panel space-y-5 p-5 sm:p-7">
          <h2 className="text-xl">{selected ? 'Edit learning path' : 'Create learning path'}</h2>
          <div>
            <label htmlFor="path-title" className="mb-2 block text-xs">
              Title
            </label>
            <input id="path-title" className="field" required maxLength={200} value={form.title} onChange={event => set('title', event.target.value)}/>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="path-slug" className="mb-2 block text-xs">
                Stable path slug
              </label>
              <input id="path-slug" className="field font-mono" disabled={!!selected} required value={form.slug} onChange={event => set('slug', event.target.value)}/>
            </div>
            <div>
              <label htmlFor="path-academy" className="mb-2 block text-xs">
                Academy
              </label>
              <select id="path-academy" className="field" value={form.academy} onChange={event => set('academy', event.target.value as PathInput['academy'])}>
                <option value="programming">Programming</option>
                <option value="cybersecurity">Cybersecurity</option>
                <option value="ai">AI Engineering</option>
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="path-description" className="mb-2 block text-xs">
              Summary
            </label>
            <textarea id="path-description" className="field min-h-24" required value={form.description} onChange={event => set('description', event.target.value)}/>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="path-difficulty" className="mb-2 block text-xs">
                Difficulty
              </label>
              <select className="field" id="path-difficulty" value={form.difficulty} onChange={event => set('difficulty', event.target.value as PathInput['difficulty'])}>
                {['Beginner', 'Intermediate', 'Advanced'].map(item => (<option key={item}>{item}</option>))}
              </select>
            </div>
            <div>
              <label htmlFor="path-time" className="mb-2 block text-xs">
                Estimated study time (minutes)
              </label>
              <input className="field" id="path-time" type="number" min={10} max={30000} value={form.estimatedMinutes} onChange={event => set('estimatedMinutes', Number(event.target.value))}/>
            </div>
          </div>
          <div>
            <label htmlFor="path-skills" className="mb-2 block text-xs">
              Skills (comma-separated)
            </label>
            <input id="path-skills" className="field" value={form.skills.join(', ')} onChange={event => set('skills', event.target.value.split(',').map(item => item.trim()))}/>
          </div>
          <div>
            <label htmlFor="path-prerequisites" className="mb-2 block text-xs">
              Prerequisite path slugs (comma-separated)
            </label>
            <input id="path-prerequisites" className="field font-mono" value={form.prerequisites.join(', ')} onChange={event => set('prerequisites', event.target.value
            .split(',')
            .map(item => item.trim())
            .filter(Boolean))}/>
            <p className="mt-2 text-[10px] text-muted-foreground">
              References and circular dependencies are checked by the server.
            </p>
          </div>
          <div>
            <label htmlFor="path-modules" className="mb-2 block text-xs">
              Modules, sections, Markdown lessons & assessments (JSON)
            </label>
            <p className="mb-3 text-xs leading-6 text-muted-foreground">
              Array order defines the roadmap. Each module needs a globally unique slug. Existing
              IDs and slugs must be retained. Each section requires content, objectives, and a
              question with options and a zero-based correctIndex.
            </p>
            <textarea id="path-modules" className="field min-h-[500px] font-mono text-xs leading-6" spellCheck={false} value={modules} onChange={event => {
            setModules(event.target.value);
            setMessage('');
        }}/>
          </div>
          <label className="block text-sm">Category
            <select className="field mt-2" value={form.categoryId ?? ''} onChange={event => set('categoryId', event.target.value || null)} disabled={categories.isPending || categories.isError}>
              <option value="">Uncategorized</option>
              {categories.data?.map(category => <option key={category.id} value={category.id}>{category.name}{category.isActive ? '' : ' (archived)'}</option>)}
            </select>
          </label>
          {categories.isError && <p role="alert" className="muted">Category service unavailable. <button type="button" onClick={() => void categories.refetch()}>Retry</button></p>}
          <label className="flex items-center gap-3 text-sm">
            <input type="checkbox" checked={form.isPublished} onChange={event => set('isPublished', event.target.checked)}/>
            Published and visible to learners
          </label>
          {error && (<p role="alert" className="rounded-lg border border-codekita-warning/30 bg-codekita-warning/5 p-4 text-xs leading-6 text-codekita-warning">
              {error}
            </p>)}
          {message && (<p role="status" className="text-xs leading-6 text-primary">
              {message}
            </p>)}
          <Button disabled={write.isPending} type="submit">
            <Save size={15} className="mr-2"/>
            {write.isPending ? 'Validating and saving…' : 'Save curriculum'}
          </Button>
          {selected && <Button className="ml-3" variant="outline" type="button" disabled={archive.isPending} onClick={() => { if (window.confirm(t('confirmArchivePath'))) archive.mutate(selected.id); }}>Archive path</Button>}
        </form>
      </div>
      <ManagementPanel />
    </div></div></div>);
}
