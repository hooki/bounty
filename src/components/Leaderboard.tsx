
interface LeaderboardEntry {
  project_id: string;
  project_title: string;
  user_id: string;
  username: string;
  avatar_url: string;
  total_issues: number;
  critical_issues: number;
  high_issues: number;
  medium_issues: number;
  low_issues: number;
  valid_issues: number;
  estimated_reward: number;
  reward_currency?: string;
}

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  loading: boolean;
  projectTitle?: string;
}

export default function Leaderboard({ entries, loading, projectTitle }: LeaderboardProps) {
  if (loading) {
    return (
      <div className="bg-pixel-bg-light border-2 border-pixel-border p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-pixel-accent mx-auto mb-4"></div>
          <p className="mt-4 text-pixel-text font-medium">Loading hunter rankings...</p>
        </div>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="bg-pixel-bg-light border-2 border-pixel-border p-6">
        <div className="text-center py-8">
          <p className="text-pixel-text-muted">No hunters have joined the mission yet.</p>
          <p className="text-pixel-text-muted text-sm mt-2">Be the first to discover vulnerabilities!</p>
        </div>
      </div>
    );
  }

  const getRankBadge = (index: number) => {
    const rankColors = [
      'bg-yellow-500 text-white',
      'bg-gray-400 text-white',
      'bg-orange-600 text-white',
      'bg-pixel-accent text-white'
    ];

    return (
      <div className={`w-10 h-10 ${rankColors[index] || rankColors[3]} border-2 border-pixel-border flex items-center justify-center text-sm font-pixel`}>
        {index + 1}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {entries.map((entry, index) => (
        <div key={`${entry.project_id}-${entry.user_id}`} className="bg-pixel-bg-light border-2 border-pixel-border p-4 sm:p-6 hover:border-pixel-accent transition-colors">
          <div className="flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-4">
            {/* Content */}
            <div className="flex-1 min-w-0 w-full">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
                <div className="flex items-center space-x-4">
                  {/* Rank Badge & Avatar */}
                  <div className="flex items-center space-x-4 sm:flex-col sm:space-x-0 sm:space-y-2">
                    <div className="flex-shrink-0">
                      {getRankBadge(index)}
                    </div>
                  </div>

                  <div className="flex-shrink-0">
                    <img
                      className="h-12 w-12 rounded-full ring-2 ring-pixel-border"
                      src={entry.avatar_url}
                      alt={entry.username}
                    />
                  </div>
                  <div>
                    <p className="text-lg font-pixel text-pixel-text">
                      {entry.username}
                    </p>
                    {!projectTitle && (
                      <p className="text-sm text-pixel-text-muted mt-1">
                        {entry.project_title}
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <div className="text-xl font-pixel text-pixel-accent flex items-center sm:justify-end gap-2">
                    <span>{entry.estimated_reward.toLocaleString()}</span>
                    <img
                      src={entry.reward_currency === 'USDC' ? '/images/usdc.png' : '/images/ton.svg'}
                      alt={entry.reward_currency || 'TON'}
                      className="w-6 h-6"
                    />
                  </div>
                  <p className="text-xs text-pixel-text-muted uppercase tracking-wider">Bounty Earnings</p>
                </div>
              </div>

              {/* Severity Breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="text-center p-3 bg-pixel-bg border-2 border-pixel-border">
                  <div className="text-xs text-red-500 font-medium mb-1 uppercase tracking-wider">
                    Critical
                  </div>
                  <div className="text-lg font-pixel text-pixel-text">{entry.critical_issues}</div>
                </div>
                <div className="text-center p-3 bg-pixel-bg border-2 border-pixel-border">
                  <div className="text-xs text-orange-500 font-medium mb-1 uppercase tracking-wider">
                    High
                  </div>
                  <div className="text-lg font-pixel text-pixel-text">{entry.high_issues}</div>
                </div>
                <div className="text-center p-3 bg-pixel-bg border-2 border-pixel-border">
                  <div className="text-xs text-yellow-500 font-medium mb-1 uppercase tracking-wider">
                    Medium
                  </div>
                  <div className="text-lg font-pixel text-pixel-text">{entry.medium_issues}</div>
                </div>
                <div className="text-center p-3 bg-pixel-bg border-2 border-pixel-border">
                  <div className="text-xs text-gray-400 font-medium mb-1 uppercase tracking-wider">
                    Low
                  </div>
                  <div className="text-lg font-pixel text-pixel-text">{entry.low_issues}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}