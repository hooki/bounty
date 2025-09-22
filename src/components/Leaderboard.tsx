
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
}

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  loading: boolean;
  projectTitle?: string;
}

export default function Leaderboard({ entries, loading, projectTitle }: LeaderboardProps) {
  if (loading) {
    return (
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-xl shadow-2xl p-6">
        <div className="text-center py-8">
          <div className="text-5xl mb-4 animate-bounce-slow">🏆</div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-4 border-primary-500 mx-auto mb-4"></div>
          <p className="mt-4 text-white font-medium">Loading hunter rankings...</p>
          <div className="mt-2 text-gray-400 text-sm">🥷 Calculating bounty scores</div>
        </div>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-xl shadow-2xl p-6">
        <h3 className="text-lg font-medium text-white mb-4 flex items-center space-x-2">
          <span>🏆</span>
          <span>{projectTitle ? `${projectTitle} Participants Rankings` : 'Global Participants Rankings'}</span>
        </h3>
        <div className="text-center py-8">
          <div className="text-6xl mb-4">🥷</div>
          <p className="text-gray-400">No hunters have joined the mission yet.</p>
          <p className="text-gray-500 text-sm mt-2">Be the first to discover vulnerabilities!</p>
        </div>
      </div>
    );
  }

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <span className="text-3xl animate-pulse-fast">🥇</span>;
      case 1:
        return <span className="text-3xl">🥈</span>;
      case 2:
        return <span className="text-3xl">🥉</span>;
      default:
        return <span className="w-10 h-10 bg-gradient-to-r from-primary-600 to-primary-700 rounded-full flex items-center justify-center text-sm font-bold text-white">{index + 1}</span>;
    }
  };

  return (
    <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-xl shadow-2xl">
      <div className="divide-y divide-gray-700">
        {entries.map((entry, index) => (
          <div key={`${entry.project_id}-${entry.user_id}`} className="group p-6 hover:bg-gray-800/50 transition-all duration-300">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                {getRankIcon(index)}
              </div>

              <div className="flex-shrink-0">
                <img
                  className="h-12 w-12 rounded-full ring-2 ring-primary-500/50"
                  src={entry.avatar_url}
                  alt={entry.username}
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-bold text-white group-hover:text-primary-300 flex items-center space-x-2">
                      <span>🥷</span>
                      <span>{entry.username}</span>
                    </p>
                    {!projectTitle && (
                      <p className="text-sm text-gray-400 flex items-center space-x-1">
                        <span>🎯</span>
                        <span>{entry.project_title}</span>
                      </p>
                    )}
                  </div>

                  <div className="text-right">
                    <p className="text-xl font-bold text-neon-green animate-pulse-fast">
                      💰 {entry.estimated_reward.toLocaleString()} TON
                    </p>
                    <p className="text-sm text-gray-400">Bounty Earnings</p>
                  </div>
                </div>

                <div className="mt-3 flex items-center space-x-6 text-sm text-gray-400">
                  <div className="flex items-center space-x-2">
                    <span>✅</span>
                    <span className="font-bold text-white">{entry.valid_issues}</span>
                    <span>Confirmed Issues</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span>🐛</span>
                    <span className="font-bold text-white">{entry.total_issues}</span>
                    <span>Total Reports</span>
                  </div>
                </div>

                {/* Threat Level Breakdown */}
                <div className="mt-4 grid grid-cols-4 gap-3">
                  <div className="text-center p-3 bg-gradient-to-r from-red-600 to-red-700 rounded-lg">
                    <div className="text-xs text-white font-bold mb-1 flex items-center justify-center space-x-1">
                      <span>🔴</span>
                      <span>Critical</span>
                    </div>
                    <div className="text-lg font-bold text-white">{entry.critical_issues}</div>
                  </div>
                  <div className="text-center p-3 bg-gradient-to-r from-orange-600 to-orange-700 rounded-lg">
                    <div className="text-xs text-white font-bold mb-1 flex items-center justify-center space-x-1">
                      <span>🟠</span>
                      <span>High</span>
                    </div>
                    <div className="text-lg font-bold text-white">{entry.high_issues}</div>
                  </div>
                  <div className="text-center p-3 bg-gradient-to-r from-yellow-600 to-yellow-700 rounded-lg">
                    <div className="text-xs text-white font-bold mb-1 flex items-center justify-center space-x-1">
                      <span>🟡</span>
                      <span>Medium</span>
                    </div>
                    <div className="text-lg font-bold text-white">{entry.medium_issues}</div>
                  </div>
                  <div className="text-center p-3 bg-gradient-to-r from-green-600 to-green-700 rounded-lg">
                    <div className="text-xs text-white font-bold mb-1 flex items-center justify-center space-x-1">
                      <span>🟢</span>
                      <span>Low</span>
                    </div>
                    <div className="text-lg font-bold text-white">{entry.low_issues}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}