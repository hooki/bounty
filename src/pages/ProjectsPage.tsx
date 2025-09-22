import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjects } from '../hooks/useProjects';
import ProjectList from '../components/ProjectList';
import ProjectForm from '../components/ProjectForm';
import { Database } from '../lib/supabase';

type Project = Database['public']['Tables']['projects']['Row'] & {
  owner?: {
    username: string;
    avatar_url: string;
  };
};

export default function ProjectsPage() {
  const navigate = useNavigate();
  const { projects, loading, createProject } = useProjects();
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  const handleCreateProject = async (projectData: any) => {
    try {
      setFormLoading(true);
      await createProject(projectData);
      setShowForm(false);
    } catch (error) {
      console.error('Project creation failed:', error);
      alert(error instanceof Error ? error.message : 'Failed to create project.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleProjectClick = (project: Project) => {
    navigate(`/projects/${project.id}`);
  };

  if (showForm) {
    return (
      <div className="max-w-4xl mx-auto">
        <ProjectForm
          onSubmit={handleCreateProject}
          onCancel={() => setShowForm(false)}
          loading={formLoading}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-primary-600 via-cyber-600 to-gaming-600 rounded-xl shadow-2xl p-8 overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="text-6xl animate-pulse-fast">🎯</div>
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Mission Control</h1>
              <p className="text-white/90 text-lg">Deploy and manage your cybersecurity missions</p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-neon-green to-cyber-500 hover:from-neon-green/80 hover:to-cyber-400 text-black px-6 py-3 rounded-lg font-bold transition-all duration-300 transform hover:scale-105 flex items-center space-x-2 animate-glow"
          >
            <span>🚀</span>
            <span>Deploy New Mission</span>
          </button>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-4 right-20 text-3xl animate-float">⚡</div>
        <div className="absolute bottom-4 right-32 text-2xl animate-bounce-slow">💎</div>
      </div>

      <ProjectList
        projects={projects}
        loading={loading}
        onProjectClick={handleProjectClick}
      />
    </div>
  );
}