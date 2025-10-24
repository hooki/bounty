import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useDashboard } from '../hooks/useDashboard';

export default function DashboardPage() {
  const { user } = useAuth();
  const { stats, loading, error } = useDashboard();
  const [selectedCurrency, setSelectedCurrency] = useState<'TON' | 'USDC'>('TON');

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h1 className="text-lg font-medium text-red-800 mb-2">Error Loading Dashboard</h1>
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="pixel-card bg-pixel-bg-light border-pixel-border p-8">
        <div>
          <h1 className="text-2xl font-pixel text-pixel-text mb-3">
            Welcome back, {user?.user_metadata?.user_name}!
          </h1>
          <p className="text-pixel-text-muted">
            Ready to hunt some bounties? Your bounty adventure awaits.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Active Missions Card */}
        <div className="pixel-card bg-pixel-bg-light border-pixel-border hover:border-pixel-accent transition-all duration-200">
          <div className="mb-3">
            <div className="text-pixel-text-muted mb-2 uppercase tracking-wider">Active Missions</div>
            <div className="text-2xl font-pixel text-pixel-text">
              {loading ? '...' : stats.activeProjects}
            </div>
          </div>
        </div>

        {/* Bug Hunt Score Card */}
        <div className="pixel-card bg-pixel-bg-light border-pixel-border hover:border-pixel-accent transition-all duration-200">
          <div className="mb-3">
            <div className="text-pixel-text-muted mb-2 uppercase tracking-wider">Issues Discovered</div>
            <div className="text-2xl font-pixel text-pixel-text">
              {loading ? '...' : stats.reportedIssues}
            </div>
          </div>
        </div>

        {/* Bounty Rewards Card */}
        <div className="pixel-card bg-pixel-bg-light border-pixel-border hover:border-pixel-accent transition-all duration-200">
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <div className="text-pixel-text-muted uppercase tracking-wider">Bounty Status</div>
              <div className="text-xs flex items-center gap-1 bg-pixel-bg border border-pixel-border">
                <button
                  onClick={() => setSelectedCurrency('TON')}
                  className={`px-3 py-1 font-pixel transition-colors ${selectedCurrency === 'TON'
                    ? 'bg-pixel-accent text-white'
                    : 'text-pixel-text-muted hover:text-pixel-text'
                    }`}
                >
                  TON
                </button>
                <button
                  onClick={() => setSelectedCurrency('USDC')}
                  className={`px-3 py-1 font-pixel transition-colors ${selectedCurrency === 'USDC'
                    ? 'bg-pixel-accent text-white'
                    : 'text-pixel-text-muted hover:text-pixel-text'
                    }`}
                >
                  USDC
                </button>
              </div>
            </div>
            <div className="text-2xl font-pixel text-pixel-accent mb-2 flex items-center gap-2">
              {loading ? (
                '...'
              ) : (
                <>
                  <span>
                    {selectedCurrency === 'TON'
                      ? stats.totalBountyTON.toLocaleString()
                      : stats.totalBountyUSDC.toLocaleString()}
                  </span>
                  <img
                    src={selectedCurrency === 'USDC' ? '/images/usdc.png' : '/images/ton.svg'}
                    alt={selectedCurrency}
                    className="w-6 h-6"
                  />
                </>
              )}
            </div>
            <p className="text-pixel-text-muted">
              {loading ? (
                'Loading...'
              ) : (
                <>
                  Earned{' '}
                  {selectedCurrency === 'TON'
                    ? stats.earnedBountyTON.toLocaleString()
                    : stats.earnedBountyUSDC.toLocaleString()}{' '}
                  + Pending{' '}
                  {selectedCurrency === 'TON'
                    ? stats.pendingBountyTON.toLocaleString()
                    : stats.pendingBountyUSDC.toLocaleString()}
                </>
              )}
            </p>
          </div>
        </div>
      </div>


      {/* Action Center */}
      <div className="pixel-card bg-pixel-bg-light border-pixel-border">
        <div className="px-6 py-4 border-b-4 border-pixel-border">
          <h2 className="text-2xl font-pixel text-pixel-text">
            Participant Command Center
          </h2>
          <p className="text-pixel-text-muted mt-2">Choose your next adventure</p>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Create Mission Card */}
            <Link
              to="/projects"
              className="group pixel-card bg-pixel-bg border-pixel-border hover:border-pixel-accent transition-all duration-200"
            >
              <div className="text-center">
                <h3 className="text-2xl font-pixel text-pixel-text mb-3 group-hover:text-pixel-accent">
                  Launch New Mission
                </h3>
                <p className="text-pixel-text-muted mb-4">
                  Deploy a new bounty mission.
                </p>
                <div className="inline-flex items-center text-pixel-accent">
                  <span>Deploy Mission</span>
                  <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>
            </Link>

            {/* Browse Missions Card */}
            <Link
              to="/issues"
              className="group pixel-card bg-pixel-bg border-pixel-border hover:border-pixel-accent transition-all duration-200"
            >
              <div className="text-center">
                <h3 className="text-2xl font-pixel text-pixel-text mb-3 group-hover:text-pixel-accent">
                  Join Active Hunts
                </h3>
                <p className="text-pixel-text-muted mb-4">
                  Explore ongoing missions and get your rewards.
                </p>
                <div className="inline-flex items-center text-pixel-accent">
                  <span>Start Hunting</span>
                  <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
