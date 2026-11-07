/**
 * CodeKita - Pillar Cards Component
 * Displays the three main pillars of the platform
 */

import type { Pillar, LearningPath } from '../types';

interface PillarCardProps {
  pillar: Pillar;
  paths: LearningPath[];
  onSelect: (pillar: Pillar) => void;
}

export const PillarCard: React.FC<PillarCardProps> = ({ pillar, paths, onSelect }) => {

  const pillarData: Record<Pillar, { title: string; description: string; color: string }> = {
    programming: {
      title: 'Programming & Software Development',
      description: 'Build modern applications with full-stack, mobile, and backend development skills',
      color: '#3B82F6',
    },
    cybersecurity: {
      title: 'Cybersecurity & Ethical Hacking',
      description: 'Learn information security, vulnerability analysis, and legal system protection',
      color: '#EF4444',
    },
    'ai-engineering': {
      title: 'AI Engineering',
      description: 'Develop and integrate artificial intelligence in modern technology systems',
      color: '#8B5CF6',
    },
  };

  const data = pillarData[pillar];
  const pathCount = paths.filter((p) => p.pillar === pillar).length;

  return (
    <div
      className="pillar-card cursor-pointer hover:translate-y-1 transition-transform duration-300 group"
      onClick={() => onSelect(pillar)}
    >
      <div className="relative group-hover:opacity-90 transition-opacity">
        <div className="h-12 w-12 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: data.color }}>
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {pillar === 'programming'
              ? '<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.99M21 21l-6-6m2-5a4 4 0 11-8 0 4 4 0 018 0m7 7h-1v-4h-1m-1 4h.99M11 21l6-6m2-5a4 4 0 11-8 0 4 4 0 018 0"/>'
              : pillar === 'cybersecurity'
              ? '<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2zm0 0v2m-6 4h12m0 0v2m-6 4h12m0 0v2m-6 4h12"/>'
              : '<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H7a2 2 0 00-2 2v6a2 2 0 002-2m10 0V9a2 2 0 012-2h4a2 2 0 012 2v6a2 2 0 01-2 2m0 0V5a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2m10 0a2 2 0 012-2h4a2 2 0 012 2v6a2 2 0 01-2-2M7 7l5 5V7m5 0v11m0-11l-5 5"/>'
        }
          </svg>
        </div>
        <h3 className="text-xl font-bold text-white text-center">{data.title}</h3>
        <p className="text-sm text-opacity-80 text-center line-clamp-2">{data.description}</p>
      </div>
      <div className="absolute bottom-2 right-2 bg-white/20 px-3 py-1 rounded text-xs text-opacity-90">
        {pathCount} paths
      </div>
    </div>
  );
};