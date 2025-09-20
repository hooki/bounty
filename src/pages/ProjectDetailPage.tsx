import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProjects } from '../hooks/useProjects';
import { useIssues } from '../hooks/useIssues';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { useRewardCalculation } from '../hooks/useLeaderboard';
import { useAuth } from '../contexts/AuthContext';
import IssueList from '../components/IssueList';
import IssueForm from '../components/IssueForm';
import Leaderboard from '../components/Leaderboard';
import RewardBreakdown from '../components/RewardBreakdown';

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { projects, updateProjectStatus } = useProjects();
  const { issues, loading: issuesLoading, createIssue } = useIssues(id);
  const { leaderboard, loading: leaderboardLoading } = useLeaderboard(id ?? '');
  const { rewardBreakdown, loading: rewardLoading, calculateRewards } = useRewardCalculation(id ?? '');

  const [activeTab, setActiveTab] = useState<'overview' | 'issues' | 'leaderboard' | 'rewards'>('overview');
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  const project = projects.find(p => p.id === id);

  useEffect(() => {
    if (!project && projects.length > 0) {
      navigate('/projects');
    }
  }, [project, projects, navigate]);

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce-slow">🚀</div>
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-primary-500 mx-auto mb-4"></div>
          <p className="mt-4 text-white font-medium">Loading mission details...</p>
          <div className="mt-2 text-gray-400 text-sm">🎯 Accessing mission database</div>
        </div>
      </div>
    );
  }

  const isOwner = user?.id === project.owner_id;

  const handleCreateIssue = async (issueData: any) => {
    try {
      setFormLoading(true);
      await createIssue({
        ...issueData,
        project_id: id!,
      });
      setShowIssueForm(false);
    } catch (error) {
      console.error('Issue creation failed:', error);
      alert(error instanceof Error ? error.message : 'Failed to create issue.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleIssueClick = (issue: any) => {
    navigate(`/issues/${issue.id}`);
  };

  const handleStatusChange = async (newStatus: 'active' | 'closed') => {
    try {
      await updateProjectStatus(project.id, newStatus);
    } catch (error) {
      console.error('Status change failed:', error);
      alert('Failed to change status.');
    }
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: '📋' },
    { id: 'issues', name: 'Issues', icon: '🐛', count: issues.length },
    { id: 'leaderboard', name: 'Leaderboard', icon: '🏆' },
    // { id: 'rewards', name: 'Rewards', icon: '💰' },
  ];

  return (
    <div className="space-y-6">
      {/* Mission Command Center */}
      <div className="relative bg-gradient-to-r from-primary-600 via-cyber-600 to-gaming-600 rounded-xl shadow-2xl p-8 overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10 flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-4 mb-4 justify-between">
              <div className="flex items-center space-x-4">
                <h1 className="text-3xl font-bold text-white">{project.title}</h1>
                <span
                  className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold ${project.status === 'active'
                    ? 'bg-gradient-to-r from-neon-green to-cyber-500 text-black animate-pulse-fast'
                    : 'bg-gradient-to-r from-gray-600 to-gray-700 text-gray-300'
                    }`}
                >
                  {project.status === 'active' ? '🟢 ACTIVE' : '🔴 CLOSED'}
                </span>
              </div>

              {isOwner && project.status === 'active' && (
                <div>
                  <button
                    onClick={() => handleStatusChange('closed')}
                    className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white px-6 py-3 rounded-lg font-bold transition-all duration-300 transform hover:scale-105 flex items-center space-x-2"
                  >
                    <span>🛑</span>
                    <span>Terminate Mission</span>
                  </button>
                </div>
              )}
            </div>

            <div className="prose prose-sm max-w-none mb-6">
              <p className="text-white/90 text-lg">{project.description}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-black/30 rounded-xl p-4 border border-white/20">
                <div className="text-sm text-white/80 flex items-center space-x-1">
                  <span>💰</span>
                  <span>Bounty Pool</span>
                </div>
                <div className="text-3xl font-bold text-neon-green animate-pulse-fast">
                  ${project.total_reward_pool.toLocaleString()}
                </div>
              </div>
              <div className="bg-black/30 rounded-xl p-4 border border-white/20">
                <div className="text-sm text-white/80 flex items-center space-x-1">
                  <span>🔗</span>
                  <span>Target Repository</span>
                </div>
                <div className="text-sm font-medium text-cyber-400 truncate">
                  <a href={project.repository_url} target="_blank" rel="noopener noreferrer" className="hover:text-cyber-300">
                    {project.repository_url.replace('https://github.com/', '')}
                  </a>
                </div>
                <div className="text-xs text-white/60 flex items-center space-x-1 mt-1">
                  <span>🌿</span>
                  <span>{project.branch_name}</span>
                </div>
              </div>
              <div className="bg-black/30 rounded-xl p-4 border border-white/20">
                <div className="text-sm text-white/80 flex items-center space-x-1">
                  <span>📁</span>
                  <span>Target Files</span>
                </div>
                <div className="text-3xl font-bold text-white">
                  {project.selected_files.length}
                </div>
              </div>
            </div>

            {/* Bounty Distribution */}
            <div className="grid grid-cols-4 gap-3">
              {Object.entries(project.reward_distribution as Record<string, number>).map(([severity, amount]) => (
                <div key={severity} className="text-center p-4 bg-black/40 rounded-xl border border-white/20">
                  <div className="text-xs text-white/80 capitalize font-medium mb-2 flex items-center justify-center space-x-1">
                    <span>
                      {severity === 'critical' && '🔴'}
                      {severity === 'high' && '🟠'}
                      {severity === 'medium' && '🟡'}
                      {severity === 'low' && '🟢'}
                    </span>
                    <span>{severity}</span>
                  </div>
                  <div className="text-lg font-bold text-white">${amount.toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-4 right-20 text-3xl animate-float">⚡</div>
        <div className="absolute bottom-4 right-32 text-2xl animate-bounce-slow">💎</div>
      </div>

      {/* Mission Control Tabs */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-xl shadow-2xl">
        <div className="border-b border-gray-700">
          <div className="flex items-center space-x-2 p-6 pb-0">
            <h2 className="text-lg font-bold text-white">Mission Control Center</h2>
          </div>
          <nav className="-mb-px flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-all duration-300 ${activeTab === tab.id
                  ? 'border-primary-500 text-primary-400 transform scale-105'
                  : 'border-transparent text-gray-400 hover:text-white hover:border-gray-500'
                  }`}
              >
                <span className="text-lg">{tab.icon}</span>
                <span>{tab.name}</span>
                {tab.count !== undefined && (
                  <span className="bg-primary-600 text-white py-1 px-2 rounded-full text-xs animate-pulse-fast">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-white mb-4 flex items-center space-x-2">
                  <span>📁</span>
                  <span>Target Files</span>
                </h3>
                <div className="bg-gray-800/50 rounded-xl p-4 max-h-64 overflow-y-auto border border-gray-700">
                  {project.selected_files.map((file, index) => (
                    <div key={index} className="text-sm font-mono text-gray-300 py-1 hover:text-white transition-colors">
                      📄 {file}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-white mb-4 flex items-center space-x-2">
                  <span>📈</span>
                  <span>Mission Statistics</span>
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-xl p-4 text-center transform hover:scale-105 transition-all duration-300">
                    <div className="text-3xl font-bold text-white">{issues.length}</div>
                    <div className="text-sm text-white/80 flex items-center justify-center space-x-1">
                      <span>🐛</span>
                      <span>Total Bugs</span>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-cyber-600 to-cyber-800 rounded-xl p-4 text-center transform hover:scale-105 transition-all duration-300">
                    <div className="text-3xl font-bold text-white">
                      {issues.filter(i => i.status === 'open').length}
                    </div>
                    <div className="text-sm text-white/80 flex items-center justify-center space-x-1">
                      <span>🔓</span>
                      <span>Active Hunts</span>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-gaming-600 to-gaming-800 rounded-xl p-4 text-center transform hover:scale-105 transition-all duration-300">
                    <div className="text-3xl font-bold text-white">
                      {issues.filter(i => ['solved', 'acknowledged'].includes(i.status)).length}
                    </div>
                    <div className="text-sm text-white/80 flex items-center justify-center space-x-1">
                      <span>✅</span>
                      <span>Eliminated</span>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-neon-purple/60 to-primary-700 rounded-xl p-4 text-center transform hover:scale-105 transition-all duration-300">
                    <div className="text-3xl font-bold text-white">
                      {leaderboard.length}
                    </div>
                    <div className="text-sm text-white/80 flex items-center justify-center space-x-1">
                      <span>🥷</span>
                      <span>Hunters</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'issues' && (
            <div>
              {showIssueForm ? (
                <IssueForm
                  projectId={id!}
                  onSubmit={handleCreateIssue}
                  onCancel={() => setShowIssueForm(false)}
                  loading={formLoading}
                />
              ) : (
                <IssueList
                  issues={issues}
                  loading={issuesLoading}
                  onIssueClick={handleIssueClick}
                  showProjectTitle={false}
                  showReportButton={project.status === 'active'}
                  onReportClick={() => setShowIssueForm(true)}
                />
              )}
            </div>
          )}

          {activeTab === 'leaderboard' && (
            <div>
              <h3 className="text-lg font-medium text-white mb-4 flex items-center space-x-2">
                <span>🏆</span>
                <span>Hunter Leaderboard</span>
              </h3>
              <Leaderboard
                entries={leaderboard}
                loading={leaderboardLoading}
                projectTitle={project.title}
              />
            </div>
          )}

          {activeTab === 'rewards' && (
            <div>
              <h3 className="text-lg font-medium text-white mb-4 flex items-center space-x-2">
                <span>💰</span>
                <span>Bounty Distribution</span>
              </h3>
              <RewardBreakdown
                breakdown={rewardBreakdown}
                loading={rewardLoading}
                onCalculate={calculateRewards}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}