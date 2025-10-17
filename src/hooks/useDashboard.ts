import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface DashboardStats {
  activeProjects: number;
  reportedIssues: number;
  earnedBounty: number;
  pendingBounty: number;
  totalBounty: number;
  earnedBountyTON: number;
  pendingBountyTON: number;
  totalBountyTON: number;
  earnedBountyUSDC: number;
  pendingBountyUSDC: number;
  totalBountyUSDC: number;
}

export function useDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    activeProjects: 0,
    reportedIssues: 0,
    earnedBounty: 0,
    pendingBounty: 0,
    totalBounty: 0,
    earnedBountyTON: 0,
    pendingBountyTON: 0,
    totalBountyTON: 0,
    earnedBountyUSDC: 0,
    pendingBountyUSDC: 0,
    totalBountyUSDC: 0,
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

      // 3. Bounty Calculation - calculate rewards from user's issues
      const { data: userIssues, error: rewardIssuesError } = await supabase
        .from('issues')
        .select(`
          id,
          severity,
          status,
          project_id,
          project:projects!issues_project_id_fkey(reward_distribution, reward_currency)
        `)
        .eq('reporter_id', user.id);

      if (rewardIssuesError) throw rewardIssuesError;

      // Separate issues by status
      const earnedIssues = userIssues?.filter(issue =>
        ['solved', 'acknowledged'].includes(issue.status)
      ) || [];

      const pendingIssues = userIssues?.filter(issue =>
        ['open', 'in_progress'].includes(issue.status)
      ) || [];

      // Calculate bounties
      let totalEarnedBounty = 0;
      let totalPendingBounty = 0;
      let totalEarnedBountyTON = 0;
      let totalPendingBountyTON = 0;
      let totalEarnedBountyUSDC = 0;
      let totalPendingBountyUSDC = 0;

      // Helper function to calculate bounty for a set of issues
      const calculateBounty = async (issues: any[]) => {
        let totalBounty = 0;
        let totalBountyTON = 0;
        let totalBountyUSDC = 0;

        if (issues && issues.length > 0) {
          // Group issues by project
          const issuesByProject = issues.reduce((acc, issue) => {
            if (!acc[issue.project_id]) {
              acc[issue.project_id] = [];
            }
            acc[issue.project_id].push(issue);
            return acc;
          }, {} as Record<string, any[]>);

          // Calculate rewards for each project
          for (const [projectId, projectIssues] of Object.entries(issuesByProject)) {
            if (projectIssues.length === 0) continue;

            const rewardDistribution = projectIssues[0].project?.reward_distribution as Record<string, number>;
            const rewardCurrency = projectIssues[0].project?.reward_currency || 'TON';
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
              const userSeverityCounts = projectIssues.reduce((acc, issue) => {
                acc[issue.severity] = (acc[issue.severity] || 0) + 1;
                return acc;
              }, {} as Record<string, number>);

              let projectBounty = 0;
              // Calculate reward for each severity
              Object.keys(rewardDistribution).forEach(severity => {
                const userIssueCount = userSeverityCounts[severity] || 0;
                const totalIssueCount = severityTotals[severity] || 0;
                const severityRewardPool = rewardDistribution[severity];

                if (userIssueCount > 0 && totalIssueCount > 0) {
                  const rewardPerIssue = severityRewardPool / totalIssueCount;
                  projectBounty += userIssueCount * rewardPerIssue;
                }
              });

              totalBounty += projectBounty;
              if (rewardCurrency === 'USDC') {
                totalBountyUSDC += projectBounty;
              } else {
                totalBountyTON += projectBounty;
              }
            }
          }
        }

        return { totalBounty, totalBountyTON, totalBountyUSDC };
      };

      // Calculate earned and pending bounties separately
      const earnedResult = await calculateBounty(earnedIssues);
      const pendingResult = await calculateBounty(pendingIssues);

      totalEarnedBounty = earnedResult.totalBounty;
      totalPendingBounty = pendingResult.totalBounty;
      totalEarnedBountyTON = earnedResult.totalBountyTON;
      totalPendingBountyTON = pendingResult.totalBountyTON;
      totalEarnedBountyUSDC = earnedResult.totalBountyUSDC;
      totalPendingBountyUSDC = pendingResult.totalBountyUSDC;

      setStats({
        activeProjects: activeProjects?.length || 0,
        reportedIssues: reportedIssues?.length || 0,
        earnedBounty: Math.round(totalEarnedBounty),
        pendingBounty: Math.round(totalPendingBounty),
        totalBounty: Math.round(totalEarnedBounty + totalPendingBounty),
        earnedBountyTON: Math.round(totalEarnedBountyTON),
        pendingBountyTON: Math.round(totalPendingBountyTON),
        totalBountyTON: Math.round(totalEarnedBountyTON + totalPendingBountyTON),
        earnedBountyUSDC: Math.round(totalEarnedBountyUSDC),
        pendingBountyUSDC: Math.round(totalPendingBountyUSDC),
        totalBountyUSDC: Math.round(totalEarnedBountyUSDC + totalPendingBountyUSDC),
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