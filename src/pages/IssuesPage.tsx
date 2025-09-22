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
        {/* Mission Selection Header */}
        <div className="relative bg-gradient-to-r from-primary-600 via-cyber-600 to-gaming-600 rounded-xl shadow-2xl p-8 overflow-hidden">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative z-10 flex items-center space-x-4">
            <div className="text-5xl animate-bounce-slow">🎯</div>
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">Target Mission Selection</h1>
              <p className="text-white/90">Choose your target mission for bug discovery</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-xl shadow-2xl p-8 border border-gray-600">
          <label className="block text-sm font-medium text-white mb-4 flex items-center space-x-2">
            {/* <span>🚀</span> */}
            <span>Active Missions</span>
          </label>
          <select
            required
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-white transition-all duration-300"
          >
            <option value="">🔍 Select your target mission...</option>
            {projects
              .filter(p => p.status === 'active')
              .map(project => (
                <option key={project.id} value={project.id} className="bg-gray-800 text-white">
                  🎯 {project.title}
                </option>
              ))}
          </select>

          {projects.filter(p => p.status === 'active').length === 0 && (
            <div className="mt-4 text-center py-8">
              <div className="text-4xl mb-4">🚀</div>
              <p className="text-gray-400">No active missions available</p>
              <p className="text-gray-500 text-sm mt-2">Wait for mission deployment or contact command</p>
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
      <div className="relative bg-gradient-to-r from-gaming-600 via-cyber-600 to-primary-600 rounded-xl shadow-2xl p-8 overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center space-x-4">
              <div className="text-6xl animate-bounce-slow">🐛</div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">Issue Control Center</h1>
                <p className="text-white/90 text-lg">Track and eliminate security vulnerabilities across all missions</p>
              </div>
            </div>
            <button
              onClick={handleNewIssue}
              className="bg-gradient-to-r from-neon-pink to-gaming-500 hover:from-neon-pink/80 hover:to-gaming-400 text-white px-6 py-3 rounded-lg font-bold transition-all duration-300 transform hover:scale-105 flex items-center space-x-2 shadow-lg"
            >
              <span>🔍</span>
              <span>Report Discovery</span>
            </button>
          </div>

          {/* Statistics Dashboard */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-black/30 rounded-xl p-4 border border-white/20">
              <div className="text-sm text-white/80 flex items-center space-x-1">
                <span>🐛</span>
                <span>Total</span>
              </div>
              <div className="text-3xl font-bold text-white animate-pulse-fast">
                {issues.length}
              </div>
            </div>
            <div className="bg-black/30 rounded-xl p-4 border border-white/20">
              <div className="text-sm text-white/80 flex items-center space-x-1">
                <span>🔓</span>
                <span>Active</span>
              </div>
              <div className="text-3xl font-bold text-cyber-400">
                {issues.filter(i => i.status === 'open').length}
              </div>
            </div>
            <div className="bg-black/30 rounded-xl p-4 border border-white/20">
              <div className="text-sm text-white/80 flex items-center space-x-1">
                <span>✅</span>
                <span>Eliminated</span>
              </div>
              <div className="text-3xl font-bold text-neon-green">
                {issues.filter(i => ['solved', 'acknowledged'].includes(i.status)).length}
              </div>
            </div>
            <div className="bg-black/30 rounded-xl p-4 border border-white/20">
              <div className="text-sm text-white/80 flex items-center space-x-1">
                <span>🔴</span>
                <span>Critical Threats</span>
              </div>
              <div className="text-3xl font-bold text-red-400 animate-pulse-fast">
                {issues.filter(i => i.severity === 'critical' && i.status === 'open').length}
              </div>
            </div>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-4 right-20 text-3xl animate-float">🔥</div>
        <div className="absolute bottom-4 right-32 text-2xl animate-pulse-fast">💰</div>
        <div className="absolute top-1/2 right-10 text-xl animate-bounce-slow">⚡</div>
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