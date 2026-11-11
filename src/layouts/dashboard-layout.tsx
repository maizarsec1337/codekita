import { useState } from 'react';
import { Link, NavLink, Navigate, Outlet, useLocation } from 'react-router-dom';
import { Award, BookOpen, ChevronRight, Flag, GraduationCap, LayoutDashboard, LogOut, Menu, Settings, ShieldCheck, Target, Trophy, UserRound } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Logo } from '@/components/academy/shared';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { LanguageSwitcher } from '@/components/language-switcher';
import { useTranslation } from 'react-i18next';
import { RouteTransition } from '@/components/motion';
const items = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'My Learning', href: '/dashboard/my-learning', icon: GraduationCap },
    { name: 'Learning Paths', href: '/paths', icon: Target },
    { name: 'Modules', href: '/dashboard/modules', icon: BookOpen },
    { name: 'Practice Labs', href: '/labs', icon: ShieldCheck },
    { name: 'Challenges', href: '/challenges', icon: Flag },
    { name: 'Achievements', href: '/achievements', icon: Award },
    { name: 'Leaderboard', href: '/leaderboard', icon: Trophy },
    { name: 'Certificates', href: '/certificates', icon: Award },
    { name: 'Profile', href: '/profile', icon: UserRound },
    { name: 'Settings', href: '/settings', icon: Settings },
];
export function DashboardLayout() {
    const { t } = useTranslation(['navigation', 'common']);
    const { t: common } = useTranslation('common');
    const { user, isLoading, logout } = useAuth();
    const location = useLocation();
    const [open, setOpen] = useState(false), [error, setError] = useState('');
    if (isLoading)
        return (<div role="status" className="m-10 h-64 animate-pulse rounded-2xl bg-card" aria-label={t('Checking session')}/>);
    if (!user)
        return <Navigate to="/login" replace state={{ from: location.pathname }}/>;
    const displayUser = user;
    const nav = (<>
      <nav aria-label={t('Student navigation')} className="space-y-1">
        {items
            .map(item => (<NavLink end key={item.href} onClick={() => setOpen(false)} to={item.href} className={({ isActive }) => cn('flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] transition-colors', isActive
                ? 'bg-primary/10 font-medium text-primary'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground')}>
              <item.icon size={17}/>
              {t(item.name)}
            </NavLink>))}
      </nav>
      {displayUser?.roles.some(role => ['ADMIN', 'SUPER_ADMIN'].includes(role)) && (<Link className="mt-5 flex items-center gap-3 rounded-lg border border-border px-3 py-3 text-xs text-codekita-purple" to="/admin/dashboard">
            <ShieldCheck size={16}/>
            {t('Content administration')}
            <ChevronRight size={12}/>
          </Link>)}
      {(<div className="mt-8 border-t border-border pt-4">
          <Button variant="ghost" className="w-full justify-start text-muted-foreground" onClick={() => {
                void logout().catch(() => setError(t('Sign out failed. Please retry to revoke your session.')));
            }}>
            <LogOut size={16} className="mr-3"/>
            {t('Sign out')}
          </Button>
          {error && (<p role="alert" className="mt-2 text-xs text-codekita-warning">
              {error}
            </p>)}
        </div>)}
    </>);
    return (<div className="min-h-screen bg-background">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-primary focus:p-3 focus:text-primary-foreground">
        {common('skip')}
      </a>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col border-r border-border bg-card/60 px-4 py-7 lg:flex">
        <div className="mb-10 px-3">
          <Logo />
        </div>
        <p className="mb-4 px-3 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
          {t('Your workspace')}
        </p>
        <div className="min-h-0 flex-1 overflow-y-auto">{nav}</div>
        <div className="mt-4 rounded-xl border border-border bg-background p-4">
          <p className="text-xs font-medium">{t('One step closer.')}</p>
          <p className="mt-2 text-[11px] leading-5 text-muted-foreground">
            {t('Small, consistent sessions build lasting skills.')}
          </p>
        </div>
      </aside>
      <div className="min-w-0 lg:pl-[248px]">
        <header className="sticky top-0 z-20 flex h-[76px] items-center justify-between gap-3 border-b border-border bg-background/90 px-5 backdrop-blur-xl sm:px-8">
          <div className="flex items-center gap-3">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden" aria-label={t('Open workspace navigation')}>
                  <Menu size={21}/>
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>{t('Your workspace')}</SheetTitle>
                  <SheetDescription>
                    {t('Learn, practice, and track your progress.')}
                  </SheetDescription>
                </SheetHeader>
                <div className="overflow-y-auto px-5 pb-6">
                  {nav}
                  <LanguageSwitcher className="mt-5"/>
                </div>
              </SheetContent>
            </Sheet>
            <p className="text-xs text-muted-foreground">
              <Link to="/dashboard" className="hover:text-primary">
                {t('Workspace')}
              </Link>
              <ChevronRight className="mx-2 inline" size={12}/>
              <span className="text-foreground">
                {t(items.find(item => item.href === location.pathname)?.name ?? 'Learning')}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher className="hidden lg:inline-flex"/>
            {displayUser && (<Link to="/profile" className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-xs font-semibold">
                {displayUser.email.slice(0, 2).toUpperCase()}
              </Link>)}
          </div>
        </header>
        <main id="main-content" className="page-container py-8 lg:py-10">
          <RouteTransition>
            <Outlet />
          </RouteTransition>
        </main>
      </div>
    </div>);
}
