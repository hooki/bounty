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
      <div className="pixel-card p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-4 border-pixel-accent mx-auto"></div>
          <p className="mt-4 text-pixel-text font-medium">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pixel-card w-full">
      {/* Mission Control Panel */}
      <div className="p-6 border-b-4 border-pixel-border">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-pixel-text-muted mb-2 uppercase tracking-wider">Sort</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="pixel-input"
              >
                <option value="created_at">Latest</option>
                <option value="total_reward_pool">Reward Pool</option>
                <option value="status">Status</option>
              </select>
            </div>

            <div>
              <label className="block text-pixel-text-muted mb-2 uppercase tracking-wider">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
                className="pixel-input"
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>

          <div className="w-full sm:w-64">
            <label className="block text-pixel-text-muted mb-2 uppercase tracking-wider">Search</label>
            <input
              type="text"
              placeholder="Find projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pixel-input placeholder-pixel-text-muted"
            />
          </div>
        </div>
      </div>

      {/* Mission List */}
      <div className="divide-y-4 divide-pixel-border">
        {filteredAndSortedProjects.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-pixel-text-muted mb-2">{projects.length === 0 ? 'No projects found' : 'No search results'}</p>
            <p className="text-pixel-text-muted">Try adjusting your search or filters</p>
          </div>
        ) : (
          filteredAndSortedProjects.map((project) => (
            <div
              key={project.id}
              onClick={() => onProjectClick(project)}
              className={`group p-6 cursor-pointer transition-all duration-100 ${project.status === 'closed'
                ? 'opacity-50 grayscale'
                : 'hover:bg-pixel-bg-light'
                }`}
            >
              <div className="flex items-center justify-between">
                {/* 프로젝트 정보 - 왼쪽 영역 (고정 너비) */}
                <div className="flex items-center space-x-4 min-w-0" style={{ width: 'calc(100% - 576px)' }}>
                  <div className="flex-shrink-0">
                    <img src='/images/ton.svg' alt="tokamak-network" className="w-10 h-10 object-contain opacity-80" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <h3 className="font-pixel text-pixel-text group-hover:text-pixel-accent truncate">
                      {project.title}
                    </h3>
                    <span className="text-pixel-text-muted mt-1 truncate">{project.repository_url.split('/').pop()}</span>
                  </div>
                </div>

                {/* 리워드 풀, 시작 날짜, 종료 날짜 - 고정 너비 컬럼들 */}
                <div className="flex items-center justify-between flex-shrink-0 space-x-6" style={{ width: '576px' }}>
                  <div className="w-36 text-right">
                    <div className="text-pixel-text-muted mb-1 text-right">REWARD</div>
                    <div className="font-pixel text-pixel-accent text-right flex items-center justify-end space-x-2">
                      <span>{project.total_reward_pool.toLocaleString()}</span>
                      <img
                        src={project.reward_currency === 'USDC' ? '/images/usdc.png' : '/images/ton.svg'}
                        alt={project.reward_currency || 'TON'}
                        className="w-4 h-4 object-contain inline-block"
                      />
                    </div>
                  </div>

                  <div className="w-44 text-right">
                    <div className="text-pixel-text-muted mb-1 text-right">START</div>
                    <div className="text-pixel-text text-right">
                      {project.start_date
                        ? new Date(project.start_date).toISOString().split('T')[0]
                        : 'Not set'
                      }
                    </div>
                  </div>

                  <div className="w-44 text-right">
                    <div className="text-pixel-text-muted mb-1 text-right">END</div>
                    <div className="text-pixel-text text-right">
                      {project.end_date
                        ? new Date(project.end_date).toISOString().split('T')[0]
                        : 'Not set'
                      }
                    </div>
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