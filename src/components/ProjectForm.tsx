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
  total_lines_of_code?: number;
  visibility: 'public' | 'organization' | 'private';
  allowed_organizations: string[];
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
    total_lines_of_code: 0,
    visibility: 'organization',
    allowed_organizations: [],
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

  const loadRepos = async () => {
    try {
      setLoadingRepos(true);

      // 먼저 GitHub 인증 상태 확인
      await checkUserAuth();

      // 저장소 목록 가져오기
      const repoList = await fetchUserRepos();
      setRepos(repoList);

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

    // allowed_organizations를 콤마 구분 문자열로 변환
    const submissionData = {
      ...formData,
      allowed_organizations: organizationsToString(formData.allowed_organizations),
    };

    await onSubmit(submissionData as any);
  };

  return (
    <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-xl shadow-2xl p-8">
      {/* Mission Registration Header */}
      <div className="flex items-center space-x-3 mb-8">
        <div className="text-5xl animate-bounce-slow">🚀</div>
        <div>
          <h2 className="text-2xl font-bold text-white">Mission Registration</h2>
          <p className="text-gray-400">Deploy a new bug bounty mission</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Mission Intel */}
        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-600">
          <h3 className="text-lg font-medium text-white mb-6 flex items-center space-x-2">
            <span>📋</span>
            <span>Mission Configuration</span>
          </h3>

          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-medium text-white mb-3 flex items-center space-x-2">
                <span>🎯</span>
                <span>Mission Codename</span>
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300"
                placeholder="Enter mission codename (e.g., Operation SecureVault)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-4 flex items-center space-x-2">
                <span>🔐</span>
                <span>Mission Visibility</span>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { value: 'public', icon: '🌍', title: 'Public', desc: 'All authenticated users can view and participate' },
                  { value: 'organization', icon: '🏢', title: 'Organization', desc: 'Team members only' },
                  { value: 'private', icon: '🔒', title: 'Private', desc: 'Owner only' }
                ].map((option) => (
                  <label
                    key={option.value}
                    className={`relative flex flex-col p-4 border-2 rounded-lg cursor-pointer transition-all duration-300 transform hover:scale-105 ${formData.visibility === option.value
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
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-2xl">{option.icon}</span>
                      <span className="text-white font-medium">{option.title}</span>
                      {formData.visibility === option.value && (
                        <div className="ml-auto">
                          <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse-fast"></div>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">{option.desc}</p>
                  </label>
                ))}
              </div>
              <div className="mt-4 p-3 bg-gradient-to-r from-gray-700/50 to-gray-800/50 rounded-lg border border-gray-600">
                <div className="flex items-center space-x-2 text-sm">
                  <span className="text-lg">
                    {formData.visibility === 'public' && '🌍'}
                    {formData.visibility === 'organization' && '🏢'}
                    {formData.visibility === 'private' && '🔒'}
                  </span>
                  <span className="text-white font-medium">Selected:</span>
                  <span className="text-gray-300">
                    {formData.visibility === 'public' && 'This mission will be visible to all authenticated users'}
                    {formData.visibility === 'organization' && 'This mission will only be visible to your organization members'}
                    {formData.visibility === 'private' && 'This mission will only be visible to you'}
                  </span>
                </div>
              </div>
            </div>

            {/* Organization Selector - visibility가 'organization'일 때만 표시 */}
            {formData.visibility === 'organization' && (
              <div>
                <label className="block text-sm font-medium text-white mb-2 flex items-center space-x-2">
                  <span>🏢</span>
                  <span>Allowed Organizations (Optional)</span>
                </label>
                <p className="text-xs text-gray-400 mb-3">
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

            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-white flex items-center space-x-2">
                  <span>📝</span>
                  <span>Mission Briefing</span>
                </label>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowPreview(false)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${!showPreview
                      ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white'
                      : 'bg-gray-700 text-gray-300 hover:text-white hover:bg-gray-600'
                      }`}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPreview(true)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${showPreview
                      ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white'
                      : 'bg-gray-700 text-gray-300 hover:text-white hover:bg-gray-600'
                      }`}
                  >
                    👁️ Preview
                  </button>
                </div>
              </div>

              {showPreview ? (
                <div className="min-h-[150px] p-4 border-2 border-gray-600 rounded-lg bg-gray-800/50">
                  {formData.description ? (
                    <div className="prose prose-sm max-w-none prose-invert">
                      <EnhancedMarkdown className="text-white">
                        {formData.description}
                      </EnhancedMarkdown>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-4">📝</div>
                      <p className="text-gray-400 italic">Your mission briefing preview will appear here...</p>
                    </div>
                  )}
                </div>
              ) : (
                <textarea
                  rows={6}
                  required
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300 font-mono text-sm"
                  placeholder="📝 Provide detailed mission briefing in markdown format:

## 🎯 Mission Objective
Describe the primary goals and scope of this security audit...

## 🔍 Security Focus Areas
- Authentication and authorization systems
- Input validation and sanitization
- Data encryption and storage security

## 📋 Expected Deliverables
Detail what hunters should focus on and report formats...

## 💻 Code References
You can embed GitHub code directly in your description:
https://github.com/owner/repo/blob/main/src/file.js#L10-L20

## 🎁 Bonus Objectives
Additional areas of interest for extra bounty consideration..."
                />
              )}

              <div className="flex items-center space-x-2 mt-3">
                <span className="text-xs text-gray-400">📝 Supports markdown syntax</span>
                <span className="text-xs text-gray-500">|</span>
                <span className="text-xs text-gray-400">💻 Code blocks: ```language-name</span>
              </div>
            </div>
          </div>
        </div>

        {/* Target Selection */}
        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-600">
          <h3 className="text-lg font-medium text-white mb-6 flex items-center space-x-2">
            <span>🎯</span>
            <span>Target Configuration</span>
          </h3>

          <div>
            <label className="block text-sm font-medium text-white mb-3 flex items-center space-x-2">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
              </svg>
              <span>Repository</span>
            </label>
            {loadingRepos ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4 animate-bounce-slow">🔍</div>
                <div className="animate-spin rounded-full h-8 w-8 border-b-4 border-primary-500 mx-auto mb-4"></div>
                <p className="text-white font-medium">Scanning repositories...</p>
                <div className="mt-2 text-gray-400 text-sm">🔍 Loading GitHub targets</div>
              </div>
            ) : (
              <select
                required
                value={selectedRepo?.id || ''}
                onChange={(e) => {
                  const repo = repos.find(r => r.id === parseInt(e.target.value));
                  if (repo) handleRepoSelect(repo);
                }}
                className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300"
              >
                <option value="">Select target repository</option>
                {repos.map(repo => (
                  <option key={repo.id} value={repo.id} className="bg-gray-800 text-white">
                    {repo.full_name} {repo.description && `- ${repo.description}`}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Branch Selection */}
        {selectedRepo && (
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-600">
            <label className="block text-sm font-medium text-white mb-3 flex items-center space-x-2">
              <span>🌿</span>
              <span>Target Branch</span>
            </label>
            {loadingBranches ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-4 border-primary-500 mx-auto mb-2"></div>
                <p className="text-gray-400 text-sm">Loading branches...</p>
              </div>
            ) : (
              <select
                required
                value={formData.branch_name}
                onChange={(e) => handleBranchSelect(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300"
              >
                <option value="">Select target branch</option>
                {branches.map(branch => (
                  <option key={branch.name} value={branch.name} className="bg-gray-800 text-white">
                    {branch.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* File Selection */}
        {formData.branch_name && (
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-600">
            <label className="block text-sm font-medium text-white mb-3 flex items-center space-x-2">
              <span>📁</span>
              <span>Mission Target Files</span>
            </label>
            <p className="text-xs text-gray-400 mb-4 bg-gray-700/50 p-3 rounded-lg border border-gray-600">
              💡 <strong>Tactical Instructions:</strong> Click on files to select individually, or click on directories to select all files within them.
            </p>
            {loadingFiles ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4 animate-bounce-slow">📂</div>
                <div className="animate-spin rounded-full h-8 w-8 border-b-4 border-primary-500 mx-auto mb-4"></div>
                <p className="text-white font-medium">Scanning target files...</p>
                <div className="mt-2 text-gray-400 text-sm">🔍 Analyzing file structure</div>
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
                <div className="flex items-center space-x-2">
                  <span className="text-lg">🎯</span>
                  <strong className="text-white">Selected Targets: {formData.selected_files.length}</strong>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-lg">📊</span>
                  <strong className="text-white">
                    Lines of Code: {calculatingLoc ? (
                      <span className="text-primary-400">Calculating...</span>
                    ) : (
                      <span className="text-neon-green">{formatLineCount(formData.total_lines_of_code || 0)}</span>
                    )}
                  </strong>
                </div>
              </div>
              {formData.selected_files.length > 0 && (
                <div className="text-xs text-gray-300">
                  <details>
                    <summary className="cursor-pointer hover:text-white transition-colors duration-300 flex items-center space-x-1">
                      <span>👁️</span>
                      <span>View target list</span>
                    </summary>
                    <div className="mt-3 max-h-32 overflow-y-auto bg-gray-800/50 rounded p-3 border border-gray-600">
                      {formData.selected_files.map(file => (
                        <div key={file} className="font-mono text-xs py-1 text-gray-300 hover:text-white transition-colors">
                          📄 {file}
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
        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-600">
          <h3 className="text-lg font-medium text-white mb-6 flex items-center space-x-2">
            <span>💰</span>
            <span>Reward Configuration</span>
          </h3>

          <div className="mb-6">
            <label className="block text-sm font-medium text-white mb-3 flex items-center space-x-2">
              <span>🏦</span>
              <span>Total Reward Pool (TON)</span>
            </label>
            <input
              type="number"
              required
              min="1"
              value={formData.total_reward_pool}
              onChange={(e) => setFormData(prev => ({ ...prev, total_reward_pool: parseInt(e.target.value) }))}
              className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-white mb-4 flex items-center space-x-2">
              <span>⚠️</span>
              <span>Threat Level Bounties</span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(formData.reward_distribution).map(([severity, amount]) => (
                <div key={severity} className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                  <label className="block text-sm font-medium text-white mb-3 capitalize flex items-center space-x-2">
                    <span>
                      {severity === 'critical' && '🔴'}
                      {severity === 'high' && '🟠'}
                      {severity === 'medium' && '🟡'}
                      {severity === 'low' && '🟢'}
                    </span>
                    <span>{severity}</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={amount}
                    onChange={(e) => handleRewardDistributionChange(severity as keyof typeof formData.reward_distribution, parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-800 border-2 border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-r from-gray-700 to-gray-800 rounded-lg p-4 border border-gray-600">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-300 flex items-center space-x-2">
                <span>💳</span>
                <span>Distribution Total:</span>
              </span>
              <div className="flex items-center space-x-2">
                <span className={`font-bold text-lg ${totalDistribution === formData.total_reward_pool ? 'text-neon-green animate-pulse-fast' : 'text-red-400'}`}>
                  {totalDistribution.toLocaleString()} TON
                </span>
                <span className="text-gray-400">/</span>
                <span className="text-white font-medium">{formData.total_reward_pool.toLocaleString()} TON</span>
              </div>
            </div>
            {totalDistribution !== formData.total_reward_pool && (
              <div className="mt-2 text-xs text-red-400 flex items-center space-x-1">
                <span>⚠️</span>
                <span>Distribution must equal total pool amount</span>
              </div>
            )}
          </div>
        </div>

        {/* Mission Control */}
        <div className="flex justify-end space-x-4 pt-8 border-t border-gray-700">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 border-2 border-gray-600 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:border-gray-500 hover:bg-gray-800/50 transition-all duration-300 flex items-center space-x-2"
          >
            <span>❌</span>
            <span>Abort Mission</span>
          </button>
          <button
            type="submit"
            disabled={loading || totalDistribution !== formData.total_reward_pool}
            className="px-8 py-3 bg-gradient-to-r from-neon-green to-cyber-500 hover:from-neon-green/80 hover:to-cyber-400 border border-transparent rounded-lg text-sm font-bold text-black transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center space-x-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                <span>Deploying Mission...</span>
              </>
            ) : (
              <>
                <span>🚀</span>
                <span>Deploy Mission</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}