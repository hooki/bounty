import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useIssues, useComments } from '../hooks/useIssues';
import { useAuth } from '../contexts/AuthContext';
import { EnhancedMarkdown } from '../components/GitHubCodeEmbed';
import { supabase } from '../lib/supabase';

export default function IssueDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { issues, loading, updateIssue, updateIssueSeverity, updateIssueStatus, deleteIssue } = useIssues();
  const { comments, loading: loadingComments, addComment, refetch: refetchComments } = useComments(id || '');

  const [issue, setIssue] = useState<any>(null);
  const [newComment, setNewComment] = useState('');
  const [addingComment, setAddingComment] = useState(false);

  useEffect(() => {
    if (!id) {
      navigate('/issues');
      return;
    }

    const foundIssue = issues.find(i => i.id === id);
    if (foundIssue) {
      setIssue(foundIssue);
    } else if (!loading) {
      navigate('/issues');
    }
  }, [id, issues, loading, navigate]);

  const handleStatusChange = async (newStatus: "open" | "in_progress" | "solved" | "acknowledged" | "invalid" | "duplicated") => {
    if (!issue || !user) return;

    const oldStatus = issue.status;

    try {
      await updateIssueStatus(issue.id, newStatus);

      // Add system comment for status change
      await supabase.from("comments").insert({
        issue_id: issue.id,
        user_id: user.id,
        content: `Status changed from "${oldStatus}" to "${newStatus}".`,
        is_system_generated: true,
      });

      setIssue({ ...issue, status: newStatus });
      refetchComments();
    } catch (error) {
      console.error('Failed to update issue status:', error);
      alert('Failed to update issue status.');
    }
  };

  const handleSeverityChange = async (newSeverity: "low" | "medium" | "high" | "critical") => {
    if (!issue || !user) return;

    const oldSeverity = issue.severity;

    try {
      await updateIssueSeverity(issue.id, newSeverity);

      // Add system comment for severity change
      await supabase.from("comments").insert({
        issue_id: issue.id,
        user_id: user.id,
        content: `Severity changed from "${oldSeverity}" to "${newSeverity}".`,
        is_system_generated: true,
      });

      setIssue({ ...issue, severity: newSeverity });
      refetchComments();
    } catch (error) {
      console.error('Failed to update issue severity:', error);
      alert('Failed to update issue severity.');
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !issue || !user) return;

    try {
      setAddingComment(true);
      await addComment(newComment);
      setNewComment('');
    } catch (error) {
      console.error('Failed to add comment:', error);
      alert('Failed to add comment.');
    } finally {
      setAddingComment(false);
    }
  };

  const handleDeleteIssue = async () => {
    if (!issue || !user) return;

    if (!confirm('Are you sure you want to delete this issue?')) return;

    try {
      await deleteIssue(issue.id);
      navigate('/issues');
    } catch (error) {
      console.error('Failed to delete issue:', error);
      alert('Failed to delete issue.');
    }
  };

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

  const renderStatusBadge = (status: string) => {
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
        {getStatusLabel(status)}
      </span>
    );
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'critical': return 'Critical';
      case 'high': return 'High';
      case 'medium': return 'Medium';
      case 'low': return 'Low';
      default: return severity;
    }
  };

  const renderSeverityBadge = (severity: string) => {
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(severity)}`}>
        {severity === 'critical' && '🔴'}
        {severity === 'high' && '🟠'}
        {severity === 'medium' && '🟡'}
        {severity === 'low' && '🟢'}
        {getSeverityLabel(severity)}
      </span>
    );
  };

  const renderCommentContent = (content: string, isSystemGenerated: boolean) => {
    if (!isSystemGenerated) {
      return content;
    }

    // Check if it's a status change comment
    const statusChangePattern = /Status changed from "([^"]+)" to "([^"]+)"\./;
    const statusMatch = content.match(statusChangePattern);

    if (statusMatch) {
      const [, fromStatus, toStatus] = statusMatch;
      return (
        <span>
          Status changed from {renderStatusBadge(fromStatus)} to {renderStatusBadge(toStatus)}.
        </span>
      );
    }

    // Check if it's a severity change comment
    const severityChangePattern = /Severity changed from "([^"]+)" to "([^"]+)"\./;
    const severityMatch = content.match(severityChangePattern);

    if (severityMatch) {
      const [, fromSeverity, toSeverity] = severityMatch;
      return (
        <span>
          Severity changed from {renderSeverityBadge(fromSeverity)} to {renderSeverityBadge(toSeverity)}.
        </span>
      );
    }

    return content;
  };

  const isOwnerOrReporter = user && issue && (user.id === issue.project?.owner_id || user.id === issue.reporter_id);
  const isProjectOwner = user && issue && user.id === issue.project?.owner_id;

  if (loading || !issue) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce-slow">🔍</div>
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-primary-500 mx-auto mb-4"></div>
          <p className="mt-4 text-white font-medium">Loading bug report...</p>
          <div className="mt-2 text-gray-400 text-sm">🐛 Analyzing threat data</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Navigation Trail */}
      <nav className="flex bg-gradient-to-r from-gray-800 to-gray-700 rounded-lg p-4 border border-gray-600" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-4">
          <li>
            <Link to="/issues" className="text-gray-300 hover:text-white transition-colors duration-300 flex items-center space-x-1">
              <span>🐛</span>
              <span>Bug Hunt</span>
            </Link>
          </li>
          <li>
            <svg className="flex-shrink-0 h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </li>
          <li>
            <span className="text-gray-300 truncate flex items-center space-x-1">
              <span>🎯</span>
              <span>#{issue.id.slice(0, 8)}</span>
            </span>
          </li>
        </ol>
      </nav>

      {/* Threat Report Header */}
      <div className="relative bg-gradient-to-r from-primary-600 via-cyber-600 to-gaming-600 rounded-xl shadow-2xl p-8 overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-4 mb-4">
                <div className="text-4xl animate-bounce-slow">🐛</div>
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">{issue.title}</h1>
                  <div className="flex items-center space-x-3">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${getSeverityColor(issue.severity)}`}>
                      {issue.severity === 'critical' && '🔴'}
                      {issue.severity === 'high' && '🟠'}
                      {issue.severity === 'medium' && '🟡'}
                      {issue.severity === 'low' && '🟢'}
                      {issue.severity.toUpperCase()}
                    </span>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(issue.status)}`}>
                      {getStatusLabel(issue.status)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-black/30 rounded-xl p-4 border border-white/20">
                  <div className="text-sm text-white/80 flex items-center space-x-1">
                    <span>🥷</span>
                    <span>Hunter</span>
                  </div>
                  <div className="flex items-center space-x-2 mt-2">
                    <img
                      className="h-6 w-6 rounded-full ring-2 ring-primary-500/50"
                      src={issue.reporter.avatar_url}
                      alt={issue.reporter.username}
                    />
                    <span className="text-white font-medium">{issue.reporter.username}</span>
                  </div>
                </div>
                <div className="bg-black/30 rounded-xl p-4 border border-white/20">
                  <div className="text-sm text-white/80 flex items-center space-x-1">
                    <span>📅</span>
                    <span>Discovered</span>
                  </div>
                  <div className="text-white font-medium mt-1">
                    {new Date(issue.created_at).toLocaleDateString('en-US')}
                  </div>
                </div>
                {issue.project && (
                  <div className="bg-black/30 rounded-xl p-4 border border-white/20">
                    <div className="text-sm text-white/80 flex items-center space-x-1">
                      <span>🎯</span>
                      <span>Mission</span>
                    </div>
                    {issue.can_access_project ? (
                      <Link
                        to={`/projects/${issue.project_id}`}
                        className="text-cyber-400 hover:text-cyber-300 font-medium mt-1 block truncate"
                      >
                        {issue.project.title}
                      </Link>
                    ) : (
                      <span className="text-gray-400 font-medium mt-1 block truncate">
                        {issue.project.title}
                      </span>
                    )}
                  </div>
                )}
                {issue.github_issue_url && (
                  <div className="bg-black/30 rounded-xl p-4 border border-white/20">
                    <div className="text-sm text-white/80 flex items-center space-x-1">
                      <span>🔗</span>
                      <span>GitHub</span>
                    </div>
                    <a
                      href={issue.github_issue_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyber-400 hover:text-cyber-300 font-medium mt-1 flex items-center space-x-1"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                      </svg>
                      <span>Issue</span>
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-4 right-20 text-3xl animate-float">🔥</div>
        <div className="absolute bottom-4 right-32 text-2xl animate-pulse-fast">💰</div>
      </div>

      {/* Mission Control Panel */}
      {isOwnerOrReporter && (
        <div className="bg-gradient-to-r from-gray-800 to-gray-700 rounded-xl p-6 border border-gray-600">
          <h3 className="text-lg font-medium text-white mb-4 flex items-center space-x-2">
            <span>🎛️</span>
            <span>Mission Control</span>
          </h3>
          <div className="flex space-x-4">
            {isProjectOwner && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Status Control</label>
                  <select
                    value={issue.status}
                    onChange={(e) => handleStatusChange(e.target.value as "open" | "in_progress" | "solved" | "acknowledged" | "invalid" | "duplicated")}
                    className="px-4 py-2 bg-gray-800 border-2 border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300"
                  >
                    <option value="open" className="bg-gray-800">🔓 Open</option>
                    <option value="in_progress" className="bg-gray-800">⏳ In Progress</option>
                    <option value="solved" className="bg-gray-800">✅ Solved</option>
                    <option value="acknowledged" className="bg-gray-800">🎯 Acknowledged</option>
                    <option value="invalid" className="bg-gray-800">❌ Invalid</option>
                    <option value="duplicated" className="bg-gray-800">🔄 Duplicated</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Severity Control</label>
                  <select
                    value={issue.severity}
                    onChange={(e) => handleSeverityChange(e.target.value as "low" | "medium" | "high" | "critical")}
                    className="px-4 py-2 bg-gray-800 border-2 border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300"
                  >
                    <option value="low" className="bg-gray-800">🟢 Low</option>
                    <option value="medium" className="bg-gray-800">🟡 Medium</option>
                    <option value="high" className="bg-gray-800">🟠 High</option>
                    <option value="critical" className="bg-gray-800">🔴 Critical</option>
                  </select>
                </div>
              </>
            )}
            {user.id === issue.reporter_id && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Report Control</label>
                <button
                  onClick={handleDeleteIssue}
                  className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white px-4 py-2 rounded-lg font-bold transition-all duration-300 transform hover:scale-105 flex items-center space-x-2"
                >
                  <span>🗑️</span>
                  <span>Delete Report</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Threat Analysis Report */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-xl shadow-2xl p-8 border border-gray-600">
        <h2 className="text-lg font-medium text-white mb-6 flex items-center space-x-2">
          <span>📊</span>
          <span>Threat Analysis Report</span>
        </h2>
        <EnhancedMarkdown>
          {issue.description}
        </EnhancedMarkdown>
      </div>

      {/* Hunter Communications */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-xl shadow-2xl p-8 border border-gray-600">
        <h2 className="text-lg font-medium text-white mb-6 flex items-center space-x-2">
          <span>💬</span>
          <span>Communications ({comments.length})</span>
        </h2>

        {/* Add Communication */}
        {user && (
          <div className="mb-6">
            <textarea
              rows={4}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Share your findings, analysis, or updates..."
              className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300"
            />
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleAddComment}
                disabled={!newComment.trim() || addingComment}
                className="bg-gradient-to-r from-neon-green to-cyber-500 hover:from-neon-green/80 hover:to-cyber-400 text-black px-6 py-3 rounded-lg font-bold transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center space-x-2"
              >
                {addingComment ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                    <span>Transmitting...</span>
                  </>
                ) : (
                  <>
                    <span>📡</span>
                    <span>Transmit</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Communications Feed */}
        {loadingComments ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4 animate-bounce-slow">📡</div>
            <div className="animate-spin rounded-full h-8 w-8 border-b-4 border-primary-500 mx-auto mb-4"></div>
            <p className="text-white font-medium">Loading communications...</p>
            <div className="mt-2 text-gray-400 text-sm">💬 Decrypting messages</div>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">🔇</div>
            <p className="text-gray-400">No communications yet.</p>
            <p className="text-gray-500 text-sm mt-2">Start the conversation with fellow hunters</p>
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="bg-gray-800/50 border border-gray-600 rounded-xl p-6 hover:bg-gray-700/50 transition-all duration-300">
                <div className="flex items-start space-x-4">
                  <img
                    className="h-10 w-10 rounded-full ring-2 ring-primary-500/50"
                    src={comment.user.avatar_url}
                    alt={comment.user.username}
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <span className="font-bold text-white flex items-center space-x-1">
                        <span>{comment.user.username}</span>
                      </span>
                      {comment.is_system_generated && (
                        <span className="bg-gradient-to-r from-cyber-600 to-cyber-700 text-white text-xs px-3 py-1 rounded-full font-bold">
                          🤖 SYSTEM
                        </span>
                      )}
                      <span className="text-sm text-gray-400 flex items-center space-x-1">
                        <span>📅</span>
                        <span>{new Date(comment.created_at).toLocaleDateString('en-US')}</span>
                      </span>
                    </div>
                    <div className="text-gray-300 leading-relaxed">
                      {renderCommentContent(comment.content, comment.is_system_generated)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}