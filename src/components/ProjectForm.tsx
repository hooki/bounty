import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useGitHub } from '../hooks/useGitHub';
import FileTree from './FileTree';

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
}

interface ProjectFormProps {
  onSubmit: (data: ProjectFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export default function ProjectForm({ onSubmit, onCancel, loading = false }: ProjectFormProps) {
  const { fetchUserRepos, fetchRepoBranches, fetchRepoTree, checkUserAuth } = useGitHub();

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
  });

  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [branches, setBranches] = useState<GitHubBranch[]>([]);
  const [files, setFiles] = useState<GitHubTreeItem[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    loadRepos();
  }, []);

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

    await onSubmit(formData);
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
            <span>Mission Intel</span>
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
                      <ReactMarkdown
                        components={{
                          code({ className, children, ...props }: any) {
                            const match = /language-(\w+)/.exec(className || '');
                            const inline = props.inline;
                            return !inline && match ? (
                              <SyntaxHighlighter
                                style={tomorrow as any}
                                language={match[1]}
                                PreTag="div"
                                {...props}
                              >
                                {String(children).replace(/\n$/, '')}
                              </SyntaxHighlighter>
                            ) : (
                              <code className={className} {...props}>
                                {children}
                              </code>
                            );
                          },
                        }}
                      >
                        {formData.description}
                      </ReactMarkdown>
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
            <span>Target Selection</span>
          </h3>

          <div>
            <label className="block text-sm font-medium text-white mb-3 flex items-center space-x-2">
              <span>🔗</span>
              <span>Target Repository</span>
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
              <div className="flex items-center space-x-2 mb-3">
                <span className="text-lg">🎯</span>
                <strong className="text-white">Selected Targets: {formData.selected_files.length}</strong>
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
            <span>Bounty Configuration</span>
          </h3>

          <div className="mb-6">
            <label className="block text-sm font-medium text-white mb-3 flex items-center space-x-2">
              <span>🏦</span>
              <span>Total Bounty Pool ($)</span>
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
                  ${totalDistribution.toLocaleString()}
                </span>
                <span className="text-gray-400">/</span>
                <span className="text-white font-medium">${formData.total_reward_pool.toLocaleString()}</span>
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