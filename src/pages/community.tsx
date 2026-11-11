import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, ShieldCheck, Trophy } from 'lucide-react';
import { academyApi } from '@/lib/academy-api';
import { academies, CardSkeletons, DataState, PageHeading } from '@/components/academy/shared';
import { Reveal } from '@/components/motion';
export function LeaderboardPage() {
    const board = useQuery({
        queryKey: ['leaderboard'],
        queryFn: academyApi.leaderboard,
        enabled: true,
    });
    return (<div className="page-container py-12">
      <PageHeading eyebrow="Build alongside curious minds" title="The learning leaderboard" description="Ranked by validated XP. Public aliases protect learner identities; account emails are never displayed."/>
      {board.isPending ? (<CardSkeletons />) : board.isError ? (<DataState error title="Leaderboard unavailable" description="Live rankings could not be loaded. No sample rankings are shown." retry={() => void board.refetch()}/>) : !board.data.length ? (<DataState title="The first milestone is still ahead" description="Engineers appear here after passing their first assessment. Every real journey starts somewhere."/>) : (<div className="panel overflow-hidden">
          <div className="grid grid-cols-[50px_1fr_90px] gap-3 border-b border-border bg-background/40 p-5 text-[10px] uppercase tracking-widest text-muted-foreground">
            <span>Rank</span>
            <span>Engineer</span>
            <span className="text-right">Total XP</span>
          </div>
          <ol>
            {board.data.map(item => (<li className="grid grid-cols-[50px_1fr_90px] items-center gap-3 border-b border-border p-5 last:border-0" key={item.rank}>
                <span className={item.rank <= 3 ? 'text-primary' : 'text-muted-foreground'}>
                  {item.rank === 1 ? <Trophy size={18}/> : String(item.rank).padStart(2, '0')}
                </span>
                <span className="text-sm">{item.name}</span>
                <span className="text-right font-mono text-sm text-primary">
                  {item.xp.toLocaleString()}
                </span>
              </li>))}
          </ol>
        </div>)}
      <p className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
        <ShieldCheck size={14}/>
        Aliases identify leaderboard positions, not permanent public profiles.
      </p>
    </div>);
}
export function AcademyPage() {
    return (<div className="page-container py-14">
      <PageHeading eyebrow="Three ways to build your future" title="Choose your academy" description="Programming, Cybersecurity, and AI Engineering. Different disciplines, the same commitment to practical understanding."/>
      <div className="grid gap-6 md:grid-cols-3">
        {Object.entries(academies).map(([key, academy], index) => (<Reveal key={key} delay={index * 65} className="h-full">
            <Link to={`/paths?academy=${key}`} className="panel motion-card group block h-full p-6 sm:p-7">
              <img src={academy.illustration} alt={academy.illustrationAlt} className="mb-6 h-56 w-full object-contain sm:h-60"/>
              <h2 className="text-2xl">{academy.name}</h2>
              <p className="muted mt-4">{academy.description}</p>
              <ul className="mb-8 mt-6 space-y-3">
                {academy.tags.map(tag => (<li key={tag} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <ArrowRight size={12} className={academy.color}/>
                    {tag}
                  </li>))}
              </ul>
              <span className="flex items-center justify-between border-t border-border pt-5 text-sm text-primary">
                Explore learning paths
                <ArrowUpRight size={16} className="motion-arrow"/>
              </span>
            </Link>
          </Reveal>))}
      </div>
    </div>);
}
