import { useState } from 'react';

interface SettlementEntry {
  user_id: string;
  username: string;
  avatar_url: string;
  wallet_address: string | null;
  total_reward: number;
  critical_issues: number;
  high_issues: number;
  medium_issues: number;
  low_issues: number;
}

interface SettlementProps {
  settlements: SettlementEntry[];
  loading: boolean;
  rewardCurrency: string;
}

export default function Settlement({ settlements, loading, rewardCurrency }: SettlementProps) {
  const [showToast, setShowToast] = useState(false);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (error) {
      console.error('Failed to copy:', error);
      alert('Failed to copy wallet address.');
    }
  };
  if (loading) {
    return (
      <div className="bg-pixel-bg-light border-2 border-pixel-border p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-pixel-accent mx-auto mb-4"></div>
          <p className="mt-4 text-pixel-text font-medium">Loading settlement data...</p>
        </div>
      </div>
    );
  }

  if (settlements.length === 0) {
    return (
      <div className="bg-pixel-bg-light border-2 border-pixel-border p-6">
        <div className="text-center py-8">
          <p className="text-pixel-text-muted">No rewards to settle.</p>
        </div>
      </div>
    );
  }

  const currencyIcon = rewardCurrency === 'USDC' ? '/images/usdc.png' : '/images/ton.svg';

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="bg-pixel-bg-light border-2 border-pixel-border p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-pixel text-pixel-text">Total Recipients</h3>
            <p className="text-3xl font-pixel text-pixel-accent mt-2">{settlements.length}</p>
          </div>
          <div>
            <h3 className="text-lg font-pixel text-pixel-text">Total Payout</h3>
            <div className="flex items-center gap-2 mt-2">
              <p className="text-3xl font-pixel text-pixel-accent">
                {settlements.reduce((sum, s) => sum + s.total_reward, 0).toLocaleString()}
              </p>
              <img src={currencyIcon} alt={rewardCurrency} className="w-8 h-8" />
            </div>
          </div>
        </div>
      </div>

      {/* Settlement List */}
      <div className="bg-pixel-bg-light border-2 border-pixel-border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-pixel-bg border-b-2 border-pixel-border">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-pixel-text-muted uppercase tracking-wider">
                  #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-pixel-text-muted uppercase tracking-wider">
                  Hunter
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-pixel-text-muted uppercase tracking-wider">
                  Wallet Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-pixel-text-muted uppercase tracking-wider">
                  Issues
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-pixel-text-muted uppercase tracking-wider">
                  Reward
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pixel-border">
              {settlements.map((settlement, index) => (
                <tr key={settlement.user_id} className="hover:bg-pixel-bg transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-pixel text-pixel-text">{index + 1}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      <img
                        className="h-10 w-10 rounded-full ring-2 ring-pixel-border"
                        src={settlement.avatar_url}
                        alt={settlement.username}
                      />
                      <span className="text-sm font-medium text-pixel-text">{settlement.username}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {settlement.wallet_address ? (
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-mono text-pixel-text">
                          {settlement.wallet_address}
                        </span>
                        <button
                          onClick={() => copyToClipboard(settlement.wallet_address!)}
                          className="p-2 hover:bg-pixel-bg transition-colors"
                          title="Copy wallet address"
                        >
                          <svg className="w-4 h-4 text-pixel-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <span className="text-sm text-pixel-danger font-medium">
                        No wallet address
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2 text-xs">
                      {settlement.critical_issues > 0 && (
                        <span className="bg-pixel-bg px-2 py-1 border border-pixel-border">
                          <span className="text-red-500">C:</span> {settlement.critical_issues}
                        </span>
                      )}
                      {settlement.high_issues > 0 && (
                        <span className="bg-pixel-bg px-2 py-1 border border-pixel-border">
                          <span className="text-orange-500">H:</span> {settlement.high_issues}
                        </span>
                      )}
                      {settlement.medium_issues > 0 && (
                        <span className="bg-pixel-bg px-2 py-1 border border-pixel-border">
                          <span className="text-yellow-500">M:</span> {settlement.medium_issues}
                        </span>
                      )}
                      {settlement.low_issues > 0 && (
                        <span className="bg-pixel-bg px-2 py-1 border border-pixel-border">
                          <span className="text-gray-400">L:</span> {settlement.low_issues}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-lg font-pixel text-pixel-accent">
                        {settlement.total_reward.toLocaleString()}
                      </span>
                      <img src={currencyIcon} alt={rewardCurrency} className="w-5 h-5" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Warning for missing wallet addresses */}
      {settlements.some(s => !s.wallet_address) && (
        <div className="bg-yellow-900/20 border-2 border-yellow-600 p-4">
          <div className="flex items-start space-x-3">
            <span className="text-yellow-500 text-xl">⚠</span>
            <div>
              <h4 className="text-sm font-medium text-yellow-500 mb-1">Missing Wallet Addresses</h4>
              <p className="text-xs text-yellow-200">
                Some hunters have not set their wallet addresses. They need to add their wallet address in their profile settings to receive rewards.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Toast notification */}
      {showToast && (
        <div className="fixed bottom-8 right-8 bg-pixel-success text-white px-6 py-4 border-2 border-pixel-border shadow-lg animate-fade-in z-50">
          <div className="flex items-center space-x-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-medium">Wallet address copied to clipboard!</span>
          </div>
        </div>
      )}
    </div>
  );
}
