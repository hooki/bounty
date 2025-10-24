
interface RewardBreakdownProps {
  breakdown: Record<string, {
    totalPool: number;
    issueCount: number;
    individualReward: number;
    issues: Array<{
      reporter: string;
      avatar_url: string;
      reward: number;
    }>;
  }>;
  loading: boolean;
  onCalculate: () => void;
}

export default function RewardBreakdown({ breakdown, loading, onCalculate }: RewardBreakdownProps) {
  const severityOrder = ['critical', 'high', 'medium', 'low'];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-50 border-red-200';
      case 'high': return 'bg-orange-50 border-orange-200';
      case 'medium': return 'bg-yellow-50 border-yellow-200';
      case 'low': return 'bg-blue-50 border-blue-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const getSeverityTextColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-800';
      case 'high': return 'text-orange-800';
      case 'medium': return 'text-yellow-800';
      case 'low': return 'text-blue-800';
      default: return 'text-gray-800';
    }
  };

  const totalRewardsPaid = Object.values(breakdown).reduce((sum, data) => {
    return sum + (data.individualReward * data.issueCount);
  }, 0);

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Reward Distribution</h3>
            <p className="text-2xl text-gray-600">Actual reward distribution status when project ends</p>
          </div>
          <button
            onClick={onCalculate}
            disabled={loading}
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-2xl font-medium disabled:opacity-50"
          >
            {loading ? 'Calculating...' : 'Calculate Rewards'}
          </button>
        </div>
      </div>

      {Object.keys(breakdown).length === 0 ? (
        <div className="p-6 text-center text-gray-500">
          <p className="mb-4">Click the calculate rewards button to check the current reward distribution status.</p>
          <div className="text-sm text-left bg-blue-50 border border-blue-200 rounded p-3">
            <p className="font-medium text-blue-800 mb-2">Reward Distribution Rules:</p>
            <ul className="text-blue-700 space-y-1">
              <li>• Each severity level has its own reward pool</li>
              <li>• Rewards are distributed equally among valid issues of the same severity</li>
              <li>• Only 'solved' and 'acknowledged' issues receive rewards</li>
              <li>• 'Invalid' and 'duplicated' issues are excluded from rewards</li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="p-6">
          {/* 요약 */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                ${totalRewardsPaid.toLocaleString()}
              </div>
              <div className="text-2xl text-gray-600">Total Expected Rewards</div>
            </div>
          </div>

          {/* 심각도별 분배 */}
          <div className="space-y-6">
            {severityOrder.map((severity) => {
              const data = breakdown[severity];
              if (!data || data.issueCount === 0) return null;

              return (
                <div
                  key={severity}
                  className={`border rounded-lg p-4 ${getSeverityColor(severity)}`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className={`text-lg font-medium capitalize ${getSeverityTextColor(severity)}`}>
                        {severity} Severity
                      </h4>
                      <p className="text-2xl text-gray-600">
                        Total {data.issueCount} issues · ${data.individualReward.toLocaleString()} each
                      </p>
                    </div>
                    <div className="text-right">
                      <div className={`text-xl font-bold ${getSeverityTextColor(severity)}`}>
                        ${data.totalPool.toLocaleString()}
                      </div>
                      <div className="text-2xl text-gray-600">Reward Pool</div>
                    </div>
                  </div>

                  {/* 수혜자 목록 */}
                  <div className="space-y-2">
                    {data.issues.map((issue, index) => (
                      <div
                        key={`${issue.reporter}-${index}`}
                        className="flex items-center justify-between bg-white/60 rounded p-3"
                      >
                        <div className="flex items-center space-x-3">
                          <img
                            className="h-8 w-8 rounded-full"
                            src={issue.avatar_url}
                            alt={issue.reporter}
                          />
                          <span className="font-medium text-gray-900">
                            {issue.reporter}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-gray-900">
                            {issue.reward.toLocaleString()} TON
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}