import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  CheckCircle2,
  List,
  LockKeyhole,
  Save,
  Target,
} from 'lucide-react';
import { academyApi } from '@/lib/academy-api';
import { useAuth } from '@/hooks/useAuth';
import { DataState, ProgressBar } from '@/components/academy/shared';
import { Markdown, tableOfContents } from '@/components/academy/markdown';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { LessonWorkspace } from '@codekita/shared';
import { isStaticFrontend } from '@/lib/mode';
export function LearnPage() {
  const { moduleSlug = '', sectionSlug = '' } = useParams();
  const { user } = useAuth();
  const lesson = useQuery({
    queryKey: ['lesson', user?.userId, moduleSlug, sectionSlug],
    queryFn: () => academyApi.lesson(moduleSlug, sectionSlug),
  });
  if (lesson.isPending)
    return (
      <div
        role="status"
        aria-label="Loading lesson"
        className="h-96 animate-pulse rounded-2xl bg-card"
      />
    );
  if (lesson.isError)
    return (
      <DataState
        error
        title="This lesson is not available yet"
        description={lesson.error.message}
        retry={() => void lesson.refetch()}
      />
    );
  return (
    <Lesson
      key={lesson.data.id}
      data={lesson.data}
      moduleSlug={moduleSlug}
      sectionSlug={sectionSlug}
    />
  );
}
function Lesson({
  data,
  moduleSlug,
  sectionSlug,
}: {
  data: LessonWorkspace;
  moduleSlug: string;
  sectionSlug: string;
}) {
  const client = useQueryClient();
  const [notes, setNotes] = useState(data.notes),
    [bookmarked, setBookmarked] = useState(data.bookmarked),
    [answer, setAnswer] = useState<number>(),
    [sectionsOpen, setSectionsOpen] = useState(false),
    [saved, setSaved] = useState(false);
  const save = useMutation({
    mutationFn: () => academyApi.save(moduleSlug, sectionSlug, notes, bookmarked),
    onSuccess: async () => {
      setSaved(true);
      await client.invalidateQueries({ queryKey: ['lesson'] });
    },
  });
  const complete = useMutation({
    mutationFn: async () => {
      await academyApi.save(moduleSlug, sectionSlug, notes, bookmarked);
      return academyApi.complete(moduleSlug, sectionSlug, answer!);
    },
    onSuccess: async () => {
      setSaved(true);
      await Promise.all([
        client.invalidateQueries({ queryKey: ['learning'] }),
        client.invalidateQueries({ queryKey: ['lesson'] }),
      ]);
    },
  });
  const all = data.modules.flatMap(module =>
    module.lessons.map(section => ({ ...section, moduleSlug: module.slug }))
  );
  const current = all.findIndex(section => section.id === data.id),
    previous = all[current - 1],
    next = all[current + 1],
    completed = data.completed || complete.isSuccess;
  const toc = tableOfContents(data.content ?? '');
  const dirty = !saved && (notes !== data.notes || bookmarked !== data.bookmarked);
  return (
    <div>
      <Link
        to={`/paths/${data.path.slug}`}
        className="mb-6 inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-primary"
      >
        <ArrowLeft size={13} />
        {data.path.title}
      </Link>
      <div className="grid items-start gap-6 xl:grid-cols-[200px_minmax(0,1fr)_190px]">
        <aside className="panel p-4 xl:sticky xl:top-24">
          <button
            className="flex w-full items-center justify-between text-sm xl:pointer-events-none"
            onClick={() => setSectionsOpen(!sectionsOpen)}
            aria-expanded={sectionsOpen}
          >
            <span className="flex items-center gap-2">
              <List size={15} />
              Path sections
            </span>
            <span className="xl:hidden">{sectionsOpen ? '−' : '+'}</span>
          </button>
          <div className={cn('mt-5', sectionsOpen ? 'block' : 'hidden xl:block')}>
            <ProgressBar
              value={all.length ? (data.completedLessonIds.length / all.length) * 100 : 0}
            />
            <p className="mb-6 mt-2 text-[10px] text-muted-foreground">
              {data.completedLessonIds.length} / {all.length} completed
            </p>
            {data.modules.map(module => (
              <div key={module.id} className="mb-5">
                <h2 className="mb-3 text-xs">{module.title}</h2>
                <ul className="space-y-1">
                  {module.lessons.map(section => {
                    const index = all.findIndex(item => item.id === section.id),
                      unlocked =
                        isStaticFrontend ||
                        all
                          .slice(0, index)
                          .every(item => data.completedLessonIds.includes(item.id));
                    return (
                      <li key={section.id}>
                        {unlocked ? (
                          <Link
                            aria-current={section.id === data.id ? 'page' : undefined}
                            to={`/learn/${module.slug}/${section.slug}`}
                            className={cn(
                              'flex items-start gap-2 rounded-md p-2 text-[11px] leading-5',
                              section.id === data.id
                                ? 'bg-primary/10 text-primary'
                                : 'text-muted-foreground hover:bg-accent'
                            )}
                          >
                            {data.completedLessonIds.includes(section.id) ? (
                              <CheckCircle2 className="mt-1 shrink-0" size={12} />
                            ) : (
                              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full border border-current" />
                            )}
                            {section.title}
                          </Link>
                        ) : (
                          <span className="flex gap-2 p-2 text-[11px] leading-5 text-muted-foreground">
                            <LockKeyhole size={12} className="mt-1 shrink-0" />
                            {section.title}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </aside>
        <article className="min-w-0">
          <p className="eyebrow mb-3">
            Section {String(current + 1).padStart(2, '0')} / {all.length}
          </p>
          <h1 className="text-3xl leading-tight sm:text-4xl">{data.title}</h1>
          <div className="my-7 rounded-xl border border-codekita-secondary/20 bg-codekita-secondary/5 p-5">
            <h2 className="mb-3 flex items-center gap-2 text-sm">
              <Target size={16} className="text-codekita-secondary" />
              What you’ll learn
            </h2>
            {data.objectives.length ? (
              <ul className="space-y-2">
                {data.objectives.map(objective => (
                  <li
                    key={objective}
                    className="flex gap-2 text-xs leading-6 text-muted-foreground"
                  >
                    <CheckCircle2 size={13} className="mt-1.5 shrink-0 text-codekita-secondary" />
                    {objective}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">
                Read the section and demonstrate your understanding in the knowledge check.
              </p>
            )}
          </div>
          <Markdown content={data.content ?? 'Content is being prepared by your instructor.'} />
          <section className="panel mt-10 p-6">
            <p className="eyebrow mb-3">Validate your understanding</p>
            <h2 className="mb-5 text-xl">Knowledge check</h2>
            {data.assessment ? (
              <fieldset disabled={completed || complete.isPending} className="space-y-3">
                <legend className="mb-4 text-sm leading-7">{data.assessment.question}</legend>
                {data.assessment.options.map((option, index) => (
                  <label
                    key={index}
                    className={cn(
                      'flex cursor-pointer gap-3 rounded-lg border p-4 text-sm leading-6',
                      answer === index ? 'border-primary/50 bg-primary/5' : 'border-border'
                    )}
                  >
                    <input
                      className="mt-1 accent-[rgb(var(--ck-primary))]"
                      type="radio"
                      name="assessment"
                      checked={answer === index}
                      onChange={() => setAnswer(index)}
                    />
                    {option}
                  </label>
                ))}
              </fieldset>
            ) : (
              <p className="muted">
                An instructor needs to configure this assessment. Completion is disabled rather than
                bypassed.
              </p>
            )}
            {completed ? (
              <p role="status" className="mt-5 flex items-center gap-2 text-sm text-primary">
                <CheckCircle2 size={17} />
                Section completed
                {complete.data?.xpAwarded ? ` · +${complete.data.xpAwarded} XP` : ''}
              </p>
            ) : (
              <Button
                className="mt-5"
                disabled={
                  isStaticFrontend || !data.assessment || answer === undefined || complete.isPending
                }
                onClick={() => complete.mutate()}
              >
                {complete.isPending ? 'Validating…' : 'Mark complete & validate'}
                <CheckCircle2 size={15} className="ml-2" />
              </Button>
            )}
            {complete.isError && (
              <p role="alert" className="mt-4 text-sm text-codekita-warning">
                {complete.error.message}
              </p>
            )}
          </section>
          <section className="panel mt-6 p-5 xl:hidden">
            <label className="mb-3 block text-sm" htmlFor="mobile-notes">
              Your notes
            </label>
            <textarea
              id="mobile-notes"
              className="field min-h-32"
              value={notes}
              maxLength={20000}
              onChange={event => {
                setNotes(event.target.value);
                setSaved(false);
              }}
            />
            <label className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={bookmarked}
                onChange={event => {
                  setBookmarked(event.target.checked);
                  setSaved(false);
                }}
              />
              Bookmark this lesson
            </label>
          </section>
          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6">
            {previous ? (
              <Button variant="outline" asChild>
                <Link to={`/learn/${previous.moduleSlug}/${previous.slug}`}>
                  <ArrowLeft className="mr-2" size={14} />
                  Previous
                </Link>
              </Button>
            ) : (
              <span />
            )}
            <Button
              variant="outline"
              disabled={isStaticFrontend || save.isPending}
              onClick={() => save.mutate()}
            >
              <Save size={14} className="mr-2" />
              {save.isPending ? 'Saving…' : 'Save progress'}
            </Button>
            {next && (completed || isStaticFrontend) ? (
              <Button asChild>
                <Link to={`/learn/${next.moduleSlug}/${next.slug}`}>
                  Next section
                  <ArrowRight size={14} className="ml-2" />
                </Link>
              </Button>
            ) : (
              <Button disabled={!!next} asChild={!next}>
                {next ? (
                  'Complete to continue'
                ) : (
                  <Link to={`/paths/${data.path.slug}`}>Back to roadmap</Link>
                )}
              </Button>
            )}
          </div>
          <p className="mt-3 text-xs text-muted-foreground" role="status">
            {isStaticFrontend
              ? 'Demo preview: notes and progress are not saved.'
              : save.isError
                ? save.error.message
                : dirty
                  ? 'You have unsaved notes or bookmark changes.'
                  : saved
                    ? 'Your changes are saved to your account.'
                    : 'Notes and bookmarks are saved when you choose Save progress or validate completion.'}
          </p>
        </article>
        <aside className="sticky top-24 hidden space-y-7 xl:block">
          <div>
            <h2 className="mb-4 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              On this page
            </h2>
            <nav
              aria-label="Lesson table of contents"
              className="space-y-3 border-l border-border pl-4"
            >
              {toc.map(item => (
                <a
                  href={`#${item.id}`}
                  className="block text-xs leading-5 text-muted-foreground hover:text-primary"
                  key={item.id}
                >
                  {item.title}
                </a>
              ))}
            </nav>
          </div>
          <div className="border-t border-border pt-5">
            <label
              className="mb-3 flex items-center justify-between text-xs"
              htmlFor="lesson-notes"
            >
              Your notes
              <Save size={13} className="text-muted-foreground" />
            </label>
            <textarea
              id="lesson-notes"
              className="field min-h-48 text-xs leading-6"
              placeholder="Connect the dots. Write it in your own words…"
              maxLength={20000}
              value={notes}
              onChange={event => {
                setNotes(event.target.value);
                setSaved(false);
              }}
            />
            <button
              className={cn(
                'mt-3 flex items-center gap-2 text-xs',
                bookmarked ? 'text-primary' : 'text-muted-foreground'
              )}
              aria-pressed={bookmarked}
              onClick={() => {
                setBookmarked(!bookmarked);
                setSaved(false);
              }}
            >
              <Bookmark size={14} />
              {bookmarked ? 'Bookmarked' : 'Bookmark lesson'}
            </button>
            <p className="mt-4 text-[10px] leading-5 text-muted-foreground">
              {isStaticFrontend ? (
                'Example notes are not saved.'
              ) : (
                <>
                  Private to your account.
                  <br />
                  Save progress to keep your notes.
                </>
              )}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
