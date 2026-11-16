import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Code2,
  GitBranch,
  Layers3,
  LockKeyhole,
  Play,
  ShieldCheck,
  Sparkles,
  Target,
  Terminal,
  Users,
  Zap,
} from 'lucide-react';
import { academyApi } from '@/lib/academy-api';
import { useAuth } from '@/hooks/useAuth';
import { Reveal } from '@/components/motion';
import { Button } from '@/components/ui/button';
import { academies, CardSkeletons, DataState, PathCard } from '@/components/academy/shared';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import {
  BuilderIllustration,
  SkillsSection,
  EcosystemSection,
  ProductsSection,
  SolutionsSection,
  BenefitsSection,
  ClosingSection,
} from '@/components/home-sections';

function LearningPreview() {
  const { t } = useTranslation('common');
  const [answer, setAnswer] = useState<number>();
  return (
    <div className="panel overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3">
        <span className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
          <Terminal size={15} />
          interactive-preview.js
        </span>
        <span className="rounded bg-primary/10 px-2 py-1 text-[10px] font-medium text-primary">
          {t('homePreviewTry')}
        </span>
      </div>
      <div className="grid md:grid-cols-2">
        <div className="min-w-0 bg-background/50 p-5 sm:p-8">
          <p className="mb-6 font-mono text-xs text-muted-foreground">
            01 <span className="ml-4 text-codekita-purple">// {t('homePreviewComment')}</span>
          </p>
          <pre className="overflow-x-auto font-mono text-sm leading-8">
            <code>
              <span className="text-codekita-purple">const</span> skills = [
              <span className="text-primary">&quot;learn&quot;</span>,{' '}
              <span className="text-primary">&quot;build&quot;</span>];{'\n\n'}
              <span className="text-codekita-purple">const</span> journey = skills.
              <span className="text-codekita-secondary">map</span>({'\n'} skill =&gt; skill.
              <span className="text-codekita-secondary">toUpperCase</span>(){'\n'});
            </code>
          </pre>
          <div className="mt-8 flex items-center gap-2 text-xs text-muted-foreground">
            <LockKeyhole size={13} />
            {t('homePreviewNotice')}
          </div>
        </div>
        <div className="min-w-0 border-t border-border p-5 sm:p-8 md:border-l md:border-t-0">
          <p className="eyebrow mb-3">{t('homePreviewEyebrow')}</p>
          <h3 className="mb-5 text-lg">{t('homePreviewQuestion')}</h3>
          <fieldset className="min-w-0 space-y-3">
            <legend className="sr-only">{t('homePreviewLegend')}</legend>
            {['["LEARN", "BUILD"]', '["learn", "build"]', '"LEARN BUILD"'].map((option, index) => (
              <label
                key={option}
                className={cn(
                  'flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border p-3 font-mono text-xs transition-colors',
                  answer === index
                    ? 'border-primary/60 bg-primary/5'
                    : 'border-border hover:border-muted-foreground'
                )}
              >
                <input
                  type="radio"
                  name="preview"
                  checked={answer === index}
                  onChange={() => setAnswer(index)}
                  className="shrink-0 accent-[rgb(var(--ck-primary))]"
                />
                <span className="break-all">{option}</span>
              </label>
            ))}
          </fieldset>
          <p className="mt-4 min-h-10 text-xs leading-5 text-muted-foreground" aria-live="polite">
            {answer === undefined
              ? t('homePreviewHint')
              : answer === 0
                ? t('homePreviewCorrect')
                : t('homePreviewIncorrect')}
          </p>
        </div>
      </div>
    </div>
  );
}
function HeroWorkspace() {
  const { t } = useTranslation('common');
  return (
    <div className="relative mx-auto w-full max-w-xl lg:ml-0">
      <div className="panel relative overflow-hidden shadow-ck-lg">
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div aria-hidden="true" className="flex shrink-0 gap-1.5">
            {[1, 2, 3].map(item => (
              <span key={item} className="h-2 w-2 rounded-full bg-border" />
            ))}
          </div>
          <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-primary" />
            {t('homeWorkspaceLabel')}
          </span>
          <LockKeyhole aria-hidden="true" size={12} className="shrink-0 text-muted-foreground" />
        </div>
        <div className="grid grid-cols-1 min-[400px]:grid-cols-[42px_minmax(0,1fr)] sm:grid-cols-[48px_minmax(0,1fr)]">
          <div
            aria-hidden="true"
            className="hidden flex-col items-center gap-5 border-r border-border bg-background/30 py-6 min-[400px]:flex"
          >
            {[Terminal, Layers3, GitBranch, Target].map((Icon, index) => (
              <div
                key={index}
                className={cn(
                  'rounded-lg p-2',
                  index === 1 ? 'bg-primary/10 text-primary' : 'text-muted-foreground'
                )}
              >
                <Icon size={16} />
              </div>
            ))}
          </div>
          <div className="min-w-0 p-4 sm:p-5">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                {t('homeWorkspaceOverview')}
              </p>
              <span className="rounded border border-border px-2 py-1 text-[10px] text-muted-foreground">
                {t('homeWorkspacePreview')}
              </span>
            </div>
            <div className="mb-5 flex items-center gap-3">
              <span className="shrink-0 rounded-xl border border-primary/20 bg-primary/10 p-3 text-primary">
                <Code2 aria-hidden="true" size={24} />
              </span>
              <div>
                <p className="mb-1 text-[10px] uppercase text-primary">Programming Academy</p>
                <p className="text-base font-semibold sm:text-lg">{t('homeWorkspaceTitle')}</p>
              </div>
            </div>
            <div>
              {[
                {
                  title: t('homeWorkspaceStep1'),
                  description: t('homeWorkspaceStep1Description'),
                  icon: Check,
                  active: false,
                },
                {
                  title: t('homeWorkspaceStep2'),
                  description: t('homeWorkspaceStep2Description'),
                  icon: Play,
                  active: true,
                },
                {
                  title: t('homeWorkspaceStep3'),
                  description: t('homeWorkspaceStep3Description'),
                  icon: LockKeyhole,
                  active: false,
                },
              ].map((step, index) => (
                <div key={step.title} className="relative flex gap-3 pb-5 last:pb-0">
                  {index < 2 && (
                    <span className="absolute bottom-0 left-[15px] top-8 w-px bg-border" />
                  )}
                  <span
                    className={cn(
                      'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border',
                      step.active
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-card text-muted-foreground'
                    )}
                  >
                    <step.icon aria-hidden="true" size={13} />
                  </span>
                  <div
                    className={cn(
                      'min-w-0 flex-1 rounded-lg p-3 pt-1',
                      step.active && 'border border-primary/25 bg-primary/5 pt-3'
                    )}
                  >
                    <p className="text-xs font-medium sm:text-sm">{step.title}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">{step.description}</p>
                    {step.active && (
                      <div className="mt-3 flex items-center gap-2 text-[10px] uppercase text-primary">
                        <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-primary" />
                        {t('homeWorkspaceNext')}
                        <ArrowRight aria-hidden="true" size={12} className="ml-auto shrink-0" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 flex items-center gap-2 border-t border-border pt-4 font-mono text-[10px] text-muted-foreground">
              <ShieldCheck size={13} className="text-codekita-secondary" />
              <span>
                $ curriculum --status: ready
                <span aria-hidden="true" className="terminal-cursor" />
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="relative mx-3 -mt-2 flex items-center gap-3 rounded-xl border border-border bg-codekita-surface-elevated px-4 py-3 shadow-ck-lg sm:absolute sm:-bottom-5 sm:right-4 sm:mx-0 sm:max-w-[calc(100%-2rem)]">
        <span className="rounded-lg bg-codekita-purple/10 p-2 text-codekita-purple">
          <Sparkles aria-hidden="true" size={17} />
        </span>
        <div>
          <p className="text-xs font-medium">{t('homeWorkspaceBadge')}</p>
          <p className="mt-0.5 text-[10px] text-muted-foreground">
            {t('homeWorkspaceBadgeDescription')}
          </p>
        </div>
      </div>
    </div>
  );
}
function CatalogueSection() {
  const { t } = useTranslation('courses');
  const { t: home } = useTranslation('common');
  const paths = useQuery({ queryKey: ['paths'], queryFn: academyApi.paths });
  return (
    <section className="border-y border-border bg-card/30 py-20">
      <div className="page-container">
        <div className="mb-9 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow mb-3">{home('homeCatalogueEyebrow')}</p>
            <h2 className="section-heading">{home('homeCatalogueTitle')}</h2>
          </div>
          <Link to="/paths" className="flex items-center gap-2 text-sm text-primary">
            {home('homeCatalogueExplore')} <ArrowRight aria-hidden="true" size={16} />
          </Link>
        </div>
        {paths.isPending ? (
          <CardSkeletons />
        ) : paths.isError ? (
          <DataState
            error
            title={t('catalogueErrorTitle')}
            description={t('catalogueErrorDescription')}
            retry={() => void paths.refetch()}
          />
        ) : paths.data.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {paths.data.slice(0, 3).map(path => (
              <PathCard key={path.id} path={path} />
            ))}
          </div>
        ) : (
          <DataState title={t('noPathsFound')} description={t('emptyCatalogue')} />
        )}
      </div>
    </section>
  );
}
export function HomePage() {
  const { user } = useAuth();
  const { t } = useTranslation('common');
  return (
    <>
      <section
        aria-labelledby="home-heading"
        className="relative isolate overflow-hidden border-b border-[#26364b] bg-[#0b111d] text-[#f8fafc]"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,#0b111d_30%,#111b2b_70%,#202c3f_100%)]"
        />
        <svg
          aria-hidden="true"
          focusable="false"
          viewBox="0 0 1440 800"
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-0 h-full w-full"
          fill="none"
        >
          <path d="M1080 0H1440V800H640Z" fill="#91a9c9" fillOpacity=".035" />
          <path d="M1320 0 880 800M1000 0 560 800" stroke="#91a9c9" strokeOpacity=".08" />
        </svg>
        <div className="page-container relative grid items-center gap-6 pb-10 pt-14 sm:gap-10 sm:py-20 lg:min-h-[720px] lg:grid-cols-[1.08fr_1fr] lg:gap-10 lg:py-16">
          <div className="min-w-0">
            <div>
              <p className="mb-7 flex items-center gap-3 font-mono text-xs font-medium uppercase tracking-[0.2em] text-primary">
                <span aria-hidden="true" className="h-px w-9 shrink-0 bg-primary" />
                {t('homeEyebrow')}
              </p>
              <h1
                id="home-heading"
                lang="en"
                className="max-w-2xl text-[clamp(2.5rem,5.3vw,4.5rem)] font-semibold leading-[1.06] tracking-[-0.045em]"
              >
                Build Your Future <span className="block text-primary">in Technology</span>
              </h1>
              <p className="mt-7 max-w-xl text-base leading-7 text-[#b3c3d8] sm:text-lg sm:leading-8">
                {t('homeHeroDescription')}
              </p>
              <div className="mt-9 flex flex-col gap-3 min-[480px]:flex-row min-[480px]:flex-wrap">
                <Button size="lg" className="min-h-14 px-6" asChild>
                  <Link to={user ? '/paths' : '/register'}>
                    {t('footerStartLearning')}
                    <ArrowRight aria-hidden="true" size={16} className="ml-3" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="min-h-14 border-[#34445b] bg-[#202c3f]/50 px-6 text-white hover:bg-[#2a3a50] hover:text-white"
                  asChild
                >
                  <Link to="/#academies">{t('homeHeroExplore')}</Link>
                </Button>
              </div>
              <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-3 text-xs leading-5 text-slate-300">
                {[
                  { icon: GitBranch, label: 'homeBenefitPaths' },
                  { icon: Terminal, label: 'homeBenefitPractice' },
                  { icon: Target, label: 'homeBenefitProgress' },
                ].map(item => (
                  <li key={item.label} className="flex items-center gap-2">
                    <item.icon aria-hidden="true" size={14} className="text-primary" />
                    {t(item.label)}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <Reveal delay={100}>
            <div className="relative isolate flex min-h-[320px] items-center justify-center py-12 sm:min-h-[460px] lg:min-h-[560px]">
              <svg
                aria-hidden="true"
                focusable="false"
                viewBox="0 0 600 600"
                className="pointer-events-none absolute inset-0 h-full w-full"
                fill="none"
              >
                <defs>
                  <linearGradient
                    id="hero-facet"
                    x1="80"
                    y1="60"
                    x2="520"
                    y2="540"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="#33445b" />
                    <stop offset="1" stopColor="#0b111d" />
                  </linearGradient>
                  <pattern id="hero-dots" width="16" height="16" patternUnits="userSpaceOnUse">
                    <circle cx="2" cy="2" r="1" fill="#91a9c9" opacity=".35" />
                  </pattern>
                </defs>
                <path d="M300 20 580 300 300 580 20 300Z" fill="url(#hero-facet)" opacity=".65" />
                <path d="M300 56 544 300 300 544 56 300Z" stroke="#91a9c9" strokeOpacity=".25" />
                <path d="M300 95 505 300 300 505 95 300Z" stroke="#b8f34a" strokeOpacity=".38" />
                <path d="M300 20 580 300 300 580 20 300Z" fill="url(#hero-dots)" />
                <path d="M60 385 385 60M215 545 545 215" stroke="#b8f34a" strokeOpacity=".35" />
              </svg>
              <BuilderIllustration className="relative w-full max-w-[620px]" />
            </div>
          </Reveal>
        </div>
      </section>
      <SkillsSection />
      <EcosystemSection />
      <ProductsSection />
      <SolutionsSection />
      <BenefitsSection />
      <section
        aria-labelledby="academies-heading"
        className="page-container scroll-mt-24 py-16 sm:py-24"
      >
        <div className="mb-10 flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="eyebrow mb-3">{t('homeAcademyEyebrow')}</p>
            <h2 id="academies-heading" className="section-heading">
              {t('homeAcademyTitle')}
            </h2>
          </div>
          <p className="muted max-w-sm">{t('homeAcademyIntro')}</p>
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          {Object.entries(academies).map(([key, academy], index) => (
            <Reveal key={key} delay={index * 65} className="h-full">
              <Link
                to={`/paths?academy=${key}`}
                className="panel motion-card group relative flex h-full flex-col overflow-hidden border-[#2b3b50] bg-[#111b2b] p-6 sm:p-8 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
              >
                <svg
                  aria-hidden="true"
                  focusable="false"
                  viewBox="0 0 200 150"
                  className={cn(
                    'pointer-events-none absolute right-0 top-0 h-40 w-52 opacity-10',
                    academy.color
                  )}
                  fill="none"
                >
                  <path d="M110 -25 210 75 110 175 10 75Z" stroke="currentColor" />
                  <path d="M140 -25 240 75 140 175 40 75Z" stroke="currentColor" />
                  <path d="M170 -25 270 75 170 175 70 75Z" fill="currentColor" fillOpacity=".3" />
                </svg>
                <span
                  className={cn(
                    'relative mb-8 inline-flex w-fit rounded-xl border border-border p-3',
                    academy.color,
                    academy.background
                  )}
                >
                  <academy.icon size={28} strokeWidth={1.7} aria-hidden="true" />
                </span>
                <ArrowUpRight
                  size={17}
                  aria-hidden="true"
                  className="motion-arrow absolute right-7 top-7 text-muted-foreground"
                />
                <h3 className="relative text-2xl">{academy.name}</h3>
                <p className="mt-4 flex-1 text-sm leading-7 text-[#b3c3d8]">
                  {t(`homeAcademyDescription-${key}`)}
                </p>
                <ul className="mt-6 flex flex-wrap gap-2">
                  {academy.tags.map(tag => (
                    <li
                      key={tag}
                      className="rounded-md border border-border bg-background/30 px-2.5 py-1.5 text-[11px] text-slate-300"
                    >
                      {tag}
                    </li>
                  ))}
                </ul>
                <span
                  className={cn(
                    'mt-8 flex items-center gap-2 border-t border-[#2b3b50] pt-5 text-sm font-medium',
                    academy.color
                  )}
                >
                  {t('homeExploreAcademy')} <ArrowRight size={16} aria-hidden="true" />
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>
      <CatalogueSection />
      <section
        aria-labelledby="approach-heading"
        className="page-container scroll-mt-24 py-20 sm:py-24"
      >
        <div className="mb-12 text-center">
          <p className="eyebrow mb-3">{t('homeApproachEyebrow')}</p>
          <h2 id="approach-heading" className="section-heading">
            {t('homeApproachTitle')}
          </h2>
          <p className="muted mt-4">{t('homeApproachDescription')}</p>
        </div>
        <div className="mb-16 grid gap-8 md:grid-cols-3">
          {[
            {
              icon: GitBranch,
              title: t('homeApproachStep1'),
              text: t('homeApproachStep1Description'),
            },
            {
              icon: Terminal,
              title: t('homeApproachStep2'),
              text: t('homeApproachStep2Description'),
            },
            {
              icon: Target,
              title: t('homeApproachStep3'),
              text: t('homeApproachStep3Description'),
            },
          ].map((step, index) => (
            <div key={step.title} className="relative border-t border-border pt-6">
              <span className="absolute -top-3 right-0 bg-background pl-3 font-mono text-xs text-muted-foreground">
                0{index + 1}
              </span>
              <step.icon size={24} className="mb-5 text-primary" />
              <h3 className="mb-3 text-lg">{step.title}</h3>
              <p className="muted max-w-sm">{step.text}</p>
            </div>
          ))}
        </div>
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow mb-3">{t('homeInteractiveEyebrow')}</p>
            <h2 className="section-heading">{t('homeInteractiveTitle')}</h2>
          </div>
          <p className="muted max-w-xs">{t('homeInteractiveDescription')}</p>
        </div>
        <div className="grid items-start gap-10 lg:grid-cols-[1fr_1.2fr]">
          <HeroWorkspace />
          <LearningPreview />
        </div>
      </section>
      <section className="page-container pb-20">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="panel p-7 sm:p-9">
            <span className="mb-5 inline-flex rounded-xl bg-codekita-secondary/10 p-3 text-codekita-secondary">
              <ShieldCheck size={24} />
            </span>
            <p className="eyebrow mb-3">{t('homeLabsEyebrow')}</p>
            <h2 className="text-2xl">{t('homeLabsTitle')}</h2>
            <p className="muted mt-4">{t('homeLabsDescription')}</p>
            <div className="mt-6 space-y-3">
              {['homeLabProgramming', 'homeLabCybersecurity', 'homeLabAi'].map(
                (challenge, index) => (
                  <Link
                    key={challenge}
                    to={`/labs?academy=${['programming', 'cybersecurity', 'ai'][index]}`}
                    className="flex flex-wrap items-center gap-3 rounded-lg border border-border p-3 text-sm transition-colors hover:border-primary/40"
                  >
                    <Code2
                      aria-hidden="true"
                      size={15}
                      className="shrink-0 text-muted-foreground"
                    />
                    <span className="min-w-0 flex-1 basis-32">{t(challenge)}</span>
                    <span className="ml-auto text-[10px] text-muted-foreground">
                      {t('homePreviewLabel')}
                    </span>
                    <ArrowUpRight aria-hidden="true" size={14} className="shrink-0" />
                  </Link>
                )
              )}
            </div>
          </div>
          <div className="panel flex flex-col p-7 sm:p-9">
            <span className="mb-5 inline-flex w-fit rounded-xl bg-codekita-purple/10 p-3 text-codekita-purple">
              <Users size={24} />
            </span>
            <p className="eyebrow mb-3">{t('homeCommunityEyebrow')}</p>
            <h2 className="text-2xl">{t('homeCommunityTitle')}</h2>
            <p className="muted mt-4">{t('homeCommunityDescription')}</p>
            <div className="my-7 grid grid-cols-1 gap-3 min-[400px]:grid-cols-3">
              {[
                { icon: Zap, text: t('homeCommunityXp') },
                { icon: Target, text: t('homeCommunityMilestones') },
                { icon: ShieldCheck, text: t('homeCommunityCertificates') },
              ].map(item => (
                <div className="rounded-xl border border-border p-3 text-center" key={item.text}>
                  <item.icon className="mx-auto mb-3 text-codekita-purple" size={22} />
                  <span className="text-[10px] text-muted-foreground">{item.text}</span>
                </div>
              ))}
            </div>
            <Link
              to="/leaderboard"
              className="mt-auto flex items-center gap-2 text-sm text-primary"
            >
              {t('homeCommunityExplore')}
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
      <ClosingSection signedIn={!!user} />
    </>
  );
}
