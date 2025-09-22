import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface DashboardStats {
  activeProjects: number;
  reportedIssues: number;
  expectedReward: number;
}

export function useDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    activeProjects: 0,
    reportedIssues: 0,
    expectedReward: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardStats = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // 1. Active Projects - projects where user is owner and status is 'active'
      const { data: activeProjects, error: projectsError } = await supabase
        .from('projects')
        .select('id')
        .eq('owner_id', user.id)
        .eq('status', 'active');

      if (projectsError) throw projectsError;

      // 2. Reported Issues - issues reported by the current user
      const { data: reportedIssues, error: issuesError } = await supabase
        .from('issues')
        .select('id')
        .eq('reporter_id', user.id);

      if (issuesError) throw issuesError;

      // 3. Expected Reward - calculate rewards from user's valid issues
      const { data: userIssues, error: rewardIssuesError } = await supabase
        .from('issues')
        .select(`
          id,
          severity,
          status,
          project_id,
          project:projects!issues_project_id_fkey(reward_distribution)
        `)
        .eq('reporter_id', user.id)
        .in('status', ['solved', 'acknowledged']); // Only valid issues count for rewards

      if (rewardIssuesError) throw rewardIssuesError;

      // Calculate expected reward
      let totalExpectedReward = 0;

      if (userIssues && userIssues.length > 0) {
        // Group issues by project to calculate rewards per project
        const issuesByProject = userIssues.reduce((acc, issue) => {
          if (!acc[issue.project_id]) {
            acc[issue.project_id] = [];
          }
          acc[issue.project_id].push(issue);
          return acc;
        }, {} as Record<string, any[]>);

        // Calculate rewards for each project
        for (const [projectId, issues] of Object.entries(issuesByProject)) {
          if (issues.length === 0) continue;

          const rewardDistribution = issues[0].project?.reward_distribution as Record<string, number>;
          if (!rewardDistribution) continue;

          // Get total issues for this project by severity (for calculating individual rewards)
          const { data: projectTotalIssues } = await supabase
            .from('issues')
            .select('severity')
            .eq('project_id', projectId)
            .in('status', ['solved', 'acknowledged']);

          if (projectTotalIssues) {
            // Count total issues by severity for this project
            const severityTotals = projectTotalIssues.reduce((acc, issue) => {
              acc[issue.severity] = (acc[issue.severity] || 0) + 1;
              return acc;
            }, {} as Record<string, number>);

            // Count user's issues by severity for this project
            const userSeverityCounts = issues.reduce((acc, issue) => {
              acc[issue.severity] = (acc[issue.severity] || 0) + 1;
              return acc;
            }, {} as Record<string, number>);

            // Calculate reward for each severity
            Object.keys(rewardDistribution).forEach(severity => {
              const userIssueCount = userSeverityCounts[severity] || 0;
              const totalIssueCount = severityTotals[severity] || 0;
              const severityRewardPool = rewardDistribution[severity];

              if (userIssueCount > 0 && totalIssueCount > 0) {
                const rewardPerIssue = severityRewardPool / totalIssueCount;
                totalExpectedReward += userIssueCount * rewardPerIssue;
              }
            });
          }
        }
      }

      setStats({
        activeProjects: activeProjects?.length || 0,
        reportedIssues: reportedIssues?.length || 0,
        expectedReward: Math.round(totalExpectedReward),
      });
    } catch (error) {
      console.error('Dashboard stats fetch error:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, [user]);

  return {
    stats,
    loading,
    error,
    refetch: fetchDashboardStats,
  };
}