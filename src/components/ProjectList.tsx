import { useState } from 'react';
import { Database } from '../lib/supabase';
import { useOrganizations } from '../hooks/useOrganizations';

type Project = Database['public']['Tables']['projects']['Row'] & {
  owner?: {
    username: string;
    avatar_url: string;
  };
  total_lines_of_code?: number;
};

interface ProjectListProps {
  projects: Project[];
  loading: boolean;
  onProjectClick: (project: Project) => void;
}

export default function ProjectList({ projects, loading, onProjectClick }: ProjectListProps) {
  const { stringToOrganizations } = useOrganizations();
  const [sortBy, setSortBy] = useState<'created_at' | 'total_reward_pool' | 'status'>('created_at');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'closed'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredAndSortedProjects = projects
    .filter(project => {
      const matchesStatus = filterStatus === 'all' || project.status === filterStatus;
      const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesStatus && matchesSearch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'total_reward_pool':
          return b.total_reward_pool - a.total_reward_pool;
        case 'status':
          return a.status.localeCompare(b.status);
        case 'created_at':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-xl shadow-2xl p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-4 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-white font-medium">Loading missions...</p>
          <div className="mt-2 text-gray-400 text-sm">🎯 Scanning available targets</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-xl shadow-2xl">
      {/* Mission Control Panel */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">🔄 Sort</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="created_at">Latest</option>
                <option value="total_reward_pool">Reward Pool Size</option>
                <option value="status">Status</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">📊 Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
                className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Missions</option>
                <option value="active">Active</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>

          <div className="w-full sm:w-64">
            <label className="block text-sm font-medium text-gray-300 mb-1">🔍 Search</label>
            <input
              type="text"
              placeholder="Search missions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      </div>

      {/* Mission List */}
      <div className="divide-y divide-gray-700">
        {filteredAndSortedProjects.length === 0 ? (
          <div className="p-6 text-center">
            <div className="text-6xl mb-4">🎯</div>
            <p className="text-gray-400">{projects.length === 0 ? 'No missions deployed.' : 'No search results found.'}</p>
            <p className="text-gray-500 text-sm mt-2">Ready to deploy your first mission?</p>
          </div>
        ) : (
          filteredAndSortedProjects.map((project) => (
            <div
              key={project.id}
              onClick={() => onProjectClick(project)}
              className="group p-6 hover:bg-gray-800/50 cursor-pointer transition-all duration-300 transform hover:scale-[1.02]"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <img src="https://avatars.githubusercontent.com/u/30994093?s=48&v=4" alt="avatar" className="h-5 w-5 rounded-full" />
                      <span className="text-sm text-gray-400">{project.repository_url.split('/').pop()}</span>
                      <h3 className="text-lg font-medium text-white group-hover:text-primary-300 truncate">
                        {project.title}
                      </h3>
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${project.status === 'active'
                          ? 'bg-gradient-to-r from-neon-green to-cyber-500 text-black animate-pulse-fast'
                          : 'bg-gradient-to-r from-gray-600 to-gray-700 text-gray-300'
                          }`}
                      >
                        {project.status === 'active' ? '🟢 ACTIVE' : '🔴 CLOSED'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-700 text-gray-300"
                        title={`Visibility: ${project.visibility}`}
                      >
                        {project.visibility === 'public' && '🌍'}
                        {project.visibility === 'organization' && '🏢'}
                        {project.visibility === 'private' && '🔒'}
                      </span>
                    </div>
                  </div>

                  {/* Repository information */}
                  <div className="mb-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                        </svg>
                        <a
                          href={project.repository_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-cyber-400 hover:text-cyber-300 truncate"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {project.repository_url.replace('https://github.com/', '')}
                        </a>
                      </div>
                      <span className="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded">
                        🌿 {project.branch_name}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                      <div className="flex items-center space-x-1">
                        <img
                          className="h-5 w-5 rounded-full ring-2 ring-primary-500/50"
                          src={project.owner?.avatar_url || '/default-avatar.png'}
                          alt={project.owner?.username || 'Unknown User'}
                        />
                        <span>{project.owner?.username || 'Unknown User'}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span>📅</span>
                        <span>{new Date(project.created_at).toLocaleDateString('en-US')}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span>📁</span>
                        <span>{project.selected_files.length} files</span>
                      </div>
                      {project.total_lines_of_code && project.total_lines_of_code > 0 && (
                        <div className="flex items-center space-x-1">
                          <span>📊</span>
                          <span>{project.total_lines_of_code.toLocaleString()} LoC</span>
                        </div>
                      )}
                    </div>

                    <div className="text-lg font-bold text-neon-green animate-pulse-fast">
                      💰 {project.total_reward_pool.toLocaleString()} TON
                    </div>
                  </div>

                  {/* Organization Access Info - visibility가 'organization'일 때만 표시 */}
                  {project.visibility === 'organization' && project.allowed_organizations && (
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-xs text-gray-400">Accessible to:</span>
                      <div className="flex flex-wrap gap-1">
                        {stringToOrganizations(project.allowed_organizations).slice(0, 3).map(org => (
                          <span key={org} className="text-xs px-2 py-0.5 bg-gray-700 text-gray-300 rounded">
                            🏢 {org}
                          </span>
                        ))}
                        {stringToOrganizations(project.allowed_organizations).length > 3 && (
                          <span className="text-xs px-2 py-0.5 bg-gray-700 text-gray-300 rounded">
                            +{stringToOrganizations(project.allowed_organizations).length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}