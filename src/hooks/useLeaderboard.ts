import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface LeaderboardEntry {
  project_id: string;
  project_title: string;
  user_id: string;
  username: string;
  avatar_url: string;
  total_issues: number;
  critical_issues: number;
  high_issues: number;
  medium_issues: number;
  low_issues: number;
  valid_issues: number;
  estimated_reward: number;
  reward_currency?: string;
}

export function useLeaderboard(projectId: string) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      console.log('Fetching leaderboard for projectId:', projectId);

      // 프로젝트별 이슈 통계 조회 (직접 쿼리)
      let issuesQuery = supabase
        .from('issues')
        .select(`
          id,
          project_id,
          reporter_id,
          severity,
          status,
          project:projects!issues_project_id_fkey(id, title),
          reporter:users!issues_reporter_id_fkey(id, username, avatar_url)
        `);

      console.log('Filtering by project ID:', projectId);
      issuesQuery = issuesQuery.eq('project_id', projectId);

      const { data: issuesData, error: leaderboardError } = await issuesQuery;

      if (leaderboardError) throw leaderboardError;

      console.log('Issues data fetched:', issuesData?.length, 'issues');
      console.log('Sample issues:', issuesData?.slice(0, 3));

      // 리더보드 데이터 생성
      const leaderboardMap = new Map();

      (issuesData || []).forEach(issue => {
        const key = `${issue.project_id}-${issue.reporter_id}`;

        if (!leaderboardMap.has(key)) {
          leaderboardMap.set(key, {
            project_id: issue.project_id,
            project_title: (issue.project as any)?.title || 'Unknown Project',
            user_id: issue.reporter_id,
            username: (issue.reporter as any)?.username || 'Unknown User',
            avatar_url: (issue.reporter as any)?.avatar_url || '',
            total_issues: 0,
            valid_issues: 0,
            critical_issues: 0,
            high_issues: 0,
            medium_issues: 0,
            low_issues: 0,
          });
        }

        const entry = leaderboardMap.get(key);
        entry.total_issues++;

        // 보상 대상 이슈만 카운트
        if (issue.status === 'solved' || issue.status === 'acknowledged') {
          entry.valid_issues++;
          entry[`${issue.severity}_issues`]++;
        }
      });

      // 유효한 이슈가 있는 항목만 필터링하고 배열로 변환
      const leaderboardData = Array.from(leaderboardMap.values())
        .filter(entry => entry.valid_issues > 0)
        .sort((a, b) => {
          if (b.valid_issues !== a.valid_issues) {
            return b.valid_issues - a.valid_issues;
          }
          return b.total_issues - a.total_issues;
        });

      // 보상 계산을 위한 프로젝트 정보와 총 이슈 통계를 먼저 조회
      let projectRewardDistribution: Record<string, number> = {};
      let projectRewardCurrency: string = 'TON';
      let severityTotals: Record<string, number> = {};

      if (leaderboardData.length > 0) {
        // 프로젝트의 보상 분배 정보 조회
        const { data: project } = await supabase
          .from('projects')
          .select('reward_distribution, reward_currency')
          .eq('id', projectId)
          .single();

        if (project) {
          projectRewardDistribution = project.reward_distribution as Record<string, number>;
          projectRewardCurrency = project.reward_currency || 'TON';
        }

        // 해당 프로젝트의 이슈만 조회
        const { data: totalIssues } = await supabase
          .from('issues')
          .select('severity')
          .eq('project_id', projectId)
          .in('status', ['solved', 'acknowledged']);

        console.log('Total issues for project', projectId, ':', totalIssues?.length);
        console.log('Total issues by severity:', totalIssues?.reduce((acc, issue) => {
          acc[issue.severity] = (acc[issue.severity] || 0) + 1;
          return acc;
        }, {} as Record<string, number>));

        if (totalIssues) {
          totalIssues.forEach(issue => {
            severityTotals[issue.severity] = (severityTotals[issue.severity] || 0) + 1;
          });
        }

        console.log('Project reward distribution:', projectRewardDistribution);
        console.log('Severity totals:', severityTotals);
      }

      // 보상 계산
      const leaderboardWithRewards = leaderboardData.map((entry: any) => {
        let estimatedReward = 0;

        Object.keys(projectRewardDistribution).forEach(severity => {
          const userIssueCount = entry[`${severity}_issues`] || 0;
          const totalIssueCount = severityTotals[severity] || 0;
          const severityRewardPool = projectRewardDistribution[severity];

          if (userIssueCount > 0 && totalIssueCount > 0) {
            const rewardPerIssue = severityRewardPool / totalIssueCount;
            const severityReward = userIssueCount * rewardPerIssue;
            estimatedReward += severityReward;

            console.log(`${entry.username} - ${severity}: ${userIssueCount} issues × $${rewardPerIssue.toFixed(2)} = $${severityReward.toFixed(2)}`);
          }
        });

        console.log(`${entry.username} total estimated reward: $${estimatedReward.toFixed(2)}`);

        return {
          ...entry,
          estimated_reward: Math.round(estimatedReward),
          reward_currency: projectRewardCurrency,
        };
      });

      setLeaderboard(leaderboardWithRewards);
    } catch (error) {
      console.error('리더보드 조회 오류:', error);
      setError(error instanceof Error ? error.message : '리더보드를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchLeaderboard();
  }, [projectId]);

  return {
    leaderboard,
    loading,
    error,
    refetch: fetchLeaderboard,
  };
}

export function useRewardCalculation(projectId: string) {
  const [rewardBreakdown, setRewardBreakdown] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);

  const calculateRewards = async () => {
    try {
      setLoading(true);

      // 프로젝트 정보 조회
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('reward_distribution, total_reward_pool')
        .eq('id', projectId)
        .single();

      if (projectError || !project) throw new Error('프로젝트 정보를 찾을 수 없습니다.');

      // 보상 대상 이슈들 조회 (solved, acknowledged만 보상 지급)
      const { data: validIssues, error: issuesError } = await supabase
        .from('issues')
        .select(`
          severity,
          reporter:users!issues_reporter_id_fkey(username, avatar_url)
        `)
        .eq('project_id', projectId)
        .in('status', ['solved', 'acknowledged']); // invalid, duplicated는 보상에서 제외

      if (issuesError) throw issuesError;

      const rewardDistribution = project.reward_distribution as Record<string, number>;
      const breakdown: Record<string, any> = {};

      // 심각도별 이슈 그룹화
      const issuesBySeverity = (validIssues || []).reduce((acc, issue) => {
        if (!acc[issue.severity]) {
          acc[issue.severity] = [];
        }
        acc[issue.severity].push(issue);
        return acc;
      }, {} as Record<string, any[]>);

      // 각 심각도별 보상 계산 (균등 분배)
      Object.keys(rewardDistribution).forEach(severity => {
        const severityIssues = issuesBySeverity[severity] || [];
        const severityRewardPool = rewardDistribution[severity];

        // 해당 심각도 이슈가 있는 경우에만 균등 분배
        const individualReward = severityIssues.length > 0 ? severityRewardPool / severityIssues.length : 0;

        breakdown[severity] = {
          totalPool: severityRewardPool,
          issueCount: severityIssues.length,
          individualReward: Math.round(individualReward),
          issues: severityIssues.map(issue => ({
            reporter: issue.reporter.username,
            avatar_url: issue.reporter.avatar_url,
            reward: Math.round(individualReward), // 각 이슈당 동일한 보상
          })),
        };
      });

      setRewardBreakdown(breakdown);
    } catch (error) {
      console.error('보상 계산 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    rewardBreakdown,
    loading,
    calculateRewards,
  };
}