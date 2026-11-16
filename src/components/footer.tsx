import { Link } from 'react-router-dom';
import { ArrowRight, Atom, Code2, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Logo } from '@/components/academy/shared';
import { useAuth } from '@/hooks/useAuth';

export function Footer() {
  const { t } = useTranslation('common');
  const { t: nav } = useTranslation('navigation');
  const { user } = useAuth();

  const columns = [
    {
      title: t('footerProduct'),
      groups: [
        {
          title: t('footerAcademy'),
          links: [
            { label: nav('Learning Paths'), to: '/paths' },
            { label: 'Programming', to: '/paths?academy=programming' },
            { label: 'Cybersecurity', to: '/paths?academy=cybersecurity' },
            { label: 'AI Engineering', to: '/paths?academy=ai' },
            { label: t('footerCourses'), to: '/courses' },
          ],
        },
        {
          title: t('footerPractice'),
          links: [
            { label: nav('Practice Labs'), to: '/labs' },
            { label: nav('My Learning'), to: '/dashboard/my-learning' },
          ],
        },
      ],
    },
    {
      title: t('footerSolutions'),
      groups: [
        {
          title: t('footerIndividuals'),
          links: [
            { label: nav('Learning Paths'), to: '/paths' },
            { label: nav('My Learning'), to: '/dashboard/my-learning' },
          ],
        },
        {
          title: t('footerCommunity'),
          links: [{ label: nav('Leaderboard'), to: '/leaderboard' }],
        },
      ],
    },
    {
      title: t('footerResources'),
      groups: [
        {
          title: t('footerExplore'),
          links: [
            { label: t('footerExploreAcademies'), to: '/academy' },
            { label: t('footerCourses'), to: '/courses' },
            { label: nav('Practice Labs'), to: '/labs' },
          ],
        },
      ],
    },
    {
      title: t('footerCompany'),
      groups: [
        {
          title: nav('About us'),
          links: [
            { label: t('homeApproachEyebrow'), to: '/#about-codekita' },
            { label: t('footerExploreAcademies'), to: '/#academies' },
          ],
        },
        {
          title: t('footerAccount'),
          links: [
            { label: t('footerJoin'), to: '/register' },
            { label: nav('Log in'), to: '/login' },
          ],
        },
      ],
    },
  ];

  return (
    <footer className="border-t border-border bg-[#0b101a]">
      <div className="mx-auto w-full max-w-[1500px] px-5 pb-8 pt-16 sm:px-8 sm:pt-20 lg:px-10 xl:px-12">
        <div className="grid gap-14 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,3.55fr)] lg:gap-10 xl:gap-16">
          <div className="min-w-0 lg:pr-2">
            <Logo />
            <p className="mt-6 max-w-sm text-base leading-7 text-slate-200">
              {t('footerDescription')}
            </p>
            <p className="mt-4 font-mono text-xs leading-6 text-primary">
              Learn. Build. Secure. Innovate.
            </p>
            <Link
              to={user ? '/paths' : '/register'}
              className="mt-7 inline-flex min-h-12 items-center justify-center gap-3 rounded-sm bg-[#a3e635] px-6 py-3 text-sm font-semibold text-[#0b101a] transition-colors duration-200 hover:bg-[#bbf45e] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary motion-reduce:transition-none"
            >
              {t('footerStartLearning')} <ArrowRight aria-hidden="true" size={16} />
            </Link>
            <div className="mt-10 max-w-sm border-t border-border pt-7">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-200">
                {t('footerAcademies')}
              </p>
              <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-4 text-sm text-slate-400">
                <li className="flex items-center gap-2">
                  <Code2 aria-hidden="true" size={17} className="text-codekita-primary" />
                  Programming
                </li>
                <li className="flex items-center gap-2">
                  <ShieldCheck aria-hidden="true" size={17} className="text-codekita-secondary" />
                  Cybersecurity
                </li>
                <li className="flex items-center gap-2">
                  <Atom aria-hidden="true" size={17} className="text-codekita-purple" />
                  AI Engineering
                </li>
              </ul>
            </div>
          </div>

          <nav
            aria-label={t('footerNavigation')}
            className="grid min-w-0 grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4 lg:gap-x-5 xl:gap-x-8"
          >
            {columns.map(column => (
              <section key={column.title} className="min-w-0">
                <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-white">
                  {column.title}
                </h2>
                <div className="mt-7 space-y-8">
                  {column.groups.map(group => (
                    <div key={group.title}>
                      <h3 className="mb-3 text-sm font-semibold text-slate-200">{group.title}</h3>
                      <ul className="space-y-1">
                        {group.links.map(link => (
                          <li key={link.to}>
                            <Link
                              to={link.to}
                              className="inline-flex min-h-10 max-w-full items-center rounded-sm py-1.5 text-sm leading-6 text-slate-400 transition-colors duration-200 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary motion-reduce:transition-none"
                            >
                              {link.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </nav>
        </div>

        <div className="mt-16 flex flex-col gap-3 border-t border-border pt-7 sm:mt-20 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-x-8">
          <p className="text-sm leading-6 text-slate-400">
            © {new Date().getFullYear()} CodeKita Academy. {t('footerRights')}
          </p>
          <p className="text-sm leading-6 text-slate-400">{t('footerBuilt')}</p>
        </div>
      </div>
    </footer>
  );
}
