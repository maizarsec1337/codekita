import { Link, useLocation } from 'react-router-dom';
import { Menu, ArrowUpRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Logo } from '@/components/academy/shared';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
} from '@/components/ui/sheet';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/components/language-switcher';
const links = [
  ['Academy', '/academy'],
  ['Programming', '/paths?academy=programming'],
  ['Cybersecurity', '/paths?academy=cybersecurity'],
  ['AI Engineering', '/paths?academy=ai'],
  ['Platform', '/paths'],
  ['Resources', '/labs'],
  ['About us', '/#about-codekita'],
];
export function Navbar() {
  const { t } = useTranslation('navigation');
  const { user, isLoading } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const workspace = user?.roles.some(role => role === 'ADMIN' || role === 'SUPER_ADMIN')
    ? '/admin/dashboard'
    : '/dashboard';
  const currentUrl = `${location.pathname}${location.search}${location.hash}`;

  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 1280px)');
    const closeOnDesktop = () => {
      if (desktop.matches) setOpen(false);
    };
    desktop.addEventListener('change', closeOnDesktop);
    return () => desktop.removeEventListener('change', closeOnDesktop);
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-[#29384b] bg-[#0b111d]">
      <div className="mx-auto flex h-[76px] w-full max-w-[1500px] items-center justify-between gap-3 px-4 sm:px-8">
        <Logo />
        <nav
          aria-label={t('Main navigation')}
          className="hidden items-center gap-3 xl:flex 2xl:gap-4"
        >
          {links.map(([label, href]) => (
            <Link
              key={href}
              to={href}
              aria-current={currentUrl === href ? 'page' : undefined}
              className="motion-link inline-flex min-h-11 items-center whitespace-nowrap text-xs font-medium text-slate-300 transition-colors hover:text-white"
            >
              {t(label)}
            </Link>
          ))}
        </nav>
        <div className="flex shrink-0 items-center gap-2">
          <LanguageSwitcher className="hidden 2xl:inline-flex" />
          {isLoading ? (
            <div
              className="h-9 w-20 animate-pulse rounded-lg bg-card"
              aria-label={t('Checking session')}
            />
          ) : user ? (
            <Link
              to={workspace}
              aria-label={t('My workspace')}
              className="motion-link flex min-h-11 items-center gap-2 text-sm"
            >
              <span
                aria-hidden="true"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-primary/30 bg-primary/10 font-semibold text-primary"
              >
                {user.email[0].toUpperCase()}
              </span>
              <span className="hidden sm:inline">{t('My workspace')}</span>
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="motion-link hidden min-h-11 items-center px-3 text-sm text-muted-foreground hover:text-foreground sm:inline-flex"
              >
                {t('Log in')}
              </Link>
              <Button
                size="sm"
                className="hidden min-h-11 whitespace-nowrap min-[400px]:inline-flex"
                asChild
              >
                <Link to="/register">
                  {t('Start learning')}
                  <ArrowUpRight aria-hidden="true" className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </>
          )}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label={t('Open navigation')}
                className="h-11 w-11 xl:hidden"
              >
                <Menu aria-hidden="true" size={21} />
              </Button>
            </SheetTrigger>
            <SheetContent className="max-h-[100dvh]">
              <SheetHeader className="shrink-0 pr-12">
                <SheetTitle>{t('Explore CodeKita')}</SheetTitle>
                <SheetDescription>
                  {t('Your next engineering milestone starts here.')}
                </SheetDescription>
              </SheetHeader>
              <nav
                aria-label={t('Mobile navigation')}
                className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overscroll-contain px-6 pb-8"
              >
                {[
                  ...links,
                  ['Leaderboard', '/leaderboard'],
                  ...(user
                    ? [['Dashboard', workspace]]
                    : isLoading
                      ? []
                      : [
                          ['Log in', '/login'],
                          ['Create account', '/register'],
                        ]),
                ].map(([label, href]) => (
                  <Link
                    onClick={() => setOpen(false)}
                    className="motion-link flex min-h-11 shrink-0 items-center gap-3 rounded-lg p-3 text-sm hover:bg-accent"
                    key={href}
                    to={href}
                    aria-current={currentUrl === href ? 'page' : undefined}
                  >
                    {t(label)}
                    <ArrowUpRight aria-hidden="true" size={14} className="ml-auto shrink-0" />
                  </Link>
                ))}
                <LanguageSwitcher className="mt-4 shrink-0" />
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
