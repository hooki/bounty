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
      <div className="pixel-card bg-pixel-bg-light border-pixel-border p-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-pixel text-pixel-text mb-3">Mission Control</h1>
            <p className="text-pixel-text-muted text-2xl">Deploy and manage your cybersecurity missions</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="pixel-btn-primary text-base"
          >
            Deploy New Mission
          </button>
        </div>
      </div>

      <ProjectList
        projects={projects}
        loading={loading}
        onProjectClick={handleProjectClick}
      />
    </div>
  );
}