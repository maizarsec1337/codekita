/**
 * CodeKita - Cybersecurity Labs Component
 * Interactive cybersecurity labs and CTF challenges
 */

import type { Vulnerability, CTFChallenge } from '../types';

interface CybersecurityLabsProps {
  vulnerabilities: Vulnerability[];
  ctfChallenges: CTFChallenge[];
  onChallengeSelect: (challengeId: string) => void;
}

export const CybersecurityLabs: React.FC<CybersecurityLabsProps> = ({
  vulnerabilities,
  ctfChallenges,
  onChallengeSelect,
}) => {
  return (
    <div className="cybersecurity-labs space-y-6">
      {/* Vulnerability Labs Section */}
      <div>
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          Vulnerability Labs
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {vulnerabilities.map((vuln) => (
            <div key={vuln.id}>
              <div className="p-4 rounded border-l-4">
                <div
                  className={
                    vuln.severity === 'critical'
                      ? 'bg-red-50 border-red-500'
                      : vuln.severity === 'high'
                      ? 'bg-red-50 border-red-300'
                      : vuln.severity === 'medium'
                      ? 'bg-yellow-50 border-yellow-300'
                      : 'bg-green-50 border-green-300'
                  }
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-gray-700">{vuln.name}</h4>
                      <p className="text-sm text-gray-500 mt-1">{vuln.description}</p>
                    </div>
                    <span
                      className={
                        vuln.severity === 'critical'
                          ? 'bg-red-100 text-red-600'
                          : vuln.severity === 'high'
                          ? 'bg-red-100 text-red-300'
                          : vuln.severity === 'medium'
                          ? 'bg-yellow-100 text-yellow-600'
                          : 'bg-green-100 text-green-600'
                      }
                    >
                      {vuln.severity}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTF Challenges Section */}
      <div>
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          Capture The Flag Challenges
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ctfChallenges.map((challenge) => (
            <div
              key={challenge.id}
               className="p-4 rounded hover:bg-gray-50 transition-colors cursor-pointer hover:underline"
              onClick={() => onChallengeSelect(challenge.id)}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">
                  {challenge.category.toUpperCase()}
                </span>
                <span className="text-xs text-gray-400">{challenge.points} pts</span>
              </div>
              <h4 className="font-medium text-gray-700 line-clamp-2">
                {challenge.title}
              </h4>
              <p className="text-xs text-gray-400 line-clamp-1">
                {challenge.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};