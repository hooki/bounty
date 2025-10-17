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
    <div className="pixel-card">
      {/* Control Panel */}
      <div className="p-6 border-b-4 border-pixel-border">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between space-y-4 sm:space-y-0 gap-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 flex-1">
            <div className="flex-1 sm:flex-initial">
              <label className="block text-xs text-pixel-text-muted mb-2 uppercase tracking-wider">Sort</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="pixel-input text-sm w-full"
              >
                <option value="created_at">Latest</option>
                <option value="severity">Severity</option>
                <option value="status">Status</option>
              </select>
            </div>

            <div className="flex-1 sm:flex-initial">
              <label className="block text-xs text-pixel-text-muted mb-2 uppercase tracking-wider">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
                className="pixel-input text-sm w-full"
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

            <div className="flex-1 sm:flex-initial">
              <label className="block text-xs text-pixel-text-muted mb-2 uppercase tracking-wider">Severity</label>
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value as typeof filterSeverity)}
                className="pixel-input text-sm w-full"
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
              className="pixel-btn-primary text-base w-full sm:w-auto"
            >
              Report Issue
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="divide-y-4 divide-pixel-border">
        {filteredAndSortedIssues.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-pixel-text-muted text-lg mb-2">{issues.length === 0 ? 'No issues found' : 'No matching issues'}</p>
            <p className="text-pixel-text-muted text-sm">Try adjusting your filters</p>
          </div>
        ) : (
          filteredAndSortedIssues.map((issue) => (
            <div
              key={issue.id}
              onClick={() => onIssueClick(issue)}
              className="group p-6 hover:bg-pixel-bg-light cursor-pointer transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3 mb-2 justify-between">
                    <div className="flex items-center gap-3">
                      <img src="https://avatars.githubusercontent.com/u/30994093?s=48&v=4" alt="avatar" className="h-5 w-5 rounded-full" />
                      <span className="text-sm text-gray-400">{issue.project.repository_url.split('/').pop()}</span>
                      <h3 className="text-lg font-medium text-white group-hover:text-primary-300 truncate">
                        {issue.title}
                      </h3>
                    </div>
                    <div className="flex gap-2">
                      {issue.status !== 'invalid' && <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${getSeverityColor(issue.severity)}`}>
                        {issue.severity.toUpperCase()}
                      </span>}
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(issue.status)}`}>
                        {getStatusLabel(issue.status)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 text-sm text-gray-400">
                    <div className="flex gap-1">
                      <span>Issue reported by</span>
                      <span className="font-medium text-blue-500">{issue.reporter.username}</span>
                    </div>
                    {/* <div className="flex items-center space-x-1">
                      <img
                        className="h-5 w-5 rounded-full ring-2 ring-primary-500/50"
                        src={issue.reporter.avatar_url}
                        alt={issue.reporter.username}
                      />
                      <span>{issue.reporter.username}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span>📅</span>
                      <span>{new Date(issue.created_at).toLocaleDateString('en-US')}</span>
                    </div>
                    {issue.github_issue_url && (
                      <div className="flex items-center space-x-1 text-cyber-400 hover:text-cyber-300">
                        <span>🔗</span>
                        <span>GitHub</span>
                      </div>
                    )} */}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}