import { useState } from 'react';
import { Database } from '../lib/supabase';

type Project = Database['public']['Tables']['projects']['Row'] & {
  owner?: {
    username: string;
    avatar_url: string;
  };
};

interface ProjectListProps {
  projects: Project[];
  loading: boolean;
  onProjectClick: (project: Project) => void;
}

export default function ProjectList({ projects, loading, onProjectClick }: ProjectListProps) {
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
        <div className="flex items-center space-x-2 mb-4">
          <span className="text-2xl">🎛️</span>
          <h2 className="text-lg font-bold text-white">Mission Control Panel</h2>
        </div>
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
                  <div className="flex items-center space-x-3 mb-2">
                    {/* <div className="text-2xl">🚀</div> */}
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

                  <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                    {project.description}
                  </p>

                  {/* Repository information */}
                  <div className="mb-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">🔗</span>
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
                    </div>

                    <div className="text-right">
                      <div className="text-lg font-bold text-neon-green animate-pulse-fast">
                        💰 ${project.total_reward_pool.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-400">Bounty Pool</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reward Distribution Preview */}
              <div className="mt-4 grid grid-cols-4 gap-2">
                {Object.entries(project.reward_distribution as Record<string, number>).map(([severity, amount]) => (
                  <div key={severity} className="text-center p-3 bg-gradient-to-r from-gray-800 to-gray-700 rounded-lg border border-gray-600">
                    <div className="text-xs text-gray-300 capitalize font-medium mb-1">
                      {severity === 'critical' && '🔴'}
                      {severity === 'high' && '🟠'}
                      {severity === 'medium' && '🟡'}
                      {severity === 'low' && '🟢'}
                      {severity}
                    </div>
                    <div className="text-sm font-bold text-white">${amount.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}