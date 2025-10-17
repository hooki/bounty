import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIssues } from '../hooks/useIssues';
import IssueList from '../components/IssueList';
import IssueForm from '../components/IssueForm';
import { useProjects } from '../hooks/useProjects';

export default function IssuesPage() {
  const navigate = useNavigate();
  const { issues, loading, createIssue } = useIssues();
  const { projects } = useProjects();
  const [showForm, setShowForm] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [formLoading, setFormLoading] = useState(false);

  const handleCreateIssue = async (issueData: any) => {
    try {
      setFormLoading(true);
      await createIssue({
        ...issueData,
        project_id: selectedProjectId,
      });
      setShowForm(false);
      setSelectedProjectId('');
    } catch (error) {
      console.error('Issue creation failed:', error);
      alert(error instanceof Error ? error.message : 'Failed to create issue.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleIssueClick = (issue: any) => {
    navigate(`/issues/${issue.id}`);
  };

  const handleNewIssue = () => {
    if (projects.length === 0) {
      alert('Please register a project first.');
      return;
    }
    setShowForm(true);
  };

  if (showForm) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Project Selection */}
        <div className="pixel-card bg-pixel-bg-light border-pixel-border p-8">
          <div className="mb-6">
            <h1 className="text-xl font-pixel text-pixel-text mb-2">Select Project</h1>
            <p className="text-pixel-text-muted text-base">Choose the project for this issue</p>
          </div>

          <label className="block text-sm font-medium text-pixel-text mb-4">
            Active Projects
          </label>
          <select
            required
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="w-full pixel-input text-base"
          >
            <option value="">Select a project...</option>
            {projects
              .filter(p => p.status === 'active')
              .map(project => (
                <option key={project.id} value={project.id}>
                  {project.title}
                </option>
              ))}
          </select>

          {projects.filter(p => p.status === 'active').length === 0 && (
            <div className="mt-4 text-center py-8">
              <p className="text-pixel-text-muted text-lg mb-2">No active projects available</p>
              <p className="text-pixel-text-muted text-sm">Wait for projects to be activated</p>
            </div>
          )}
        </div>

        {selectedProjectId && (
          <IssueForm
            projectId={selectedProjectId}
            onSubmit={handleCreateIssue}
            onCancel={() => {
              setShowForm(false);
              setSelectedProjectId('');
            }}
            loading={formLoading}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Bug Hunt Command Center */}
      <div className="pixel-card bg-pixel-bg-light border-pixel-border p-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-pixel text-pixel-text mb-3">Issue Control Center</h1>
            <p className="text-pixel-text-muted text-base">Track and eliminate security vulnerabilities across all missions</p>
          </div>
          <button
            onClick={handleNewIssue}
            className="pixel-btn-primary text-base"
          >
            Report Discovery
          </button>
        </div>

        {/* Statistics Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-pixel-bg p-4 border-2 border-pixel-border">
            <div className="text-xs text-pixel-text-muted mb-2 uppercase tracking-wider">
              Total
            </div>
            <div className="text-2xl font-pixel text-pixel-text">
              {issues.length}
            </div>
          </div>
          <div className="bg-pixel-bg p-4 border-2 border-pixel-border">
            <div className="text-xs text-pixel-text-muted mb-2 uppercase tracking-wider">
              Active
            </div>
            <div className="text-2xl font-pixel text-pixel-accent">
              {issues.filter(i => i.status === 'open').length}
            </div>
          </div>
          <div className="bg-pixel-bg p-4 border-2 border-pixel-border">
            <div className="text-xs text-pixel-text-muted mb-2 uppercase tracking-wider">
              Eliminated
            </div>
            <div className="text-2xl font-pixel text-pixel-success">
              {issues.filter(i => ['solved', 'acknowledged'].includes(i.status)).length}
            </div>
          </div>
          <div className="bg-pixel-bg p-4 border-2 border-pixel-border">
            <div className="text-xs text-pixel-text-muted mb-2 uppercase tracking-wider">
              Critical Threats
            </div>
            <div className="text-2xl font-pixel text-pixel-danger">
              {issues.filter(i => i.severity === 'critical' && i.status === 'open').length}
            </div>
          </div>
        </div>
      </div>

      {/* Bug Hunt Results */}
      <IssueList
        issues={issues}
        loading={loading}
        onIssueClick={handleIssueClick}
        showProjectTitle={true}
      />
    </div>
  );
}