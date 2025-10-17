import { useState } from 'react';
import { Database } from '../lib/supabase';
import { useOrganizations } from '../hooks/useOrganizations';

type Project = Database['public']['Tables']['projects']['Row'] & {
  owner?: {
    username: string;
    avatar_url: string;
  };
  total_lines_of_code?: number;
  start_date?: string;
  end_date?: string;
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
      // 먼저 status로 정렬 (active가 먼저, closed가 나중)
      if (a.status !== b.status) {
        return a.status === 'active' ? -1 : 1;
      }

      // 같은 status 내에서 선택한 기준으로 정렬
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
    <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-xl shadow-2xl w-full">
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
              className={`group p-6 cursor-pointer transition-all duration-300 ${
                project.status === 'closed'
                  ? 'opacity-50 grayscale'
                  : 'hover:bg-gray-800/50'
              }`}
            >
              <div className="flex items-center justify-between">
                {/* 프로젝트 정보 - 왼쪽 영역 (고정 너비) */}
                <div className="flex items-center space-x-3 min-w-0" style={{ width: 'calc(100% - 576px)' }}>
                  <img src='/images/ton.svg' alt="tokamak-network" className="w-8 h-8 object-contain" />
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-400 flex-shrink-0">{project.repository_url.split('/').pop()}</span>
                    <h3 className="text-lg font-medium text-white group-hover:text-primary-300 truncate min-w-0">
                      {project.title}
                    </h3>
                  </div>
                </div>

                {/* 리워드 풀, 시작 날짜, 종료 날짜 - 고정 너비 컬럼들 */}
                <div className="flex items-center justify-between flex-shrink-0" style={{ width: '576px' }}>
                  <div className="w-40 text-center">
                    <div className="text-lg font-bold text-white mb-1">
                      {project.total_reward_pool.toLocaleString()} {project.reward_currency || 'TON'}
                    </div>
                    <div className="text-sm text-gray-400">Rewards</div>
                  </div>

                  <div className="w-48 text-center">
                    <div className="text-lg font-bold text-orange-400 mb-1">
                      {project.start_date
                        ? new Date(project.start_date).toLocaleDateString('ko-KR', {
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                        : '-'
                      }
                    </div>
                    <div className="text-sm text-gray-400">Start Date</div>
                  </div>

                  <div className="w-48 text-center">
                    <div className="text-lg font-bold text-white mb-1">
                      {project.end_date
                        ? new Date(project.end_date).toLocaleDateString('ko-KR', {
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                        : '-'
                      }
                    </div>
                    <div className="text-sm text-gray-400">End Date</div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )
        }
      </div >
    </div >
  );
}