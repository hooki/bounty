import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProjects } from '../hooks/useProjects';
import { useIssues } from '../hooks/useIssues';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { useRewardCalculation } from '../hooks/useLeaderboard';
import { useSettlement } from '../hooks/useSettlement';
import { useAuth } from '../contexts/AuthContext';
import { useOrganizations } from '../hooks/useOrganizations';
import IssueList from '../components/IssueList';
import IssueForm from '../components/IssueForm';
import Leaderboard from '../components/Leaderboard';
import RewardBreakdown from '../components/RewardBreakdown';
import Settlement from '../components/Settlement';
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
  const { settlements, loading: settlementLoading } = useSettlement(id ?? '');

  const [activeTab, setActiveTab] = useState<'description' | 'overview' | 'issues' | 'leaderboard' | 'rewards' | 'settlement'>('description');
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
      <div className="min-h-screen bg-pixel-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-pixel-accent mx-auto mb-4"></div>
          <p className="mt-4 text-pixel-text font-medium">Loading project...</p>
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
        return { icon: '🌍', title: 'Public', next: 'Invite' };
      case 'organization':
        return { icon: '🏢', title: 'Invite', next: 'Private' };
      case 'private':
        return { icon: '🔒', title: 'Private', next: 'Public' };
    }
  };

  const tabs = [
    { id: 'description', name: 'Description' },
    { id: 'overview', name: 'Overview' },
    { id: 'issues', name: 'Issues', count: issues.length },
    { id: 'leaderboard', name: 'Leaderboard' },
    ...(isOwner && project.status === 'closed' ? [{ id: 'settlement', name: 'Settlement' }] : []),
  ];

  return (
    <div className="space-y-6">
      {/* Mission Command Center */}
      <div className="pixel-card bg-pixel-bg-light border-pixel-border p-8">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-4 mb-4 border-b-4 border-pixel-border justify-between">
              <div className="flex items-center space-x-4">
                <h1 className="text-2xl font-pixel text-pixel-text">{project.title}</h1>
                <div>
                  {!isOwner && <span className="inline-flex items-center px-3 py-1 text-[10px] font-pixel bg-pixel-bg text-pixel-text-muted">
                    {project.visibility === 'public' && 'Public'}
                    {project.visibility === 'organization' && 'Invite'}
                    {project.visibility === 'private' && 'Private'}
                  </span>}
                </div>
              </div>

              <div className="flex items-center space-x-4">
                {isOwner && (
                  <button
                    onClick={handleVisibilityToggle}
                    className="pixel-btn-secondary text-sm w-36"
                    title={`Click to change to ${getVisibilityConfig(project.visibility).next}`}
                  >
                    <span className="truncate">{getVisibilityConfig(project.visibility).title}</span>
                  </button>
                )}

                {isOwner && project.status === 'active' && (
                  <button
                    onClick={() => handleStatusChange('closed')}
                    className="pixel-btn bg-pixel-danger text-white border-pixel-danger hover:bg-red-600 text-sm"
                  >
                    Close
                  </button>
                )}
              </div>
            </div>

            {/* Organization Settings - visibility가 'organization'이고 owner일 때만 표시 */}
            {isOwner && project.visibility === 'organization' && (
              <div className="mb-6 p-4 bg-pixel-bg border-2 border-pixel-border">
                <label className="block text-sm font-medium text-pixel-text mb-2">
                  Allowed Organizations
                </label>
                <p className="text-xs text-pixel-text-muted mb-3">
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-pixel-bg p-4 border-2 border-pixel-border text-center">
                <div className="text-xs text-pixel-text-muted mb-2 uppercase tracking-wider">
                  Reward Pool
                </div>
                <div className="text-xl font-pixel text-pixel-accent flex items-center justify-center gap-2">
                  <span>{project.total_reward_pool.toLocaleString()}</span>
                  <img
                    src={project.reward_currency === 'USDC' ? '/images/usdc.png' : '/images/ton.svg'}
                    alt={project.reward_currency || 'TON'}
                    className="w-6 h-6"
                  />
                </div>
              </div>
              <div className="bg-pixel-bg p-4 border-2 border-pixel-border text-center">
                <div className="text-xs text-pixel-text-muted mb-2 uppercase tracking-wider">
                  Repository
                </div>
                <div className="flex flex-col lg:flex-row items-center justify-center gap-1 lg:gap-2">
                  <div className="text-base font-medium text-pixel-accent truncate max-w-full">
                    <a href={project.repository_url} target="_blank" rel="noopener noreferrer" className="hover:text-pixel-accent-hover">
                      {project.repository_url.replace('https://github.com/', '')}
                    </a>
                  </div>
                  <div className="text-sm text-pixel-text-muted whitespace-nowrap">
                    ({project.branch_name})
                  </div>
                </div>
              </div>
              <div className="bg-pixel-bg p-4 border-2 border-pixel-border text-center">
                <div className="text-xs text-pixel-text-muted mb-2 uppercase tracking-wider">
                  Target Files
                </div>
                <div className="text-xl font-pixel text-pixel-text">
                  {project.selected_files.length}
                </div>
              </div>
              <div className="bg-pixel-bg p-4 border-2 border-pixel-border text-center">
                <div className="text-xs text-pixel-text-muted mb-2 uppercase tracking-wider">
                  Lines of Code
                </div>
                <div className="text-xl font-pixel text-pixel-text">
                  {project.total_lines_of_code ? project.total_lines_of_code.toLocaleString() : '0'}
                </div>
              </div>
            </div>

            {/* Bounty Distribution */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {(['critical', 'high', 'medium', 'low'] as const).map((severity) => {
                const amount = (project.reward_distribution as Record<string, number>)[severity] || 0;
                const severityConfig = {
                  critical: { color: 'text-red-500', label: 'Critical' },
                  high: { color: 'text-orange-500', label: 'High' },
                  medium: { color: 'text-yellow-500', label: 'Medium' },
                  low: { color: 'text-gray-400', label: 'Low' }
                };
                const config = severityConfig[severity];
                const currencyIcon = project.reward_currency === 'USDC' ? '/images/usdc.png' : '/images/ton.svg';

                return (
                  <div key={severity} className="text-center p-4 bg-pixel-bg border-2 border-pixel-border">
                    <div className={`text-xs capitalize mb-2 uppercase tracking-wider font-medium ${config.color}`}>
                      {config.label}
                    </div>
                    <div className="text-base font-pixel text-pixel-text flex items-center justify-center gap-2">
                      <span>{amount.toLocaleString()}</span>
                      <img src={currencyIcon} alt={project.reward_currency || 'TON'} className="w-5 h-5" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Mission Control Tabs */}
      <div className="pixel-card">
        <div className="border-b-4 border-pixel-border overflow-x-auto">
          <nav className="-mb-px flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-4 font-pixel text-xs transition-all duration-100 whitespace-nowrap ${activeTab === tab.id
                  ? 'border-pixel-accent text-pixel-accent'
                  : 'border-transparent text-pixel-text-muted hover:text-pixel-text hover:border-pixel-border'
                  }`}
              >
                <span>{tab.name}</span>
                {tab.count !== undefined && (
                  <span className="ml-2 bg-pixel-accent text-white px-2 py-0.5 text-[10px] font-pixel">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'description' && (
            <div className="space-y-6">
              <div className="prose prose-2xl max-w-none mb-6 prose-invert font-roboto">
                <EnhancedMarkdown className="text-white">
                  {project.description}
                </EnhancedMarkdown>
              </div>
            </div>
          )}

          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-pixel text-pixel-text mb-4">
                  Target Files
                </h3>
                <div className="bg-pixel-bg p-4 max-h-64 overflow-y-auto border-2 border-pixel-border">
                  {project.selected_files.map((file, index) => (
                    <a
                      key={index}
                      href={getGitHubFileUrl(file)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-base font-mono text-pixel-text py-1 hover:text-pixel-accent hover:underline transition-colors group"
                    >
                      <span className="ml-1">{file}</span>
                      <svg className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-pixel text-pixel-text mb-4">
                  Mission Statistics
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-pixel-bg p-4 border-2 border-pixel-border">
                    <div className="text-xs text-pixel-text-muted mb-2 uppercase tracking-wider">
                      Total
                    </div>
                    <div className="text-2xl font-pixel text-pixel-text">{issues.length}</div>
                  </div>
                  <div className="bg-pixel-bg p-4 border-2 border-pixel-border">
                    <div className="text-xs text-pixel-text-muted mb-2 uppercase tracking-wider">
                      Active
                    </div>
                    <div className="text-2xl font-pixel text-pixel-accent">
                      {issues.filter(i => i.status === 'open').length}
                    </div>
                  </div>
                  <div className="bg-pixel-bg p-4 border-2 border-pixel-border">
                    <div className="text-xs text-pixel-text-muted mb-2 uppercase tracking-wider">
                      Eliminated
                    </div>
                    <div className="text-2xl font-pixel text-pixel-success">
                      {issues.filter(i => ['solved', 'acknowledged'].includes(i.status)).length}
                    </div>
                  </div>
                  <div className="bg-pixel-bg p-4 border-2 border-pixel-border">
                    <div className="text-xs text-pixel-text-muted mb-2 uppercase tracking-wider">
                      Participants
                    </div>
                    <div className="text-2xl font-pixel text-pixel-text">
                      {leaderboard.length}
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

          {activeTab === 'settlement' && (
            <div>
              <Settlement
                settlements={settlements}
                loading={settlementLoading}
                rewardCurrency={project.reward_currency || 'TON'}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}