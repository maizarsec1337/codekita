import { useState } from "react";
import { useTranslation } from "react-i18next";
import * as Tabs from "@radix-ui/react-tabs";
import { Link } from "react-router-dom";
import { ArrowRight, Award, BookOpen, BrainCircuit, Check, ChevronDown, ChevronRight, Clock3, Code2, Flame, Layers3, Play, ShieldCheck, Sparkles, Target, Trophy, Zap } from "lucide-react";
import type { Academy, PathDetail } from "@codekita/shared";
import { demoDashboard, demoPath, demoPaths } from "@/data/static-demo";
import "./demo-dashboard.css";

const categories = {
  programming: { name: "Programming Fundamentals", label: "Programming", icon: Code2 },
  cybersecurity: { name: "Cybersecurity Fundamentals", label: "Cybersecurity", icon: ShieldCheck },
  ai: { name: "AI Engineering Fundamentals", label: "AI Engineering", icon: BrainCircuit },
} satisfies Record<Academy, { name: string; label: string; icon: typeof Code2 }>;

// Fictional completion is intentionally separate from the shared, unsaved demo account.
const exampleCompletedLessons = new Set([
  "how-the-web-works/request-and-response",
  "security-mindset/scope-and-authorization",
]);
const paths = demoPaths.map((path) => demoPath(path.slug));
const completedCount = (path: PathDetail) => path.modules.flatMap((module) => module.lessons.map((lesson) => `${module.slug}/${lesson.slug}`)).filter((id) => exampleCompletedLessons.has(id)).length;
const percentage = (completed: number, total: number) => total ? Math.round(completed / total * 100) : 0;
const pathProgress = (path: PathDetail) => percentage(completedCount(path), path.lessonCount);
const totalLessons = paths.reduce((total, path) => total + path.lessonCount, 0);
const totalCompleted = paths.reduce((total, path) => total + completedCount(path), 0);
const completedModules = paths.flatMap((path) => path.modules).filter((module) => module.lessons.every((lesson) => exampleCompletedLessons.has(`${module.slug}/${lesson.slug}`))).length;
const lessonLink = (module: PathDetail["modules"][number]) => `/learn/${module.slug}/${(module.lessons.find((lesson) => !exampleCompletedLessons.has(`${module.slug}/${lesson.slug}`)) ?? module.lessons[0]).slug}`;

function Progress({ value, label }: { value: number; label: string }) {
  return <div className="demo-progress" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={value}><span style={{ width: `${value}%` }} /></div>;
}

function ModuleRow({ path, module }: { path: PathDetail; module: PathDetail["modules"][number] }) {
  const { t } = useTranslation(["dashboard", "courses"]);
  const Icon = categories[path.academy].icon;
  const progress = percentage(module.lessons.filter((lesson) => exampleCompletedLessons.has(`${module.slug}/${lesson.slug}`)).length, module.lessons.length);
  return <Link to={lessonLink(module)} className="demo-module group">
    <span className={`demo-module-icon demo-icon-${path.academy}`}><Icon size={19} /></span>
    <span className="demo-module-info"><span className="demo-overline">{categories[path.academy].label}</span><span className="demo-module-title">{t(`courses:${module.slug}`, { defaultValue: module.title })}</span><span className="demo-module-progress"><Progress value={progress} label={t("progress", { name: t(`courses:${module.slug}`, { defaultValue: module.title }) })} /><span>{progress}%</span></span></span>
    <ChevronRight size={17} className="demo-module-arrow" />
  </Link>;
}

function PathCard({ path, initiallyOpen }: { path: PathDetail; initiallyOpen: boolean }) {
  const { t } = useTranslation(["dashboard", "courses"]);
  const [open, setOpen] = useState(initiallyOpen);
  const category = categories[path.academy];
  const Icon = category.icon;
  const progress = pathProgress(path);
  const nextModule = path.modules.find((module) => module.lessons.some((lesson) => !exampleCompletedLessons.has(`${module.slug}/${lesson.slug}`))) ?? path.modules[0];
  const panelId = `modules-${path.slug}`;
  return <article className="demo-card demo-path">
    <div className="demo-path-content">
      <div className="demo-path-top"><div className={`demo-path-art demo-icon-${path.academy}`}><span className="demo-art-mark">CK / 0{paths.indexOf(path) + 1}</span><Icon size={36} strokeWidth={1.4} /><span className="demo-art-bottom">{t("LEARNING PATH")}</span></div>
        <div className="demo-path-heading"><div className="demo-path-labels"><span className="demo-status"><span /> {t("ENROLLED · EXAMPLE")}</span><span className="demo-overline">{category.label}</span></div><h3>{t(category.name)}</h3><p>{path.title !== category.name ? `${t(`courses:${path.slug}`, { defaultValue: path.title })} · ` : ""}{t(`courses:${path.academy === "programming" ? "web" : path.academy === "cybersecurity" ? "cyber" : "ai"}-description`, { defaultValue: path.description ?? "" })}</p><div className="demo-meta"><span><Target size={14} />{t(path.difficulty)}</span><span><Clock3 size={14} />{Math.floor(path.estimatedMinutes / 60)}h {path.estimatedMinutes % 60 ? `${path.estimatedMinutes % 60}m` : ""}</span><span><Layers3 size={14} />{t("modules", { count: path.moduleCount })}</span></div></div>
      </div>
      <div className="demo-path-progress"><div><span>{t("PATH PROGRESS")}</span><strong>{progress}%</strong></div><Progress value={progress} label={t("progress", { name: t(category.name) })} /><p>{t("lessonsComplete", { completed: completedCount(path), total: path.lessonCount })}</p></div>
      <div className="demo-actions"><Link className="demo-button demo-button-primary" to={lessonLink(nextModule)}><Play size={15} fill="currentColor" />{t("Continue learning")}</Link><Link className="demo-button demo-button-secondary" to={`/paths/${path.slug}`}>{t("View full path")} <ArrowRight size={15} /></Link></div>
    </div>
    <button type="button" className="demo-expand" aria-expanded={open} aria-controls={panelId} onClick={() => setOpen(!open)}><span>{t(open ? "Hide modules" : "Show modules")} <span className="demo-count">{path.moduleCount}</span></span><ChevronDown size={16} className={open ? "demo-chevron-open" : ""} /></button>
    <div id={panelId} hidden={!open} className="demo-module-list">{path.modules.map((module) => <ModuleRow key={module.slug} path={path} module={module} />)}</div>
  </article>;
}

function ProfileSidebar() {
  const { t } = useTranslation(["dashboard", "courses"]);
  const ranks = ["Beginner", "Explorer", "Developer", "Specialist", "Expert"];
  return <aside className="demo-sidebar" aria-label={t("Example learner statistics")}>
    <section className="demo-card demo-profile"><div className="demo-card-heading"><span>{t("LEARNER PROFILE")}</span><Link to="/profile">{t("View profile")} <ArrowRight size={13} /></Link></div><div className="demo-profile-person"><div className="demo-avatar">DK<span><Check size={10} strokeWidth={3} /></span></div><div><h2>{t("Demo learner")}</h2><p>@demo_learner</p><span className="demo-level">{t("LEVEL")} {demoDashboard.level} · {t(ranks[demoDashboard.level - 1]).toUpperCase()}</span></div></div><div className="demo-profile-stats"><div><span>{t("TOTAL XP")}</span><strong><Zap size={16} />{demoDashboard.xp.toLocaleString()}</strong></div><div><span>{t("CURRENT RANK")}</span><strong><Trophy size={16} />{t(ranks[demoDashboard.level - 1])}</strong></div></div><div className="demo-profile-progress"><div><span>{t("Overall academy progress")}</span><strong>{percentage(totalCompleted, totalLessons)}%</strong></div><Progress value={percentage(totalCompleted, totalLessons)} label={t("Overall academy progress")} /><p>{t("exampleLessonsComplete", { completed: totalCompleted, total: totalLessons })}</p></div></section>
    <section className="demo-card demo-side-section"><div className="demo-section-title"><div><span className="demo-side-icon demo-flame"><Flame size={17} /></span><h2>{t("Weekly streak")}</h2></div><span className="demo-subtle-tag">{t("EXAMPLE")}</span></div><div className="demo-streak-number">{demoDashboard.streak} <span>{t("day streak")}</span> <Flame size={19} /></div><p className="demo-small-copy">{t("A little progress, every day. Keep it going!")}</p><div className="demo-week" aria-label={t("Example activity: Monday, Tuesday and Wednesday")}><span className="active">M<Check size={12} /></span><span className="active">T<Check size={12} /></span><span className="active">W<Check size={12} /></span><span>T<i /></span><span>F<i /></span><span>S<i /></span><span>S<i /></span></div></section>
    <section className="demo-card demo-side-section"><div className="demo-section-title"><div><span className="demo-side-icon demo-purple"><Award size={17} /></span><h2>{t("Achievements")}</h2></div><Link to="/achievements">{t("View all")} <ArrowRight size={13} /></Link></div><div className="demo-achievement"><span><Sparkles size={20} /></span><div><strong>{t("First steps")}</strong><p>{t("Every journey starts somewhere.")}</p></div><span className="demo-earned">{t("EARNED")}</span></div></section>
    <section className="demo-card demo-side-section"><div className="demo-section-title"><div><span className="demo-side-icon"><Layers3 size={17} /></span><h2>{t("Category progress")}</h2></div></div><p className="demo-small-copy">{t("Your example progress across academies.")}</p><div className="demo-categories">{paths.map((path) => { const category = categories[path.academy]; const Icon = category.icon; const progress = pathProgress(path); return <div className="demo-category" key={path.slug}><span className={`demo-category-icon demo-icon-${path.academy}`}><Icon size={17} /></span><div><div className="demo-category-label"><span>{category.label}</span><strong>{progress}%</strong></div><Progress value={progress} label={t("progress", { name: category.label })} /></div></div>; })}</div><div className="demo-side-footer"><span><BookOpen size={14} /> {t("completedModules", { count: completedModules })}</span><span>{t("Example data")}</span></div></section>
  </aside>;
}

export function DemoDashboard() {
  const { t } = useTranslation(["dashboard", "courses"]);
  return <div className="demo-dashboard"><div className="demo-heading"><div><div className="demo-heading-kicker"><span /> {t("YOUR LEARNING SPACE")}</div><h1>{t("Welcome back, learner")}<span>.</span></h1><p>{t("Ready to pick up where you left off? Your next step is waiting.")}</p></div><Link to="/paths" className="demo-explore">{t("Explore learning paths")} <ArrowRight size={16} /></Link></div>
    <div className="demo-notice"><Sparkles size={16} /><span><strong>{t("Preview your learning journey.")}</strong> {t("All enrollments, progress and achievements below are examples and are not saved.")}</span></div>
    <div className="demo-grid"><div className="demo-main"><Tabs.Root defaultValue="paths"><div className="demo-tabs-header"><Tabs.List className="demo-tabs" aria-label={t("Learning dashboard views")}><Tabs.Trigger value="paths">{t("Enrolled learning paths")} <span>{paths.length}</span></Tabs.Trigger><Tabs.Trigger value="modules">{t("Modules in progress")}</Tabs.Trigger></Tabs.List></div><Tabs.Content value="paths"><div className="demo-content-heading"><div><span className="demo-overline">{t("YOUR LEARNING JOURNEY")}</span><h2>{t("Enrolled learning paths")}</h2><p>{t("Build your skills one step at a time.")}</p></div><span className="demo-path-count">{paths.length} {t("EXAMPLE PATHS")}</span></div><div className="demo-paths">{paths.map((path, index) => <PathCard key={path.slug} path={path} initiallyOpen={index === 0} />)}</div></Tabs.Content><Tabs.Content value="modules"><div className="demo-content-heading"><div><span className="demo-overline">{t("KEEP THE MOMENTUM")}</span><h2>{t("Modules in progress")}</h2><p>{t("Continue exploring your example curriculum.")}</p></div></div><div className="demo-card demo-all-modules">{paths.flatMap((path) => path.modules.filter((module) => {
      const completed = module.lessons.filter((lesson) => exampleCompletedLessons.has(`${module.slug}/${lesson.slug}`)).length;
      return completed > 0 && completed < module.lessons.length;
    }).map((module) => <ModuleRow key={module.slug} path={path} module={module} />))}</div></Tabs.Content></Tabs.Root></div><ProfileSidebar /></div>
  </div>;
}