import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  Flame,
  LockKeyhole,
  Play,
  Target,
  Trophy,
  Zap,
} from 'lucide-react';
import { useLearning } from '@/hooks/useAcademy';
import { academyApi } from '@/lib/academy-api';
import {
  CardSkeletons,
  DataState,
  PageHeading,
  PathCard,
  ProgressBar,
} from '@/components/academy/shared';
import { Button } from '@/components/ui/button';
import { isStaticFrontend } from '@/lib/mode';
import { DemoDashboard } from '@/components/academy/demo-dashboard';

export function DashboardPage() {
  return isStaticFrontend ? <DemoDashboard /> : <LiveDashboard />;
}

function LiveDashboard() {
  const learning = useLearning();
  const paths = useQuery({ queryKey: ['paths'], queryFn: academyApi.paths });
  if (learning.isPending) return <CardSkeletons count={6} />;
  if (learning.isError)
    return (
      <DataState
        error
        title="Your progress is temporarily unavailable"
        description="We won’t substitute sample activity for your real learning history. Please retry."
        retry={() => void learning.refetch()}
      />
    );
  const data = learning.data,
    active = data.enrollments.find(item => item.next),
    max = Math.max(1, ...data.activity.map(item => item.count));
  return (
    <div className="space-y-8">
      <PageHeading
        eyebrow="Keep your curiosity moving"
        title="Welcome back, Engineer."
        description="Your next breakthrough starts with a small step. Let’s make it count."
        action={
          <Button variant="outline" asChild>
            <Link to="/paths">
              Explore paths
              <ArrowRight size={15} className="ml-3" />
            </Link>
          </Button>
        }
      />
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-6">
        {[
          { icon: Zap, label: 'Total XP', value: data.xp.toLocaleString() },
          { icon: Trophy, label: 'Current level', value: String(data.level) },
          { icon: Flame, label: 'Learning streak', value: `${data.streak} days` },
          { icon: CheckCircle2, label: 'Modules complete', value: String(data.completedModules) },
          { icon: Target, label: 'Challenges', value: 'Not enabled' },
          { icon: BookOpen, label: 'Overall progress', value: `${data.overallProgress}%` },
        ].map(stat => (
          <div className="panel p-4" key={stat.label}>
            <div className="mb-4 flex items-center justify-between">
              <stat.icon size={16} className="text-primary" />
              <span className="h-1 w-1 rounded-full bg-border" />
            </div>
            <p className="text-lg font-semibold sm:text-2xl">{stat.value}</p>
            <p className="mt-1.5 text-[11px] text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.55fr_1fr]">
        <section className="panel relative overflow-hidden p-6 sm:p-8">
          <p className="eyebrow mb-5">Pick up where you left off</p>
          {active ? (
            <>
              <h2 className="text-2xl">{active.path.title}</h2>
              <p className="muted mt-3 max-w-md">{active.path.description}</p>
              <div className="my-6">
                <div className="mb-3 flex justify-between text-xs text-muted-foreground">
                  <span>
                    {active.completedLessonIds.length} of {active.path.lessonCount} sections
                  </span>
                  <span className="text-primary">{active.progress}%</span>
                </div>
                <ProgressBar value={active.progress} />
              </div>
              <Button asChild>
                <Link to={`/learn/${active.next!.moduleSlug}/${active.next!.sectionSlug}`}>
                  <Play size={15} className="mr-2" />
                  Continue learning
                </Link>
              </Button>
            </>
          ) : (
            <>
              <h2 className="max-w-md text-2xl leading-9">
                A blank page is a good place to begin.
              </h2>
              <p className="muted mb-6 mt-3 max-w-md">
                {data.enrollments.length
                  ? 'You’ve reached the end of your current paths. Choose a new direction to keep growing.'
                  : 'Choose your first learning path. Your progress, milestones, and achievements will grow from here.'}
              </p>
              <Button asChild>
                <Link to="/paths">
                  Find your first path
                  <ArrowRight size={15} className="ml-3" />
                </Link>
              </Button>
            </>
          )}
        </section>
        <section className="panel p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base">Learning activity</h2>
            <span className="text-[10px] text-muted-foreground">Last 7 days · UTC</span>
          </div>
          <p className="muted mt-2">
            {data.activity.reduce((sum, item) => sum + item.count, 0)} validated sections
          </p>
          <div
            className="mt-6 flex h-28 items-end gap-3"
            aria-label="Validated lesson completions for the last seven days"
          >
            {data.activity.map(day => (
              <div
                key={day.date}
                className="flex h-full min-w-0 flex-1 flex-col justify-end text-center"
              >
                <span className="mb-1 text-[10px] text-muted-foreground">{day.count}</span>
                <div
                  className="min-h-px rounded-t bg-primary/70"
                  style={{ height: `${(day.count / max) * 75}%` }}
                  title={`${day.date}: ${day.count} completions`}
                />
                <span className="mt-3 text-[9px] text-muted-foreground">
                  {new Date(`${day.date}T00:00:00Z`).toLocaleDateString('en', {
                    weekday: 'narrow',
                    timeZone: 'UTC',
                  })}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-5 border-t border-border pt-4 text-[11px] text-muted-foreground">
            {data.weeklyStreak} active week streak · Built from actual assessments.
          </p>
        </section>
      </div>
      <section>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl">Find your next direction</h2>
          <Link to="/paths" className="text-xs text-primary">
            View all paths →
          </Link>
        </div>
        {paths.isPending ? (
          <CardSkeletons />
        ) : paths.isError ? (
          <DataState
            error
            title="Recommendations unavailable"
            description="The catalogue could not be reached."
            retry={() => void paths.refetch()}
          />
        ) : paths.data.length ? (
          <div className="grid gap-5 md:grid-cols-3">
            {paths.data.slice(0, 3).map(path => (
              <PathCard
                key={path.id}
                path={path}
                progress={data.enrollments.find(item => item.path.id === path.id)?.progress}
              />
            ))}
          </div>
        ) : (
          <DataState
            title="New paths are on their way"
            description="Published curriculum will appear here. You can explore lab previews in the meantime."
          />
        )}
      </section>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="panel p-6">
          <div className="mb-6 flex items-center gap-2">
            <Award size={18} className="text-codekita-purple" />
            <h2 className="text-base">Your milestones</h2>
          </div>
          <div className="space-y-4">
            {data.achievements.map(achievement => (
              <div key={achievement.id} className="flex items-center gap-4">
                <span
                  className={`rounded-xl border p-3 ${achievement.earned ? 'border-primary/30 bg-primary/10 text-primary' : 'border-border text-muted-foreground'}`}
                >
                  {achievement.earned ? <Award size={19} /> : <LockKeyhole size={19} />}
                </span>
                <div>
                  <h3 className="text-sm">{achievement.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{achievement.description}</p>
                </div>
                <span className="ml-auto text-[10px] text-muted-foreground">
                  {achievement.earned ? 'Earned' : 'Locked'}
                </span>
              </div>
            ))}
          </div>
        </section>
        <section className="panel p-6">
          <h2 className="mb-5 text-base">Your next learning goals</h2>
          <div className="space-y-4">
            {[
              {
                done: data.enrollments.length > 0,
                title: 'Choose a learning path',
                text: 'Give your curiosity a direction.',
              },
              {
                done: data.xp > 0,
                title: 'Pass your first knowledge check',
                text: 'Show what you understand and earn 50 XP.',
              },
              {
                done: data.certificates.length > 0,
                title: 'Finish an assessed path',
                text: 'Complete every section to earn a certificate.',
              },
            ].map(goal => (
              <div key={goal.title} className="flex gap-3 rounded-xl border border-border p-4">
                <CheckCircle2
                  size={18}
                  className={goal.done ? 'text-primary' : 'text-muted-foreground'}
                />
                <div>
                  <h3 className="text-sm">{goal.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{goal.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
