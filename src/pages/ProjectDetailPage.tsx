import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProjects } from '../hooks/useProjects';
import { useIssues } from '../hooks/useIssues';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { useRewardCalculation } from '../hooks/useLeaderboard';
import { useAuth } from '../contexts/AuthContext';
import { useOrganizations } from '../hooks/useOrganizations';
import IssueList from '../components/IssueList';
import IssueForm from '../components/IssueForm';
import Leaderboard from '../components/Leaderboard';
import RewardBreakdown from '../components/RewardBreakdown';
import OrganizationSelector from '../components/OrganizationSelector';
import { EnhancedMarkdown } from '../components/GitHubCodeEmbed';

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { projects, updateProjectStatus, updateProjectVisibility, updateProjectOrganizations } = useProjects();
  const { stringToOrganizations, organizationsToString } = useOrganizations();
  const { issues, loading: issuesLoading, createIssue } = useIssues(id);
  const { leaderboard, loading: leaderboardLoading } = useLeaderboard(id ?? '');
  const { rewardBreakdown, loading: rewardLoading, calculateRewards } = useRewardCalculation(id ?? '');

  const [activeTab, setActiveTab] = useState<'overview' | 'issues' | 'leaderboard' | 'rewards'>('overview');
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  const project = projects.find(p => p.id === id);

  // GitHub 파일 URL 생성 함수
  const getGitHubFileUrl = (filePath: string): string => {
    if (!project) return '';

    // repository_url에서 owner/repo 추출
    // 예: https://github.com/owner/repo -> owner/repo
    const match = project.repository_url.match(/github\.com\/([^/]+\/[^/]+)/);
    if (!match) return '';

    const repoPath = match[1];
    return `https://github.com/${repoPath}/blob/${project.branch_name}/${filePath}`;
  };

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

  const handleVisibilityChange = async (newVisibility: 'public' | 'organization' | 'private') => {
    try {
      await updateProjectVisibility(project.id, newVisibility);
    } catch (error) {
      console.error('Visibility change failed:', error);
      alert('Failed to change visibility.');
    }
  };

  const getNextVisibility = (current: 'public' | 'organization' | 'private'): 'public' | 'organization' | 'private' => {
    switch (current) {
      case 'public':
        return 'organization';
      case 'organization':
        return 'private';
      case 'private':
        return 'public';
      default:
        return 'public';
    }
  };

  const handleVisibilityToggle = async () => {
    const nextVisibility = getNextVisibility(project.visibility);
    await handleVisibilityChange(nextVisibility);
  };

  const getVisibilityConfig = (visibility: 'public' | 'organization' | 'private') => {
    switch (visibility) {
      case 'public':
        return { icon: '🌍', title: 'Public', next: 'Organization' };
      case 'organization':
        return { icon: '🏢', title: 'Organization', next: 'Private' };
      case 'private':
        return { icon: '🔒', title: 'Private', next: 'Public' };
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
                <div>
                  <span
                    className={`inline-flex items-center px-1 py-0.5 rounded-full text-xs font-bold scale-75 ${project.status === 'active'
                      ? 'bg-gradient-to-r from-neon-green to-cyber-500 text-black animate-pulse-fast'
                      : 'bg-gradient-to-r from-gray-600 to-gray-700 text-gray-300'
                      }`}
                  >
                    {project.status === 'active' ? '🟢 ACTIVE' : '🔴 CLOSED'}
                  </span>
                  {!isOwner && <span className="inline-flex items-center px-1 py-0.5 rounded-full text-xs font-bold scale-75 bg-gray-700 text-gray-300">
                    {project.visibility === 'public' && '🌍 Public'}
                    {project.visibility === 'organization' && '🏢 Organization'}
                    {project.visibility === 'private' && '🔒 Private'}
                  </span>}
                </div>
              </div>

              <div className="flex items-center space-x-4">
                {isOwner && (
                  <div className="relative">
                    <button
                      onClick={handleVisibilityToggle}
                      className="flex items-center justify-center space-x-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-300 transform hover:scale-105 bg-gradient-to-r from-primary-600 to-cyber-600 text-white shadow-lg hover:from-primary-500 hover:to-cyber-500 w-36"
                      title={`Click to change to ${getVisibilityConfig(project.visibility).next}`}
                    >
                      <span>{getVisibilityConfig(project.visibility).icon}</span>
                      <span className="truncate">{getVisibilityConfig(project.visibility).title}</span>
                      <span className="text-xs opacity-75">→</span>
                    </button>
                  </div>
                )}

                {isOwner && project.status === 'active' && (
                  <div>
                    <button
                      onClick={() => handleStatusChange('closed')}
                      className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white px-6 py-1.5 rounded-lg font-bold transition-all duration-300 transform hover:scale-105 flex items-center space-x-2"
                    >
                      <span>🛑</span>
                      <span>Close</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Organization Settings - visibility가 'organization'이고 owner일 때만 표시 */}
            {isOwner && project.visibility === 'organization' && (
              <div className="mb-6 p-4 bg-gray-800/50 rounded-lg border border-gray-600">
                <label className="block text-sm font-medium text-white mb-2 flex items-center space-x-2">
                  <span>🏢</span>
                  <span>Allowed Organizations</span>
                </label>
                <p className="text-xs text-gray-400 mb-3">
                  Configure which organizations can access this mission
                </p>
                <OrganizationSelector
                  selectedOrgs={stringToOrganizations(project.allowed_organizations)}
                  onOrgsChange={async (orgs) => {
                    try {
                      const orgString = organizationsToString(orgs);
                      await updateProjectOrganizations(project.id, orgString);
                    } catch (error) {
                      console.error('Failed to update organizations:', error);
                      alert('Failed to update organizations.');
                    }
                  }}
                />
              </div>
            )}

            <div className="prose prose-sm max-w-none mb-6 prose-invert">
              <EnhancedMarkdown className="text-white">
                {project.description}
              </EnhancedMarkdown>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-black/30 rounded-xl p-4 border border-white/20">
                <div className="text-sm text-white/80 flex items-center space-x-1">
                  <span>💰</span>
                  <span>Reward Pool</span>
                </div>
                <div className="text-3xl font-bold text-neon-green animate-pulse-fast">
                  {project.total_reward_pool.toLocaleString()} {project.reward_currency || 'TON'}
                </div>
              </div>
              <div className="bg-black/30 rounded-xl p-4 border border-white/20">
                <div className="text-sm text-white/80 flex items-center space-x-1">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                  </svg>
                  <span>Repository</span>
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
              <div className="bg-black/30 rounded-xl p-4 border border-white/20">
                <div className="text-sm text-white/80 flex items-center space-x-1">
                  <span>📊</span>
                  <span>Lines of Code</span>
                </div>
                <div className="text-3xl font-bold text-cyan-400">
                  {project.total_lines_of_code ? project.total_lines_of_code.toLocaleString() : '0'}
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
                  <div className="text-lg font-bold text-white">{amount.toLocaleString()} {project.reward_currency || 'TON'}</div>
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
                    <a
                      key={index}
                      href={getGitHubFileUrl(file)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-sm font-mono text-gray-300 py-1 hover:text-primary-400 hover:underline transition-colors group"
                    >
                      <span>📄</span>
                      <span className="ml-1">{file}</span>
                      <svg className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
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
                      <span>Total</span>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-cyber-600 to-cyber-800 rounded-xl p-4 text-center transform hover:scale-105 transition-all duration-300">
                    <div className="text-3xl font-bold text-white">
                      {issues.filter(i => i.status === 'open').length}
                    </div>
                    <div className="text-sm text-white/80 flex items-center justify-center space-x-1">
                      <span>🔓</span>
                      <span>Active</span>
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
                      <span>Participants</span>
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