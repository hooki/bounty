import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface SettlementEntry {
  user_id: string;
  username: string;
  avatar_url: string;
  wallet_address: string | null;
  total_reward: number;
  critical_issues: number;
  high_issues: number;
  medium_issues: number;
  low_issues: number;
}

export function useSettlement(projectId: string) {
  const [settlements, setSettlements] = useState<SettlementEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettlements = async () => {
    try {
      setLoading(true);

      // Get project reward distribution
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('reward_distribution')
        .eq('id', projectId)
        .single();

      if (projectError || !project) throw new Error('Project not found');

      const rewardDistribution = project.reward_distribution as Record<string, number>;

      // Get all solved/acknowledged issues for the project
      const { data: issues, error: issuesError } = await supabase
        .from('issues')
        .select(`
          severity,
          reporter_id,
          reporter:users!issues_reporter_id_fkey(id, username, avatar_url, wallet_address)
        `)
        .eq('project_id', projectId)
        .in('status', ['solved', 'acknowledged']);

      if (issuesError) throw issuesError;

      // Count total issues per severity
      const severityTotals: Record<string, number> = {};
      (issues || []).forEach(issue => {
        severityTotals[issue.severity] = (severityTotals[issue.severity] || 0) + 1;
      });

      // Group by user and calculate rewards
      const userMap = new Map<string, SettlementEntry>();

      (issues || []).forEach(issue => {
        const reporter = issue.reporter as any;
        const userId = reporter.id;

        if (!userMap.has(userId)) {
          userMap.set(userId, {
            user_id: userId,
            username: reporter.username,
            avatar_url: reporter.avatar_url,
            wallet_address: reporter.wallet_address || null,
            total_reward: 0,
            critical_issues: 0,
            high_issues: 0,
            medium_issues: 0,
            low_issues: 0,
          });
        }

        const entry = userMap.get(userId)!;
        entry[`${issue.severity}_issues` as keyof SettlementEntry] =
          (entry[`${issue.severity}_issues` as keyof SettlementEntry] as number) + 1;
      });

      // Calculate rewards
      const settlementData = Array.from(userMap.values()).map(entry => {
        let totalReward = 0;

        Object.keys(rewardDistribution).forEach(severity => {
          const userIssueCount = entry[`${severity}_issues` as keyof SettlementEntry] as number || 0;
          const totalIssueCount = severityTotals[severity] || 0;
          const severityRewardPool = rewardDistribution[severity];

          if (userIssueCount > 0 && totalIssueCount > 0) {
            const rewardPerIssue = severityRewardPool / totalIssueCount;
            totalReward += userIssueCount * rewardPerIssue;
          }
        });

        return {
          ...entry,
          total_reward: Math.round(totalReward),
        };
      });

      // Sort by total reward descending
      settlementData.sort((a, b) => b.total_reward - a.total_reward);

      setSettlements(settlementData);
    } catch (error) {
      console.error('Settlement fetch error:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch settlement data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchSettlements();
    }
  }, [projectId]);

  return {
    settlements,
    loading,
    error,
    refetch: fetchSettlements,
  };
}
