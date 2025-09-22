import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useDashboard } from '../hooks/useDashboard';

export default function DashboardPage() {
  const { user } = useAuth();
  const { stats, loading, error } = useDashboard();

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
      {/* Hero Section with Gaming Theme */}
      <div className="relative bg-gradient-gaming rounded-xl shadow-2xl p-8 overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10">
          <div className="flex items-center space-x-4 mb-4">
            <div className="text-6xl animate-float">🎮</div>
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Welcome back, Hunter {user?.user_metadata?.user_name}!
              </h1>
              <p className="text-white/90 text-lg">
                🚀 Ready to hunt some bugs? Your cybersecurity adventure awaits!
              </p>
            </div>
          </div>

          {/* Gaming Style Progress Bar */}
          {/* <div className="mt-6 bg-black/30 rounded-full p-1">
            <div className="bg-gradient-to-r from-neon-green to-neon-blue h-3 rounded-full w-3/4 animate-pulse-fast"></div>
          </div>
          <p className="text-white/80 text-sm mt-2">🏆 Bug Hunter Level: Elite • Next: Legend (150 XP needed)</p> */}
        </div>

        {/* Floating Elements */}
        <div className="absolute top-4 right-4 text-4xl animate-bounce-slow">⚡</div>
        <div className="absolute bottom-4 right-12 text-3xl animate-float" style={{ animationDelay: '1s' }}>💰</div>
        <div className="absolute top-1/2 right-8 text-2xl animate-float" style={{ animationDelay: '2s' }}>🔥</div>
      </div>

      {/* Gaming Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Active Missions Card */}
        <div className="group relative bg-gradient-to-br from-primary-600 to-primary-800 rounded-xl shadow-xl p-6 transform hover:scale-105 transition-all duration-300 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="text-5xl animate-pulse-fast">🎯</div>
              <div className="text-white/80 text-xs bg-white/20 px-2 py-1 rounded-full">MISSIONS</div>
            </div>
            <div>
              <p className="text-white/90 text-sm font-medium mb-1">Active Missions</p>
              <div className="flex items-end space-x-2">
                <p className="text-3xl font-bold text-white">
                  {loading ? '...' : stats.activeProjects}
                </p>
                <div className="text-lg">🏆</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bug Hunt Score Card */}
        <div className="group relative bg-gradient-to-br from-gaming-600 to-gaming-800 rounded-xl shadow-xl p-6 transform hover:scale-105 transition-all duration-300 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="text-5xl animate-bounce-slow">🐛</div>
              <div className="text-white/80 text-xs bg-white/20 px-2 py-1 rounded-full">HUNT SCORE</div>
            </div>
            <div>
              <p className="text-white/90 text-sm font-medium mb-1">Issues Discovered</p>
              <div className="flex items-end space-x-2">
                <p className="text-3xl font-bold text-white">
                  {loading ? '...' : stats.reportedIssues}
                </p>
                <div className="text-lg">🔍</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bounty Rewards Card */}
        <div className="group relative bg-gradient-to-br from-cyber-600 to-cyber-800 rounded-xl shadow-xl p-6 transform hover:scale-105 transition-all duration-300 overflow-hidden animate-glow">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="text-5xl animate-float">💎</div>
              <div className="text-white/80 text-xs bg-white/20 px-2 py-1 rounded-full">BOUNTY</div>
            </div>
            <div>
              <p className="text-white/90 text-sm font-medium mb-1">Expected Bounty</p>
              <div className="flex items-end space-x-2">
                <p className="text-3xl font-bold text-white">
                  {loading ? '$...' : `$${stats.expectedReward.toLocaleString()}`}
                </p>
                <div className="text-lg">⚡</div>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Gaming Action Center */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-xl shadow-2xl overflow-hidden">
        <div className="relative px-6 py-4 bg-gradient-to-r from-primary-600/20 to-cyber-600/20 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <span>⚔️</span>
            <span>Participant Command Center</span>
            <span className="animate-pulse">⚔️</span>
          </h2>
          <p className="text-gray-300 text-sm mt-1">Choose your next adventure, brave hunter!</p>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Create Mission Card */}
            <Link
              to="/projects"
              className="group relative bg-gradient-to-br from-primary-500/20 to-primary-700/20 border-2 border-primary-500/30 rounded-xl p-6 hover:border-primary-400 hover:shadow-2xl hover:shadow-primary-500/25 transition-all duration-300 transform hover:scale-105"
            >
              <div className="text-center">
                <div className="text-6xl mb-4 group-hover:animate-bounce-slow">🚀</div>
                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-primary-300">
                  Launch New Mission
                </h3>
                <p className="text-gray-300 text-sm">
                  🎯 Deploy a new bug hunting expedition. Connect your GitHub repository and start your cybersecurity quest!
                </p>
                <div className="mt-4 inline-flex items-center text-primary-400 text-sm font-medium">
                  <span>Deploy Mission</span>
                  <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>
            </Link>

            {/* Browse Missions Card */}
            <Link
              to="/issues"
              className="group relative bg-gradient-to-br from-cyber-500/20 to-cyber-700/20 border-2 border-cyber-500/30 rounded-xl p-6 hover:border-cyber-400 hover:shadow-2xl hover:shadow-cyber-500/25 transition-all duration-300 transform hover:scale-105"
            >
              <div className="text-center">
                <div className="text-6xl mb-4 group-hover:animate-pulse-fast">🕵️</div>
                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-cyber-300">
                  Join Active Hunts
                </h3>
                <p className="text-gray-300 text-sm">
                  🔍 Explore ongoing missions and discover security vulnerabilities. Earn bounties for your discoveries!
                </p>
                <div className="mt-4 inline-flex items-center text-cyber-400 text-sm font-medium">
                  <span>Start Hunting</span>
                  <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>
            </Link>
          </div>

          {/* Quick Access Buttons
          <div className="mt-8 flex flex-wrap gap-4 justify-center">
            <Link
              to="/issues"
              className="bg-gradient-to-r from-gaming-600 to-gaming-700 hover:from-gaming-500 hover:to-gaming-600 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 flex items-center space-x-2"
            >
              <span>🐛</span>
              <span>View All Bugs</span>
            </Link>
          </div> */}
        </div>
      </div>
    </div>
  );
}
