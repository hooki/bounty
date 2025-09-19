import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/supabase';

type Issue = Database['public']['Tables']['issues']['Row'];
type IssueInsert = Database['public']['Tables']['issues']['Insert'];
type Comment = Database['public']['Tables']['comments']['Row'];

interface IssueWithDetails extends Issue {
  reporter: {
    username: string;
    avatar_url: string;
  };
  project: {
    title: string;
    owner_id: string;
  };
}

export function useIssues(projectId?: string) {
  const [issues, setIssues] = useState<IssueWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIssues = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('issues')
        .select(`
          *,
          reporter:users!issues_reporter_id_fkey(username, avatar_url),
          project:projects!issues_project_id_fkey(title, owner_id)
        `)
        .order('created_at', { ascending: false });

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setIssues(data || []);
    } catch (error) {
      console.error('이슈 조회 오류:', error);
      setError(error instanceof Error ? error.message : '이슈를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, [projectId]);

  const createIssue = async (issueData: Omit<IssueInsert, 'reporter_id'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('로그인이 필요합니다.');

      const { data, error } = await supabase
        .from('issues')
        .insert({
          ...issueData,
          reporter_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      await fetchIssues();
      return data;
    } catch (error) {
      console.error('이슈 생성 오류:', error);
      throw error;
    }
  };

  const updateIssue = async (issueId: string, updates: Partial<Issue>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('로그인이 필요합니다.');

      // 변경 내역을 자동 코멘트로 기록
      const issue = issues.find(i => i.id === issueId);
      if (issue && updates.status && updates.status !== issue.status) {
        await supabase
          .from('comments')
          .insert({
            issue_id: issueId,
            user_id: user.id,
            content: `Status changed from "${issue.status}" to "${updates.status}".`,
            is_system_generated: true,
          });
      }

      const { error } = await supabase
        .from('issues')
        .update(updates)
        .eq('id', issueId);

      if (error) throw error;

      await fetchIssues();
    } catch (error) {
      console.error('이슈 업데이트 오류:', error);
      throw error;
    }
  };

  const deleteIssue = async (issueId: string) => {
    try {
      const { error } = await supabase
        .from('issues')
        .delete()
        .eq('id', issueId);

      if (error) throw error;

      await fetchIssues();
    } catch (error) {
      console.error('이슈 삭제 오류:', error);
      throw error;
    }
  };

  return {
    issues,
    loading,
    error,
    createIssue,
    updateIssue,
    deleteIssue,
    refetch: fetchIssues,
  };
}

export function useComments(issueId: string) {
  const [comments, setComments] = useState<(Comment & { user: { username: string; avatar_url: string } })[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          user:users!comments_user_id_fkey(username, avatar_url)
        `)
        .eq('issue_id', issueId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('댓글 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (issueId) {
      fetchComments();
    }
  }, [issueId]);

  const addComment = async (content: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('로그인이 필요합니다.');

      const { error } = await supabase
        .from('comments')
        .insert({
          issue_id: issueId,
          user_id: user.id,
          content,
          is_system_generated: false,
        });

      if (error) throw error;

      await fetchComments();
    } catch (error) {
      console.error('댓글 추가 오류:', error);
      throw error;
    }
  };

  const updateComment = async (commentId: string, content: string) => {
    try {
      const { error } = await supabase
        .from('comments')
        .update({ content })
        .eq('id', commentId);

      if (error) throw error;

      await fetchComments();
    } catch (error) {
      console.error('댓글 업데이트 오류:', error);
      throw error;
    }
  };

  return {
    comments,
    loading,
    addComment,
    updateComment,
    refetch: fetchComments,
  };
}