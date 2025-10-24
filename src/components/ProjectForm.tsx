import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useGitHub } from '../hooks/useGitHub';
import { useOrganizations } from '../hooks/useOrganizations';
import FileTree from './FileTree';
import OrganizationSelector from './OrganizationSelector';
import { calculateLinesOfCode, formatLineCount } from '../utils/locCalculator';
import { EnhancedMarkdown } from './GitHubCodeEmbed';

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
  description: string | null;
  default_branch: string;
}

interface GitHubBranch {
  name: string;
  commit: {
    sha: string;
  };
}

interface GitHubTreeItem {
  path: string;
  mode: string;
  type: 'blob' | 'tree';
  sha: string;
  size?: number;
}

interface ProjectFormData {
  title: string;
  description: string;
  repository_url: string;
  branch_name: string;
  selected_files: string[];
  total_reward_pool: number;
  reward_distribution: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  reward_currency: 'TON' | 'USDC';
  total_lines_of_code?: number;
  visibility: 'public' | 'organization' | 'private';
  allowed_organizations: string[];
  start_date?: string;
  end_date?: string;
}

interface ProjectFormProps {
  onSubmit: (data: ProjectFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export default function ProjectForm({ onSubmit, onCancel, loading = false }: ProjectFormProps) {
  const { fetchUserRepos, fetchRepoBranches, fetchRepoTree, checkUserAuth } = useGitHub();
  const { organizationsToString } = useOrganizations();

  const [formData, setFormData] = useState<ProjectFormData>({
    title: '',
    description: '',
    repository_url: '',
    branch_name: '',
    selected_files: [],
    total_reward_pool: 10000,
    reward_distribution: {
      critical: 5000,
      high: 3000,
      medium: 1500,
      low: 500,
    },
    reward_currency: 'TON',
    total_lines_of_code: 0,
    visibility: 'organization',
    allowed_organizations: [],
    start_date: '',
    end_date: '',
  });

  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [branches, setBranches] = useState<GitHubBranch[]>([]);
  const [files, setFiles] = useState<GitHubTreeItem[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [calculatingLoc, setCalculatingLoc] = useState(false);

  useEffect(() => {
    loadRepos();
  }, []);

  // 선택된 파일이 변경될 때마다 LoC 계산
  useEffect(() => {
    if (formData.selected_files.length > 0 && formData.repository_url && formData.branch_name) {
      calculateProjectLoc();
    } else {
      setFormData(prev => ({ ...prev, total_lines_of_code: 0 }));
    }
  }, [formData.selected_files, formData.repository_url, formData.branch_name]);

  const loadRepos = async (forceRefresh = false) => {
    try {
      setLoadingRepos(true);

      // 로컬 스토리지에서 캐시된 데이터 확인
      const cacheKey = 'github_repos_cache';
      const cacheTimestampKey = 'github_repos_cache_timestamp';
      const cacheExpiry = 1000 * 60 * 30; // 30분

      if (!forceRefresh) {
        const cachedRepos = localStorage.getItem(cacheKey);
        const cachedTimestamp = localStorage.getItem(cacheTimestampKey);

        if (cachedRepos && cachedTimestamp) {
          const timestamp = parseInt(cachedTimestamp);
          const now = Date.now();

          // 캐시가 유효한 경우
          if (now - timestamp < cacheExpiry) {
            const repoList = JSON.parse(cachedRepos);
            setRepos(repoList);
            console.log('Loaded repositories from cache');
            setLoadingRepos(false);
            return;
          }
        }
      }

      // 먼저 GitHub 인증 상태 확인
      await checkUserAuth();

      // 저장소 목록 가져오기
      const repoList = await fetchUserRepos();
      setRepos(repoList);

      // 로컬 스토리지에 캐시 저장
      localStorage.setItem(cacheKey, JSON.stringify(repoList));
      localStorage.setItem(cacheTimestampKey, Date.now().toString());

      console.log('Repository loading completed successfully');
    } catch (error) {
      console.error('Failed to load repositories:', error);
    } finally {
      setLoadingRepos(false);
    }
  };

  const handleRepoSelect = async (repo: GitHubRepo) => {
    setSelectedRepo(repo);
    setFormData(prev => ({
      ...prev,
      repository_url: repo.html_url,
      branch_name: '',
      selected_files: [],
    }));

    try {
      setLoadingBranches(true);
      const branchList = await fetchRepoBranches(repo.full_name);
      setBranches(branchList);

      // 기본 브랜치 자동 선택
      const defaultBranch = branchList.find(b => b.name === repo.default_branch);
      if (defaultBranch) {
        setFormData(prev => ({ ...prev, branch_name: defaultBranch.name }));
        await loadFiles(repo.full_name, defaultBranch.commit.sha);
      }
    } catch (error) {
      console.error('Failed to load branches:', error);
    } finally {
      setLoadingBranches(false);
    }
  };

  const handleBranchSelect = async (branchName: string) => {
    if (!selectedRepo) return;

    setFormData(prev => ({ ...prev, branch_name: branchName, selected_files: [] }));

    const branch = branches.find(b => b.name === branchName);
    if (branch) {
      await loadFiles(selectedRepo.full_name, branch.commit.sha);
    }
  };

  const loadFiles = async (repoFullName: string, sha: string) => {
    try {
      setLoadingFiles(true);
      const fileList = await fetchRepoTree(repoFullName, sha);
      setFiles(fileList);
    } catch (error) {
      console.error('Failed to load files:', error);
    } finally {
      setLoadingFiles(false);
    }
  };

  const handleFileToggle = (filePath: string) => {
    setFormData(prev => ({
      ...prev,
      selected_files: prev.selected_files.includes(filePath)
        ? prev.selected_files.filter(f => f !== filePath)
        : [...prev.selected_files, filePath]
    }));
  };

  const handleDirectoryToggle = (_directoryPath: string, allFiles: string[]) => {
    setFormData(prev => {
      const currentSelected = new Set(prev.selected_files);

      // 디렉토리의 모든 파일이 이미 선택되어 있는지 확인
      const allSelected = allFiles.every(file => currentSelected.has(file));

      if (allSelected) {
        // 모든 파일이 선택되어 있으면 모두 제거
        allFiles.forEach(file => currentSelected.delete(file));
      } else {
        // 일부 또는 전체가 선택되지 않았으면 모두 추가
        allFiles.forEach(file => currentSelected.add(file));
      }

      return {
        ...prev,
        selected_files: Array.from(currentSelected)
      };
    });
  };

  const calculateProjectLoc = async () => {
    try {
      setCalculatingLoc(true);
      const result = await calculateLinesOfCode(
        formData.repository_url,
        formData.branch_name,
        formData.selected_files
      );

      setFormData(prev => ({
        ...prev,
        total_lines_of_code: result.totalLines
      }));
    } catch (error) {
      console.error('Failed to calculate LoC:', error);
      setFormData(prev => ({ ...prev, total_lines_of_code: 0 }));
    } finally {
      setCalculatingLoc(false);
    }
  };

  const handleRewardDistributionChange = (severity: keyof typeof formData.reward_distribution, value: number) => {
    setFormData(prev => ({
      ...prev,
      reward_distribution: {
        ...prev.reward_distribution,
        [severity]: value,
      }
    }));
  };

  const totalDistribution = Object.values(formData.reward_distribution).reduce((sum, val) => sum + val, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (totalDistribution !== formData.total_reward_pool) {
      alert('The total reward distribution does not match the total reward pool.');
      return;
    }

    if (formData.selected_files.length === 0) {
      alert('At least one file must be selected.');
      return;
    }

    // allowed_organizations를 콤마 구분 문자열로 변환하고 빈 날짜는 null로 처리
    const submissionData = {
      ...formData,
      allowed_organizations: organizationsToString(formData.allowed_organizations),
      start_date: formData.start_date || null,
      end_date: formData.end_date || null,
    };

    await onSubmit(submissionData as any);
  };

  return (
    <div className="pixel-card bg-pixel-bg-light border-pixel-border p-8">
      {/* Mission Registration Header */}
      <div className="mb-8 border-b-4 border-pixel-border pb-4">
        <h2 className="text-2xl font-pixel text-pixel-text">Mission Registration</h2>
        <p className="text-pixel-text-muted mt-2 text-xl">Deploy a new bug bounty mission</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Mission Intel */}
        <div className="bg-pixel-bg p-6 border-2 border-pixel-border">
          <h3 className="text-lg font-pixel text-pixel-text mb-6">
            Mission Configuration
          </h3>

          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-2xl font-medium text-pixel-text mb-3 flex items-center">

                <span>Title</span>
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-4 py-3 pixel-input placeholder-pixel-text-muted text-xl focus:outline-none focus:ring-2 focus:border-pixel-accent transition-all duration-300"
                placeholder="Enter title (e.g., Operation SecureVault, Security Audit, etc.)"
              />
            </div>

            <div>
              <label className="block text-2xl font-medium text-pixel-text mb-4 flex items-center">
                <span>Visibility</span>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4  text-xl">
                {[
                  { value: 'public', icon: '', title: 'Public', desc: 'All users' },
                  { value: 'organization', icon: '', title: 'Invite', desc: 'Invited only' },
                  { value: 'private', icon: '', title: 'Private', desc: 'Owner only' }
                ].map((option) => (
                  <label
                    key={option.value}
                    className={`relative flex flex-col items-center justify-center text-center p-4 border-2 rounded-lg cursor-pointer transition-all duration-300 transform hover:scale-105 ${formData.visibility === option.value
                      ? 'border-primary-500 bg-gradient-to-r from-primary-600/20 to-cyber-600/20 shadow-lg'
                      : 'border-gray-600 bg-gray-800/50 hover:border-gray-500 hover:bg-gray-700/50'
                      }`}
                  >
                    <input
                      type="radio"
                      name="visibility"
                      value={option.value}
                      checked={formData.visibility === option.value}
                      onChange={(e) => setFormData(prev => ({ ...prev, visibility: e.target.value as 'public' | 'organization' | 'private' }))}
                      className="absolute opacity-0"
                    />
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <span className="text-pixel-text font-medium">{option.title}</span>
                      {formData.visibility === option.value && (
                        <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse-fast"></div>
                      )}
                    </div>
                    <p className="text-pixel-text-muted leading-relaxed">{option.desc}</p>
                  </label>
                ))}
              </div>
              <div className="mt-4 p-3 bg-gradient-to-r from-gray-700/50 to-gray-800/50 rounded-lg border border-gray-600">
                <div className="flex items-center text-2xl">
                  <span className="text-lg">
                    {formData.visibility === 'public' && ''}
                    {formData.visibility === 'organization' && ''}
                    {formData.visibility === 'private' && ''}
                  </span>
                  <span className="text-pixel-text font-medium">Selected:</span>
                  <span className="text-pixel-text">
                    {formData.visibility === 'public' && 'This mission will be visible to all users'}
                    {formData.visibility === 'organization' && 'This mission will only be visible to your organization members'}
                    {formData.visibility === 'private' && 'This mission will only be visible to you'}
                  </span>
                </div>
              </div>
            </div>

            {/* Organization Selector - visibility가 'organization'일 때만 표시 */}
            {formData.visibility === 'organization' && (
              <div>
                <label className="block text-2xl font-medium text-pixel-text mb-2 flex items-center">

                  <span>Allowed Organizations (Optional)</span>
                </label>
                <p className="text-xl text-pixel-text-muted mb-3">
                  Leave empty to restrict to your organization only, or add specific organizations
                </p>
                <OrganizationSelector
                  selectedOrgs={formData.allowed_organizations}
                  onOrgsChange={(orgs) => setFormData(prev => ({
                    ...prev,
                    allowed_organizations: orgs
                  }))}
                />
              </div>
            )}

            {/* Mission Timeline */}
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-2xl font-medium text-pixel-text mb-3 flex items-center">

                    <span>Start Date (Optional)</span>
                  </label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                    className="w-full px-4 py-3 pixel-input placeholder-pixel-text-muted focus:outline-none focus:ring-2 focus:border-pixel-accent transition-all duration-300"
                    style={{
                      colorScheme: 'dark'
                    }}
                  />
                </div>

                <div>
                  <label className="block text-2xl font-medium text-pixel-text mb-3 flex items-center">

                    <span>End Date (Optional)</span>
                  </label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                    className="w-full px-4 py-3 pixel-input placeholder-pixel-text-muted focus:outline-none focus:ring-2 focus:border-pixel-accent transition-all duration-300"
                    style={{
                      colorScheme: 'dark'
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 mb-4">
                {[
                  { label: '1 Week', days: 7 },
                  { label: '2 Weeks', days: 14 },
                  { label: '3 Weeks', days: 21 },
                  { label: '4 Weeks', days: 28 },
                  { label: '1 Month', days: 30 }
                ].map((option) => (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => {
                      const today = new Date();
                      const endDate = new Date(today);
                      endDate.setDate(today.getDate() + option.days);

                      setFormData(prev => ({
                        ...prev,
                        start_date: today.toISOString().split('T')[0],
                        end_date: endDate.toISOString().split('T')[0]
                      }));
                    }}
                    className="px-3 py-2 text-sm font-pixel bg-pixel-bg border-2 border-pixel-border text-pixel-text hover:border-pixel-accent hover:bg-pixel-accent hover:text-white transition-all duration-200"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="block text-2xl font-medium text-pixel-text">
                  Description
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPreview(false)}
                    className={`px-4 py-2 text-base font-pixel border-2 transition-colors ${!showPreview
                      ? 'bg-pixel-accent text-white border-pixel-accent'
                      : 'bg-pixel-bg text-pixel-text border-pixel-border hover:border-pixel-accent'
                      }`}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPreview(true)}
                    className={`px-4 py-2 text-base font-pixel border-2 transition-colors ${showPreview
                      ? 'bg-pixel-accent text-white border-pixel-accent'
                      : 'bg-pixel-bg text-pixel-text border-pixel-border hover:border-pixel-accent'
                      }`}
                  >
                    Preview
                  </button>
                </div>
              </div>

              {showPreview ? (
                <div className="min-h-[150px] p-4 border-2 border-gray-600 rounded-lg bg-gray-800/50">
                  {formData.description ? (
                    <div className="prose prose-sm max-w-none prose-invert">
                      <EnhancedMarkdown className="text-pixel-text">
                        {formData.description}
                      </EnhancedMarkdown>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-4"></div>
                      <p className="text-pixel-text-muted italic">Your mission briefing preview will appear here...</p>
                    </div>
                  )}
                </div>
              ) : (
                <textarea
                  rows={6}
                  required
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-3 pixel-input placeholder-pixel-text-muted focus:outline-none focus:ring-2 focus:border-pixel-accent transition-all duration-300 font-sans text-2xl antialiased"
                  placeholder="Provide detailed mission briefing in markdown format:

## Mission Objective
Describe the primary goals and scope of this security audit...

## Security Focus Areas
- Authentication and authorization systems
- Input validation and sanitization
- Data encryption and storage security

## Expected Deliverables
Detail what hunters should focus on and report formats...

## Code References
You can embed GitHub code directly in your description:
https://github.com/owner/repo/blob/main/src/file.js#L10-L20

## Bonus Objectives
Additional areas of interest for extra bounty consideration..."
                />
              )}

              <div className="flex items-center mt-3">
                <span className="text-sm text-pixel-text-muted"> Supports markdown syntax</span>
                <span className="text-sm text-gray-500">|</span>
                <span className="text-sm text-pixel-text-muted"> Code blocks: ```language-name</span>
              </div>
            </div>
          </div>
        </div>

        {/* Target Selection */}
        <div className="bg-pixel-bg p-6 border-2 border-pixel-border">
          <h3 className="text-lg font-pixel text-pixel-text mb-6 flex items-center">

            <span>Target Configuration</span>
          </h3>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-2xl font-medium text-pixel-text flex items-center space-x-2">
                <svg className="w-4 h-4 text-pixel-text" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                </svg>
                <span>Repository</span>
              </label>
              <button
                type="button"
                onClick={() => loadRepos(true)}
                disabled={loadingRepos}
                className="px-3 py-1 text-sm font-pixel bg-pixel-bg border-2 border-pixel-border text-pixel-text hover:border-pixel-accent hover:bg-pixel-accent hover:text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <svg className={`w-3 h-3 ${loadingRepos ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Reload
              </button>
            </div>
            {loadingRepos ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4 animate-bounce-slow"></div>
                <div className="animate-spin rounded-full h-8 w-8 border-b-4 border-pixel-accent mx-auto mb-4"></div>
                <p className="text-pixel-text font-medium">Scanning repositories...</p>
                <div className="mt-2 text-pixel-text-muted text-2xl"> Loading GitHub targets</div>
              </div>
            ) : (
              <select
                required
                value={selectedRepo?.id || ''}
                onChange={(e) => {
                  const repo = repos.find(r => r.id === parseInt(e.target.value));
                  if (repo) handleRepoSelect(repo);
                }}
                className="w-full px-4 py-3 pixel-input focus:outline-none focus:ring-2 focus:border-pixel-accent transition-all duration-300"
              >
                <option value="">Select target repository</option>
                {repos.map(repo => (
                  <option key={repo.id} value={repo.id} className="bg-gray-800 text-pixel-text">
                    {repo.full_name} {repo.description && `- ${repo.description}`}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Branch Selection */}
        {selectedRepo && (
          <div className="bg-pixel-bg p-6 border-2 border-pixel-border">
            <label className="block text-2xl font-medium text-pixel-text mb-3 flex items-center">

              <span>Target Branch</span>
            </label>
            {loadingBranches ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-4 border-pixel-accent mx-auto mb-2"></div>
                <p className="text-pixel-text-muted text-2xl">Loading branches...</p>
              </div>
            ) : (
              <select
                required
                value={formData.branch_name}
                onChange={(e) => handleBranchSelect(e.target.value)}
                className="w-full px-4 py-3 pixel-input focus:outline-none focus:ring-2 focus:border-pixel-accent transition-all duration-300"
              >
                <option value="">Select target branch</option>
                {branches.map(branch => (
                  <option key={branch.name} value={branch.name} className="bg-gray-800 text-pixel-text">
                    {branch.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* File Selection */}
        {formData.branch_name && (
          <div className="bg-pixel-bg p-6 border-2 border-pixel-border">
            <label className="block text-2xl font-medium text-pixel-text mb-3 flex items-center">

              <span>Mission Target Files</span>
            </label>
            <p className="text-sm text-pixel-text-muted mb-4 bg-gray-700/50 p-3 rounded-lg border border-gray-600">
              <strong>Tactical Instructions:</strong> Click on files to select individually, or click on directories to select all files within them.
            </p>
            {loadingFiles ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4 animate-bounce-slow"></div>
                <div className="animate-spin rounded-full h-8 w-8 border-b-4 border-pixel-accent mx-auto mb-4"></div>
                <p className="text-pixel-text font-medium">Scanning target files...</p>
                <div className="mt-2 text-pixel-text-muted text-2xl"> Analyzing file structure</div>
              </div>
            ) : (
              <FileTree
                files={files}
                selectedFiles={formData.selected_files}
                onFileToggle={handleFileToggle}
                onDirectoryToggle={handleDirectoryToggle}
              />
            )}
            <div className="mt-4 p-4 bg-gradient-to-r from-gray-700 to-gray-800 rounded-lg border border-gray-600">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                <div className="flex items-center">
                  <span className="text-lg"></span>
                  <strong className="text-pixel-text">Selected Targets: {formData.selected_files.length}</strong>
                </div>
                <div className="flex items-center">
                  <span className="text-lg"></span>
                  <strong className="text-pixel-text">
                    Lines of Code: {calculatingLoc ? (
                      <span className="text-primary-400">Calculating...</span>
                    ) : (
                      <span className="text-neon-green">{formatLineCount(formData.total_lines_of_code || 0)}</span>
                    )}
                  </strong>
                </div>
              </div>
              {formData.selected_files.length > 0 && (
                <div className="text-sm text-pixel-text">
                  <details>
                    <summary className="cursor-pointer hover:text-pixel-text transition-colors duration-300 flex items-center">
                      <span></span>
                      <span>View target list</span>
                    </summary>
                    <div className="mt-3 max-h-32 overflow-y-auto bg-gray-800/50 rounded p-3 border border-gray-600">
                      {formData.selected_files.map(file => (
                        <div key={file} className="font-mono text-sm py-1 text-pixel-text hover:text-pixel-text transition-colors">
                          {file}
                        </div>
                      ))}
                    </div>
                  </details>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bounty Configuration */}
        <div className="bg-pixel-bg p-6 border-2 border-pixel-border">
          <h3 className="text-lg font-pixel text-pixel-text mb-6 flex items-center">

            <span>Reward Configuration</span>
          </h3>

          <div className="mb-6 text-xl">
            <label className="block text-2xl font-medium text-pixel-text mb-4 flex items-center">

              <span>Reward Currency</span>
            </label>
            <div className="grid grid-cols-2 gap-4 mb-6">
              {[
                { value: 'TON', image: '/images/ton.svg', title: 'TON', desc: 'Tokamak Network' },
                { value: 'USDC', image: '/images/usdc.png', title: 'USDC', desc: 'USD Coin' }
              ].map((option) => (
                <label
                  key={option.value}
                  className={`relative flex flex-col p-4 border-2 rounded-lg cursor-pointer transition-all duration-300 transform hover:scale-105 ${formData.reward_currency === option.value
                    ? 'border-primary-500 bg-gradient-to-r from-primary-600/20 to-cyber-600/20 shadow-lg'
                    : 'border-gray-600 bg-gray-800/50 hover:border-gray-500 hover:bg-gray-700/50'
                    }`}
                >
                  <input
                    type="radio"
                    name="reward_currency"
                    value={option.value}
                    checked={formData.reward_currency === option.value}
                    onChange={(e) => setFormData(prev => ({ ...prev, reward_currency: e.target.value as 'TON' | 'USDC' }))}
                    className="absolute opacity-0"
                  />
                  <div className="flex items-center space-x-3 mb-2">
                    <img src={option.image} alt={option.title} className="w-8 h-8 object-contain" />
                    <span className="text-pixel-text font-medium">{option.title}</span>
                    {formData.reward_currency === option.value && (
                      <div className="ml-auto">
                        <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse-fast"></div>
                      </div>
                    )}
                  </div>
                  <p className="text-pixel-text-muted leading-relaxed">{option.desc}</p>
                </label>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-2xl font-medium text-pixel-text mb-3 flex items-center">

              <span>Total Reward Pool ({formData.reward_currency})</span>
            </label>
            <input
              type="number"
              required
              min="1"
              value={formData.total_reward_pool}
              onChange={(e) => setFormData(prev => ({ ...prev, total_reward_pool: parseInt(e.target.value) }))}
              className="w-full px-4 py-3 pixel-input placeholder-pixel-text-muted text-2xl focus:outline-none focus:ring-2 focus:border-pixel-accent transition-all duration-300"
            />
          </div>

          <div className="mb-6">
            <label className="block text-2xl font-medium text-pixel-text mb-4 flex items-center">

              <span>Threat Level Bounties</span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(formData.reward_distribution).map(([severity, amount]) => (
                <div key={severity} className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                  <label className="block text-2xl font-medium text-pixel-text mb-3 capitalize flex items-center">
                    <span>{severity.toUpperCase()}</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={amount}
                    onChange={(e) => handleRewardDistributionChange(severity as keyof typeof formData.reward_distribution, parseInt(e.target.value))}
                    className="w-full text-2xl px-3 py-2 pixel-input focus:outline-none focus:ring-2 focus:border-pixel-accent transition-all duration-300"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-r from-gray-700 to-gray-800 rounded-lg p-4 border border-gray-600">
            <div className="flex items-center justify-between text-2xl">
              <span className="text-pixel-text flex items-center">

                <span>Distribution Total:</span>
              </span>
              <div className="flex items-center">
                <span className={`font-bold text-2xl ${totalDistribution === formData.total_reward_pool ? 'text-neon-green animate-pulse-fast' : 'text-red-400'}`}>
                  {totalDistribution.toLocaleString()} {formData.reward_currency}
                </span>
                <span className="text-pixel-text-muted">/</span>
                <span className="text-pixel-text font-medium">{formData.total_reward_pool.toLocaleString()} {formData.reward_currency}</span>
              </div>
            </div>
            {totalDistribution !== formData.total_reward_pool && (
              <div className="mt-2 text-base text-red-400 flex items-center">

                <span>Distribution must equal total pool amount</span>
              </div>
            )}
          </div>
        </div>

        {/* Mission Control */}
        <div className="flex flex-col sm:flex-row justify-end gap-4 pt-8 border-t-4 border-pixel-border">
          <button
            type="button"
            onClick={onCancel}
            className="pixel-btn-secondary w-full sm:w-auto"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || totalDistribution !== formData.total_reward_pool}
            className="pixel-btn w-full sm:w-auto"
          >
            {loading ? 'Deploying ...' : 'Deploy'}
          </button>
        </div>
      </form>
    </div>
  );
}