import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowRight,
  Atom,
  Braces,
  Check,
  Code2,
  Compass,
  Layers3,
  Minus,
  Plus,
  ShieldCheck,
  Terminal,
  Users,
} from 'lucide-react';
import { academies } from '@/components/academy/shared';
import { cn } from '@/lib/utils';

const copy = {
  id: {
    skillTag: 'BELAJAR DENGAN TUJUAN',
    skillTitle: 'Bangun Keahlian Teknologi Masa Depan',
    skillIntro:
      'Mulai dari rasa ingin tahu, kembangkan menjadi keterampilan yang bisa kamu terapkan.',
    skillNames: [
      'Belajar Programming',
      'Kuasai Cybersecurity',
      'Eksplorasi AI Engineering',
      'Kembangkan Portofolio',
    ],
    skillDescriptions: [
      'Pahami dasar pemrograman dan bangun fondasi untuk menciptakan software yang bermanfaat.',
      'Pelajari cara kerja sistem dan praktik keamanan yang bertanggung jawab untuk melindungi dunia digital.',
      'Jelajahi data, machine learning, dan penerapan AI melalui jalur belajar yang terarah.',
      'Kembangkan pemahaman melalui latihan dan proyek yang mendukung perjalanan belajarmu.',
    ],
    explore: 'Jelajahi jalur',
    ecosystem: 'SATU EKOSISTEM UNTUK BELAJAR DAN BERKARYA',
    productTag: 'TEMUKAN LANGKAH BERIKUTNYA',
    productTitle: 'Satu platform. Banyak kemungkinan.',
    productIntro:
      'Bangun fondasi, praktikkan pengetahuan, dan temukan bidang teknologi yang ingin kamu tekuni.',
    pathTitle: 'Learning Paths',
    pathDescription: 'Jalur terstruktur untuk membangun kemampuan selangkah demi selangkah.',
    labTitle: 'Hands-on Labs',
    labDescription:
      'Jelajahi ruang latihan pemrograman, keamanan, dan AI. Eksekusi langsung memerlukan runner terisolasi.',
    productButton: 'Jelajahi',
    solutionsTag: 'BELAJAR DENGAN CARA KAMU',
    solutionsTitle: 'Dibangun untuk setiap perjalanan belajar.',
    solutionsIntro: 'Apa pun titik awalmu, temukan langkah yang tepat untuk terus berkembang.',
    solutionNames: [
      'Untuk Pelajar',
      'Untuk Developer',
      'Untuk Cybersecurity Enthusiast',
      'Untuk Komunitas',
    ],
    solutionDescriptions: [
      'Mulai dari konsep dasar dan ikuti jalur pembelajaran yang jelas sesuai kecepatanmu.',
      'Perdalam fondasi software engineering dan temukan tantangan baru untuk melatih kemampuanmu.',
      'Bangun pemahaman keamanan sistem dan jaringan dengan pendekatan yang etis dan bertanggung jawab.',
      'Temukan inspirasi belajar dan lihat papan peringkat komunitas yang menjaga privasi.',
    ],
    solutionButton: 'Temukan selengkapnya',
    benefitsTag: 'LEARN. BUILD. SECURE. INNOVATE.',
    benefitsTitle: 'Keterampilan nyata dimulai dari langkah yang terarah.',
    benefitsText:
      'Bukan sekadar membaca materi. CodeKita membantumu menghubungkan konsep, latihan, dan progres dalam satu perjalanan.',
    benefits: ['Pembelajaran terstruktur', 'Latihan yang relevan', 'Progres yang dapat dipantau'],
    ctaTag: 'MULAI PERJALANANMU',
    ctaTitle: 'Masa depan dibangun dari apa yang kamu pelajari hari ini.',
    ctaDescription:
      'Mulai perjalanan teknologi bersama CodeKita. Pilih jalurmu dan berkembang dengan tujuan.',
    ctaPanelTitle: 'Siap untuk langkah pertama?',
    ctaPanelDescription: 'Buat akun untuk menyimpan progres dan melanjutkan pembelajaranmu.',
    ctaAccount: 'Buat akun CodeKita',
    ctaLogin: 'Sudah punya akun? Masuk',
    ctaMember: 'Lanjutkan belajar',
  },
  en: {
    skillTag: 'LEARN WITH PURPOSE',
    skillTitle: 'Build the technology skills of tomorrow',
    skillIntro: 'Start with curiosity and turn it into skills you can put into practice.',
    skillNames: [
      'Learn Programming',
      'Master Cybersecurity',
      'Explore AI Engineering',
      'Develop Your Portfolio',
    ],
    skillDescriptions: [
      'Understand programming fundamentals and build a foundation for useful software.',
      'Discover how systems work and practice responsible security to protect the digital world.',
      'Explore data, machine learning, and applied AI through a structured learning journey.',
      'Develop your understanding through exercises and projects that support your learning journey.',
    ],
    explore: 'Explore learning paths',
    ecosystem: 'ONE ECOSYSTEM TO LEARN AND BUILD',
    productTag: 'FIND YOUR NEXT STEP',
    productTitle: 'One platform. Many possibilities.',
    productIntro:
      'Build your foundations, practice what you learn, and find the technology discipline you want to pursue.',
    pathTitle: 'Learning Paths',
    pathDescription: 'Structured paths to build your skills one step at a time.',
    labTitle: 'Hands-on Labs',
    labDescription:
      'Explore programming, security, and AI practice workspaces. Live execution requires an isolated runner.',
    productButton: 'Explore',
    solutionsTag: 'LEARN YOUR WAY',
    solutionsTitle: 'Built for every learning journey.',
    solutionsIntro: 'Wherever you begin, find the right next step to keep growing.',
    solutionNames: [
      'For Students',
      'For Developers',
      'For Cybersecurity Enthusiasts',
      'For the Community',
    ],
    solutionDescriptions: [
      'Start with the fundamentals and follow a clear learning path at your own pace.',
      'Deepen your software engineering foundations and find new challenges to practice your skills.',
      'Build your understanding of system and network security with an ethical, responsible approach.',
      'Find learning inspiration and explore a privacy-conscious community leaderboard.',
    ],
    solutionButton: 'Discover more',
    benefitsTag: 'LEARN. BUILD. SECURE. INNOVATE.',
    benefitsTitle: 'Real skills start with a deliberate step.',
    benefitsText:
      'More than reading material. CodeKita brings concepts, practice, and progress together in one journey.',
    benefits: ['Structured learning', 'Relevant practice', 'Trackable progress'],
    ctaTag: 'START YOUR JOURNEY',
    ctaTitle: 'The future is built with what you learn today.',
    ctaDescription:
      'Start your technology journey with CodeKita. Choose your path and grow with purpose.',
    ctaPanelTitle: 'Ready to take the first step?',
    ctaPanelDescription: 'Create an account to save your progress and continue learning.',
    ctaAccount: 'Create a CodeKita account',
    ctaLogin: 'Already have an account? Sign in',
    ctaMember: 'Continue learning',
  },
};

function useHomeCopy() {
  const { i18n } = useTranslation();
  return copy[i18n.resolvedLanguage === 'en' ? 'en' : 'id'];
}

const buttonClass =
  'inline-flex min-h-12 items-center justify-center gap-3 rounded-sm bg-[#a3e635] px-6 py-3 text-sm font-semibold text-[#0b101a] transition-colors hover:bg-[#bbf45e] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#a3e635]';
const sectionTitle =
  'text-balance text-3xl font-semibold leading-[1.12] tracking-[-0.035em] text-white sm:text-4xl lg:text-5xl';
const intro = 'text-base leading-7 text-[#a8b5c8]';
const eyebrow = 'font-mono text-xs font-medium uppercase tracking-[0.18em] text-[#a3e635]';

/** Original vector illustration; decorative and independent of third-party artwork. */
export function BuilderIllustration({ className = '' }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 640 580"
      className={className}
      fill="none"
    >
      <defs>
        <linearGradient
          id="ck-builder-panel"
          x1="100"
          y1="40"
          x2="560"
          y2="520"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#27384a" />
          <stop offset="1" stopColor="#101827" />
        </linearGradient>
      </defs>
      <path d="M320 20 610 290 320 560 30 290Z" fill="url(#ck-builder-panel)" />
      <path d="M320 52 576 290 320 528 64 290Z" stroke="#a3e635" strokeOpacity=".38" />
      <path d="M320 88 538 290 320 492 102 290Z" stroke="#6f859a" strokeOpacity=".35" />
      <path d="M47 358 355 50M260 530 570 220" stroke="#a3e635" strokeOpacity=".3" />
      <circle cx="320" cy="195" r="56" fill="#aab7bb" />
      <path
        d="M265 187c3-49 28-71 59-71 37 0 62 29 58 71-22-10-40-27-46-46-15 22-38 38-71 46Z"
        fill="#111923"
      />
      <path
        d="M272 249c-62 19-105 72-108 147l-3 39h318l-4-39c-5-75-45-128-108-147l-47 37-48-37Z"
        fill="#263d4b"
        stroke="#698596"
        strokeWidth="2"
      />
      <path
        d="m271 250 49 36-30 50-37-64M368 250l-48 36 30 50 37-64"
        stroke="#a3e635"
        strokeOpacity=".45"
        strokeWidth="2"
      />
      <path d="M189 365h262l-30 111H219l-30-111Z" fill="#101a29" stroke="#7290a1" strokeWidth="2" />
      <path d="M204 477h231" stroke="#a3e635" strokeWidth="4" strokeLinecap="round" />
      <path
        d="m305 400-12 10 12 10m30-20 12 10-12 10m-10-27-10 35"
        stroke="#a3e635"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="116" cy="193" r="4" fill="#a3e635" />
      <circle cx="513" cy="378" r="4" fill="#a3e635" />
      <path d="M129 392h38m-19-19v38M472 175h34m-17-17v34" stroke="#a3e635" strokeOpacity=".6" />
    </svg>
  );
}

const skillLinks = [
  '/paths?academy=programming',
  '/paths?academy=cybersecurity',
  '/paths?academy=ai',
  '/labs',
];
const solutionLinks = [
  '/paths',
  '/paths?academy=programming',
  '/paths?academy=cybersecurity',
  '/leaderboard',
];
const skillImages = [
  academies.programming.illustration,
  academies.cybersecurity.illustration,
  academies.ai.illustration,
  academies.programming.illustration,
];

function AccordionList({ kind }: { kind: 'skills' | 'solutions' }) {
  const text = useHomeCopy();
  const [active, setActive] = useState(0);
  const isSkill = kind === 'skills';
  const names = isSkill ? text.skillNames : text.solutionNames;
  const descriptions = isSkill ? text.skillDescriptions : text.solutionDescriptions;
  const links = isSkill ? skillLinks : solutionLinks;
  return (
    <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-20">
      <div className="min-w-0 space-y-2">
        {names.map((name, index) => (
          <div
            key={name}
            className={cn(
              'border transition-colors',
              active === index
                ? 'border-[#a3e635]/60 bg-[#151f2e]'
                : 'border-[#293746] bg-[#101827]'
            )}
          >
            <h3>
              <button
                type="button"
                id={`${kind}-button-${index}`}
                aria-expanded={active === index}
                aria-controls={`${kind}-panel-${index}`}
                onClick={() => setActive(index)}
                className="flex min-h-[64px] w-full items-center justify-between gap-5 px-5 py-4 text-left text-base font-semibold text-white hover:text-[#a3e635] sm:px-6"
              >
                <span>{name}</span>
                {active === index ? (
                  <Minus aria-hidden="true" size={19} className="shrink-0 text-[#a3e635]" />
                ) : (
                  <Plus aria-hidden="true" size={19} className="shrink-0 text-[#91a2b4]" />
                )}
              </button>
            </h3>
            <div
              id={`${kind}-panel-${index}`}
              role="region"
              aria-labelledby={`${kind}-button-${index}`}
              hidden={active !== index}
              className="px-5 pb-6 sm:px-6"
            >
              <p className="max-w-lg text-sm leading-7 text-[#a8b5c8]">{descriptions[index]}</p>
              <Link
                to={links[index]}
                className="mt-5 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-[#a3e635] hover:text-white"
              >
                {isSkill ? text.explore : text.solutionButton}
                <ArrowRight aria-hidden="true" size={16} />
              </Link>
              <img
                src={skillImages[index]}
                alt=""
                width="460"
                height="192"
                loading="lazy"
                decoding="async"
                className="mx-auto mt-3 h-48 w-full max-w-[460px] object-contain lg:hidden"
              />
            </div>
          </div>
        ))}
      </div>
      <div
        aria-hidden="true"
        className="relative hidden min-h-[420px] items-center justify-center overflow-hidden lg:flex"
      >
        <div className="absolute h-80 w-80 rotate-45 border border-[#a3e635]/25 bg-[#192735]" />
        <div className="absolute h-96 w-96 rotate-45 border border-[#52687a]/25" />
        <img
          src={skillImages[active]}
          alt=""
          width="460"
          height="370"
          loading="lazy"
          decoding="async"
          className="relative h-[370px] w-full max-w-[460px] object-contain"
        />
      </div>
    </div>
  );
}

export function SkillsSection() {
  const text = useHomeCopy();
  return (
    <section id="about-codekita" className="scroll-mt-24 bg-[#101827] py-20 sm:py-28">
      <div className="page-container">
        <div className="mb-12 max-w-3xl">
          <p className={eyebrow}>{text.skillTag}</p>
          <h2 className={cn(sectionTitle, 'mt-5')}>{text.skillTitle}</h2>
          <p className={cn(intro, 'mt-5 max-w-2xl')}>{text.skillIntro}</p>
        </div>
        <AccordionList kind="skills" />
      </div>
    </section>
  );
}

export function EcosystemSection() {
  const text = useHomeCopy();
  return (
    <section aria-label={text.ecosystem} className="border-y border-[#273546] bg-[#0b101a]">
      <div className="page-container py-10 sm:py-12">
        <p className="text-center font-mono text-[10px] font-medium tracking-[0.18em] text-[#92a0b0]">
          {text.ecosystem}
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-10 gap-y-6 text-sm font-semibold text-[#c6d1dc] sm:gap-x-16 sm:text-base">
          {[
            { icon: Code2, name: 'Programming' },
            { icon: ShieldCheck, name: 'Cybersecurity' },
            { icon: Atom, name: 'AI Engineering' },
            { icon: Layers3, name: 'CodeKita Academy' },
          ].map(item => (
            <div key={item.name} className="flex items-center gap-2.5">
              <item.icon aria-hidden="true" size={22} className="text-[#a3e635]" />
              {item.name}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ProductsSection() {
  const text = useHomeCopy();
  const { t } = useTranslation('common');
  const products = [
    {
      title: 'Programming Academy',
      desc: t('homeAcademyDescription-programming'),
      to: '/paths?academy=programming',
      image: academies.programming.illustration,
      grid: 'lg:col-span-7',
      label: '01 / PROGRAMMING',
    },
    {
      title: 'Cybersecurity Academy',
      desc: t('homeAcademyDescription-cybersecurity'),
      to: '/paths?academy=cybersecurity',
      image: academies.cybersecurity.illustration,
      grid: 'lg:col-span-5',
      label: '02 / CYBERSECURITY',
    },
    {
      title: 'AI Engineering Academy',
      desc: t('homeAcademyDescription-ai'),
      to: '/paths?academy=ai',
      image: academies.ai.illustration,
      grid: 'lg:col-span-5',
      label: '03 / AI ENGINEERING',
    },
    {
      title: text.pathTitle,
      desc: text.pathDescription,
      to: '/paths',
      image: academies.programming.illustration,
      grid: 'lg:col-span-7',
      label: '04 / LEARNING PATHS',
    },
    {
      title: text.labTitle,
      desc: text.labDescription,
      to: '/labs',
      image: academies.cybersecurity.illustration,
      grid: 'lg:col-span-12',
      label: '05 / PRACTICE',
    },
  ];
  return (
    <section id="academies" className="scroll-mt-24 bg-[#0b101a] py-20 sm:py-28">
      <div className="page-container">
        <div className="mb-12 max-w-3xl">
          <p className={eyebrow}>{text.productTag}</p>
          <h2 className={cn(sectionTitle, 'mt-5')}>{text.productTitle}</h2>
          <p className={cn(intro, 'mt-5')}>{text.productIntro}</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-12">
          {products.map(product => (
            <article
              key={product.label}
              className={cn(
                'group relative isolate flex min-h-[340px] flex-col overflow-hidden border border-[#293746] bg-[#151f2e] p-7 transition-colors hover:border-[#a3e635]/50 sm:p-9',
                product.grid
              )}
            >
              <div
                aria-hidden="true"
                className="absolute -right-20 -top-32 -z-10 h-80 w-80 rotate-45 border border-[#a3e635]/15 bg-[#283b48]/40"
              />
              <div className="relative z-10 flex h-full min-w-0 flex-col items-start sm:max-w-[57%]">
                <p className="font-mono text-[10px] tracking-[0.15em] text-[#a3e635]">
                  {product.label}
                </p>
                <h3 className="mt-6 text-2xl font-semibold leading-tight text-white sm:text-3xl">
                  {product.title}
                </h3>
                <p className="mt-4 text-sm leading-7 text-[#b0becc]">{product.desc}</p>
                <Link to={product.to} className={cn(buttonClass, 'mt-7')}>
                  {text.productButton}
                  <ArrowRight aria-hidden="true" size={16} />
                </Link>
              </div>
              <img
                src={product.image}
                alt=""
                width="460"
                height="192"
                loading="lazy"
                decoding="async"
                className="relative mx-auto mt-4 h-48 w-full max-w-[460px] object-contain sm:absolute sm:bottom-0 sm:right-0 sm:mt-0 sm:h-[85%] sm:w-[46%]"
              />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function SolutionsSection() {
  const text = useHomeCopy();
  return (
    <section id="solutions" className="scroll-mt-24 bg-[#101827] py-20 sm:py-28">
      <div className="page-container">
        <div className="mx-auto mb-14 max-w-3xl text-center">
          <p className={eyebrow}>{text.solutionsTag}</p>
          <h2 className={cn(sectionTitle, 'mt-5')}>{text.solutionsTitle}</h2>
          <p className={cn(intro, 'mt-5')}>{text.solutionsIntro}</p>
        </div>
        <AccordionList kind="solutions" />
      </div>
    </section>
  );
}

export function BenefitsSection() {
  const text = useHomeCopy();
  return (
    <section className="relative overflow-hidden bg-[#0b101a] py-20 sm:py-28">
      <div
        aria-hidden="true"
        className="absolute -right-24 top-0 h-[440px] w-[440px] rotate-45 border border-[#a3e635]/10"
      />
      <div className="page-container relative grid items-center gap-12 lg:grid-cols-2">
        <div>
          <p className={eyebrow}>{text.benefitsTag}</p>
          <h2 className={cn(sectionTitle, 'mt-5')}>{text.benefitsTitle}</h2>
          <p className={cn(intro, 'mt-6 max-w-xl')}>{text.benefitsText}</p>
        </div>
        <div className="grid gap-3">
          {text.benefits.map((benefit, index) => {
            const Icon = [Compass, Terminal, Braces][index];
            return (
              <div
                key={benefit}
                className="flex items-center gap-5 border border-[#293746] bg-[#151f2e] p-5 sm:p-6"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center border border-[#a3e635]/25 bg-[#a3e635]/10 text-[#a3e635]">
                  <Icon aria-hidden="true" size={22} />
                </span>
                <span className="font-semibold text-white">{benefit}</span>
                <Check aria-hidden="true" size={18} className="ml-auto text-[#a3e635]" />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function ClosingSection({ signedIn }: { signedIn: boolean }) {
  const text = useHomeCopy();
  return (
    <section className="relative overflow-hidden border-t border-[#293746] bg-[#101827] py-20 sm:py-28">
      <div
        aria-hidden="true"
        className="absolute -left-40 top-0 h-96 w-96 rotate-45 border border-[#a3e635]/10"
      />
      <div className="page-container relative grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-24">
        <div>
          <p className={eyebrow}>{text.ctaTag}</p>
          <h2 className={cn(sectionTitle, 'mt-5')}>{text.ctaTitle}</h2>
          <p className={cn(intro, 'mt-6 max-w-xl')}>{text.ctaDescription}</p>
          <div className="mt-8 flex items-center gap-3 text-sm text-[#c3d1dd]">
            <Users aria-hidden="true" className="text-[#a3e635]" size={20} />
            Learn. Build. Secure. Innovate.
          </div>
        </div>
        <div className="border border-[#344453] bg-[#151f2e] p-7 sm:p-10">
          <p className="font-mono text-xs tracking-[0.15em] text-[#a3e635]">CODEKITA ACADEMY</p>
          <h3 className="mt-5 text-2xl text-white">{text.ctaPanelTitle}</h3>
          <p className="mt-4 text-sm leading-7 text-[#a8b5c8]">{text.ctaPanelDescription}</p>
          <Link to={signedIn ? '/paths' : '/register'} className={cn(buttonClass, 'mt-8 w-full')}>
            {signedIn ? text.ctaMember : text.ctaAccount}
            <ArrowRight aria-hidden="true" size={16} />
          </Link>
          {!signedIn && (
            <Link
              to="/login"
              className="mt-5 block text-center text-sm text-[#c3d1dd] hover:text-[#a3e635]"
            >
              {text.ctaLogin}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
