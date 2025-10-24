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

  const renderStatusBadge = (status: string) => {
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-medium ${getStatusColor(status)}`}>
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
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-medium ${getSeverityColor(severity)}`}>
        {getSeverityLabel(severity)}
      </span>
    );
  };

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case 'open': return 'text-pixel-accent';
      case 'in_progress': return 'text-blue-600';
      case 'solved': return 'text-pixel-success';
      case 'acknowledged': return 'text-green-700';
      case 'invalid': return 'text-pixel-text-muted';
      case 'duplicated': return 'text-yellow-600';
      default: return 'text-pixel-text';
    }
  };

  const getSeverityTextColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-500';
      case 'high': return 'text-orange-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-gray-400';
      default: return 'text-pixel-text';
    }
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
          Status changed from <span className={`font-bold ${getStatusTextColor(fromStatus)}`}>{getStatusLabel(fromStatus)}</span> to <span className={`font-bold ${getStatusTextColor(toStatus)}`}>{getStatusLabel(toStatus)}</span>.
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
          Severity changed from <span className={`font-bold ${getSeverityTextColor(fromSeverity)}`}>{getSeverityLabel(fromSeverity)}</span> to <span className={`font-bold ${getSeverityTextColor(toSeverity)}`}>{getSeverityLabel(toSeverity)}</span>.
        </span>
      );
    }

    return content;
  };

  const isOwnerOrReporter = user && issue && (user.id === issue.project?.owner_id || user.id === issue.reporter_id);
  const isProjectOwner = user && issue && user.id === issue.project?.owner_id;

  if (loading || !issue) {
    return (
      <div className="min-h-screen bg-pixel-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-pixel-accent mx-auto mb-4"></div>
          <p className="mt-4 text-pixel-text font-medium">Loading issue...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Threat Report Header */}
      <div className="pixel-card bg-pixel-bg-light border-pixel-border p-8">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="mb-6 border-b-4 border-pixel-border pb-4">
              <h1 className="text-2xl font-pixel text-pixel-text">{issue.title}</h1>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-pixel-bg p-4 border-2 border-pixel-border">
                <div className="text-2xl text-pixel-text-muted mb-2 uppercase tracking-wider">
                  Hunter
                </div>
                <div className="flex items-center space-x-2 mt-2">
                  <img
                    className="h-6 w-6 rounded-full"
                    src={issue.reporter.avatar_url}
                    alt={issue.reporter.username}
                  />
                  <span className="text-pixel-text font-medium text-xl">{issue.reporter.username}</span>
                </div>
              </div>
              <div className="bg-pixel-bg p-4 border-2 border-pixel-border">
                <div className="text-2xl text-pixel-text-muted mb-2 uppercase tracking-wider">
                  Discovered
                </div>
                <div className="text-pixel-text font-medium mt-1 text-xl">
                  {new Date(issue.created_at).toLocaleDateString('en-US')}
                </div>
              </div>
              {issue.project && (
                <div className="bg-pixel-bg p-4 border-2 border-pixel-border">
                  <div className="text-2xl text-pixel-text-muted mb-2 uppercase tracking-wider">
                    Mission
                  </div>
                  {issue.can_access_project ? (
                    <Link
                      to={`/projects/${issue.project_id}`}
                      className="text-pixel-accent hover:text-pixel-accent-hover font-medium mt-1 block truncate text-xl"
                    >
                      {issue.project.title}
                    </Link>
                  ) : (
                    <span className="text-pixel-text-muted font-medium mt-1 block truncate">
                      {issue.project.title}
                    </span>
                  )}
                </div>
              )}
              {issue.github_issue_url && (
                <div className="bg-pixel-bg p-4 border-2 border-pixel-border">
                  <div className="text-sm text-pixel-text-muted mb-2 uppercase tracking-wider">
                    GitHub
                  </div>
                  <a
                    href={issue.github_issue_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-pixel-accent hover:text-pixel-accent-hover font-medium mt-1 flex items-center space-x-1"
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

      {/* Mission Control Panel */}
      {isOwnerOrReporter && (
        <div className="pixel-card bg-pixel-bg-light border-pixel-border p-6">
          <h3 className="text-lg font-pixel text-pixel-text mb-4">
            Mission Control
          </h3>
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            {isProjectOwner && (
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-2xl font-medium text-pixel-text-muted mb-2">Status Control</label>
                  <select
                    value={issue.status}
                    onChange={(e) => handleStatusChange(e.target.value as "open" | "in_progress" | "solved" | "acknowledged" | "invalid" | "duplicated")}
                    className="pixel-input text-2xl w-full"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="solved">Solved</option>
                    <option value="acknowledged">Acknowledged</option>
                    <option value="invalid">Invalid</option>
                    <option value="duplicated">Duplicated</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-2xl font-medium text-pixel-text-muted mb-2">Severity Control</label>
                  <select
                    value={issue.severity}
                    onChange={(e) => handleSeverityChange(e.target.value as "low" | "medium" | "high" | "critical")}
                    className="pixel-input text-2xl w-full"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>
            )}
            {user.id === issue.reporter_id && (
              <div className="sm:self-end">
                <button
                  onClick={handleDeleteIssue}
                  className="pixel-btn bg-pixel-danger text-white border-pixel-danger hover:bg-red-600 text-base w-full sm:w-auto"
                >
                  Delete Report
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Issue Description */}
      <div className="pixel-card p-8">
        <h2 className="text-xl font-pixel text-pixel-text mb-6">
          Description
        </h2>
        <div className="prose prose-2xl max-w-none prose-invert font-roboto">
          <EnhancedMarkdown className="text-2xl">
            {issue.description}
          </EnhancedMarkdown>
        </div>
      </div>

      {/* Comments */}
      <div className="pixel-card p-8">
        <h2 className="text-lg font-pixel text-pixel-text mb-6">
          Comments ({comments.length})
        </h2>

        {/* Add Comment */}
        {user && (
          <div className="mb-6">
            <textarea
              rows={4}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="w-full pixel-input text-2xl"
            />
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleAddComment}
                disabled={!newComment.trim() || addingComment}
                className="pixel-btn-primary text-base disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {addingComment ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Posting...</span>
                  </>
                ) : (
                  <span>Post Comment</span>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Comments Feed */}
        {loadingComments ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-4 border-pixel-accent mx-auto mb-4"></div>
            <p className="text-pixel-text font-medium">Loading comments...</p>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-pixel-text-muted text-lg mb-2">No comments yet</p>
            <p className="text-pixel-text-muted text-2xl">Be the first to comment</p>
          </div>
        ) : (
          <div className="space-y-4 text-2xl">
            {comments.map((comment) => (
              <div key={comment.id} className="bg-pixel-bg border-2 border-pixel-border p-6 hover:bg-pixel-bg-light transition-colors">
                <div className="flex items-start space-x-4">
                  {comment.is_system_generated ? (
                    <div className="h-10 w-10 rounded-full bg-pixel-accent flex items-center justify-center text-2xl">
                      🤖
                    </div>
                  ) : (
                    <img
                      className="h-10 w-10 rounded-full"
                      src={comment.user.avatar_url}
                      alt={comment.user.username}
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <span className={`font-bold ${comment.is_system_generated ? 'text-pixel-accent' : 'text-pixel-text'}`}>
                        {comment.is_system_generated ? 'SYSTEM' : comment.user.username}
                      </span>
                      <span className="text-pixel-text-muted">
                        {new Date(comment.created_at).toLocaleDateString('en-US')}
                      </span>
                    </div>
                    <div className="text-pixel-text leading-relaxed">
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