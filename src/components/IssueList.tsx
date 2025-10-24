import { useState } from 'react';
import { Database } from '../lib/supabase';

type Issue = Database['public']['Tables']['issues']['Row'] & {
  reporter: {
    username: string;
    avatar_url: string;
  };
  project: {
    title: string;
    owner_id: string;
    repository_url: string;
  };
};

interface IssueListProps {
  issues: Issue[];
  loading: boolean;
  onIssueClick: (issue: Issue) => void;
  showProjectTitle?: boolean;
  showReportButton?: boolean;
  onReportClick?: () => void;
}

export default function IssueList({ issues, loading, onIssueClick, showProjectTitle = false, showReportButton = false, onReportClick }: IssueListProps) {
  const [sortBy, setSortBy] = useState<'created_at' | 'severity' | 'status'>('created_at');
  const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'in_progress' | 'solved' | 'acknowledged' | 'invalid' | 'duplicated'>('all');
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'low' | 'medium' | 'high' | 'critical'>('all');

  const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
  const statusOrder = { open: 1, in_progress: 2, solved: 3, acknowledged: 4, invalid: 5, duplicated: 6 };

  const filteredAndSortedIssues = issues
    .filter(issue => {
      const matchesStatus = filterStatus === 'all' || issue.status === filterStatus;
      const matchesSeverity = filterSeverity === 'all' || issue.severity === filterSeverity;
      return matchesStatus && matchesSeverity;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'severity':
          return severityOrder[b.severity] - severityOrder[a.severity];
        case 'status':
          return statusOrder[a.status] - statusOrder[b.status];
        case 'created_at':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });
  console.log("filteredAndSortedIssues")
  console.log(filteredAndSortedIssues)

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-pixel-danger text-white border border-pixel-danger';
      case 'high': return 'bg-orange-600 text-white border border-orange-600';
      case 'medium': return 'bg-pixel-warning text-pixel-bg border border-pixel-warning';
      case 'low': return 'bg-pixel-success text-white border border-pixel-success';
      default: return 'bg-pixel-bg-light text-pixel-text border border-pixel-border';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-pixel-accent text-white border border-pixel-accent';
      case 'in_progress': return 'bg-blue-600 text-white border border-blue-600';
      case 'solved': return 'bg-pixel-success text-white border border-pixel-success';
      case 'acknowledged': return 'bg-green-700 text-white border border-green-700';
      case 'invalid': return 'bg-pixel-bg-light text-pixel-text-muted border border-pixel-border';
      case 'duplicated': return 'bg-yellow-600 text-white border border-yellow-600';
      default: return 'bg-pixel-bg-light text-pixel-text border border-pixel-border';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open': return 'Open';
      case 'in_progress': return 'In Progress';
      case 'solved': return 'Solved';
      case 'acknowledged': return 'Acknowledged';
      case 'invalid': return 'Invalid';
      case 'duplicated': return 'Duplicated';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="pixel-card p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-4 border-pixel-accent mx-auto mb-4"></div>
          <p className="mt-4 text-pixel-text font-medium">Loading issues...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pixel-card w-full">
      {/* Control Panel */}
      <div className="p-6 border-b-4 border-pixel-border">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-sm text-pixel-text-muted mb-2 uppercase tracking-wider">Sort</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="pixel-input text-2xl"
              >
                <option value="created_at">Latest</option>
                <option value="severity">Severity</option>
                <option value="status">Status</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-pixel-text-muted mb-2 uppercase tracking-wider">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
                className="pixel-input text-2xl"
              >
                <option value="all">All</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="solved">Solved</option>
                <option value="acknowledged">Acknowledged</option>
                <option value="invalid">Invalid</option>
                <option value="duplicated">Duplicated</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-pixel-text-muted mb-2 uppercase tracking-wider">Severity</label>
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value as typeof filterSeverity)}
                className="pixel-input text-2xl"
              >
                <option value="all">All</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          {showReportButton && onReportClick && (
            <button
              onClick={onReportClick}
              className="pixel-btn-primary text-base"
            >
              Report Issue
            </button>
          )}
        </div>
      </div>

      {/* Issue List */}
      <div className="divide-y-4 divide-pixel-border">
        {filteredAndSortedIssues.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-pixel-text-muted text-lg mb-2">{issues.length === 0 ? 'No issues found' : 'No search results'}</p>
            <p className="text-pixel-text-muted text-2xl">Try adjusting your search or filters</p>
          </div>
        ) : (
          filteredAndSortedIssues.map((issue) => (
            <div
              key={issue.id}
              onClick={() => onIssueClick(issue)}
              className="group p-6 cursor-pointer transition-all duration-100 hover:bg-pixel-bg-light"
            >
              <div className="flex items-center justify-between">
                {/* 이슈 정보 - 왼쪽 영역 */}
                <div className="flex items-center space-x-4 min-w-0 flex-1">
                  <div className="flex-shrink-0">
                    <img src='/images/ton.svg' alt="tokamak-network" className="w-10 h-10 object-contain opacity-80" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <h3 className="text-2xl font-pixel text-pixel-text group-hover:text-pixel-accent truncate">
                      {issue.title}
                    </h3>
                    <span className="text-2xl text-pixel-text-muted mt-1 truncate">{issue.project.repository_url.split('/').pop()}</span>
                  </div>
                </div>

                {/* 상태 및 심각도 - 오른쪽 영역 */}
                <div className="flex items-center space-x-3 flex-shrink-0 ml-4">
                  {issue.status !== 'invalid' && (
                    <span className={`inline-flex items-center px-3 py-1 text-sm font-pixel ${getSeverityColor(issue.severity)}`}>
                      {issue.severity.toUpperCase()}
                    </span>
                  )}

                  <span className={`inline-flex items-center px-3 py-1 text-sm font-pixel ${getStatusColor(issue.status)}`}>
                    {getStatusLabel(issue.status).toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}