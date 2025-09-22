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
      case 'critical': return 'bg-gradient-to-r from-red-600 to-red-700 text-white animate-pulse-fast';
      case 'high': return 'bg-gradient-to-r from-orange-600 to-orange-700 text-white';
      case 'medium': return 'bg-gradient-to-r from-yellow-600 to-yellow-700 text-white';
      case 'low': return 'bg-gradient-to-r from-green-600 to-green-700 text-white';
      default: return 'bg-gradient-to-r from-gray-600 to-gray-700 text-white';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-gradient-to-r from-cyber-600 to-cyber-700 text-white animate-pulse-fast';
      case 'in_progress': return 'bg-gradient-to-r from-primary-600 to-primary-700 text-white';
      case 'solved': return 'bg-gradient-to-r from-neon-green to-green-600 text-black';
      case 'acknowledged': return 'bg-gradient-to-r from-gaming-600 to-gaming-700 text-white';
      case 'invalid': return 'bg-gradient-to-r from-gray-600 to-gray-700 text-gray-300';
      case 'duplicated': return 'bg-gradient-to-r from-yellow-600 to-yellow-700 text-white';
      default: return 'bg-gradient-to-r from-gray-600 to-gray-700 text-white';
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
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-xl shadow-2xl p-6">
        <div className="text-center py-8">
          <div className="text-5xl mb-4 animate-bounce-slow">🐛</div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-4 border-primary-500 mx-auto mb-4"></div>
          <p className="mt-4 text-white font-medium">Scanning for bugs...</p>
          <div className="mt-2 text-gray-400 text-sm">🔍 Loading hunt results</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-xl shadow-2xl">
      {/* Bug Hunt Control Panel */}
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
                <option value="severity">Threat Level</option>
                <option value="status">Hunt Status</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">📊 Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
                className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Hunts</option>
                <option value="open">🔓 Open</option>
                <option value="in_progress">⏳ In Progress</option>
                <option value="solved">✅ Eliminated</option>
                <option value="acknowledged">🎯 Confirmed</option>
                <option value="invalid">❌ Invalid</option>
                <option value="duplicated">🔄 Duplicate</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">⚠️ Threat Level</label>
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value as typeof filterSeverity)}
                className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Levels</option>
                <option value="critical">🔴 Critical</option>
                <option value="high">🟠 High</option>
                <option value="medium">🟡 Medium</option>
                <option value="low">🟢 Low</option>
              </select>
            </div>
          </div>

          {showReportButton && onReportClick && (
            <button
              onClick={onReportClick}
              className="bg-gradient-to-r from-neon-pink to-gaming-500 hover:from-neon-pink/80 hover:to-gaming-400 text-white px-6 py-3 rounded-lg font-bold transition-all duration-300 transform hover:scale-105 flex items-center space-x-2"
            >
              <span>🔍</span>
              <span>Report Discovery</span>
            </button>
          )}
        </div>
      </div>

      {/* Bug Hunt Results */}
      <div className="divide-y divide-gray-700">
        {filteredAndSortedIssues.length === 0 ? (
          <div className="p-6 text-center">
            <div className="text-6xl mb-4">🕵️</div>
            <p className="text-gray-400">{issues.length === 0 ? 'No issues discovered yet.' : 'No bugs match the hunt criteria.'}</p>
            <p className="text-gray-500 text-sm mt-2">Start hunting for vulnerabilities!</p>
          </div>
        ) : (
          filteredAndSortedIssues.map((issue) => (
            <div
              key={issue.id}
              onClick={() => onIssueClick(issue)}
              className="group p-6 hover:bg-gray-800/50 cursor-pointer transition-all duration-300 transform hover:scale-[1.02]"
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
                        {issue.severity === 'critical' && '🔴'}
                        {issue.severity === 'high' && '🟠'}
                        {issue.severity === 'medium' && '🟡'}
                        {issue.severity === 'low' && '🟢'}
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