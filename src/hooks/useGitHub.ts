import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
  description: string | null;
  default_branch: string;
}

interface GitHubBranch {
  name: string;
  commit: {
    sha: string;
  };
}

interface GitHubTreeItem {
  path: string;
  mode: string;
  type: 'blob' | 'tree';
  sha: string;
  size?: number;
}

export function useGitHub() {
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);

  const getAccessToken = () => {
    return session?.provider_token;
  };

  const fetchUserRepos = async (): Promise<GitHubRepo[]> => {
    const token = getAccessToken();
    if (!token) {
      console.error('GitHub access token is missing');
      throw new Error('GitHub 액세스 토큰이 없습니다. GitHub로 로그인해주세요.');
    }

    setLoading(true);
    try {
      console.log('Fetching GitHub repositories...');
      const response = await fetch('https://api.github.com/user/repos?per_page=100&sort=updated', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'BugBounty-Platform',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('GitHub API Error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });

        if (response.status === 401) {
          throw new Error('GitHub 인증이 만료되었습니다. 다시 로그인해주세요.');
        } else if (response.status === 403) {
          throw new Error('GitHub API 요청 제한에 도달했습니다. 잠시 후 다시 시도해주세요.');
        } else {
          throw new Error(`저장소 목록을 가져오는데 실패했습니다. (${response.status})`);
        }
      }

      const repos = await response.json();
      console.log('Successfully fetched repositories:', repos.length);

      // Private 저장소 제외
      const publicRepos = repos.filter((repo: GitHubRepo) => !repo.private);
      console.log('Public repositories found:', publicRepos.length);

      return publicRepos;
    } catch (error) {
      console.error('Error fetching repositories:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const fetchRepoBranches = async (repoFullName: string): Promise<GitHubBranch[]> => {
    const token = getAccessToken();
    if (!token) throw new Error('GitHub 액세스 토큰이 없습니다.');

    try {
      console.log(`Fetching branches for ${repoFullName}...`);
      const response = await fetch(`https://api.github.com/repos/${repoFullName}/branches`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'BugBounty-Platform',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('GitHub Branches API Error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        throw new Error(`브랜치 목록을 가져오는데 실패했습니다. (${response.status})`);
      }

      const branches = await response.json();
      console.log('Successfully fetched branches:', branches.length);
      return branches;
    } catch (error) {
      console.error('Error fetching branches:', error);
      throw error;
    }
  };

  const fetchRepoTree = async (repoFullName: string, sha: string): Promise<GitHubTreeItem[]> => {
    const token = getAccessToken();
    if (!token) throw new Error('GitHub 액세스 토큰이 없습니다.');

    try {
      console.log(`Fetching file tree for ${repoFullName} (${sha})...`);
      const response = await fetch(`https://api.github.com/repos/${repoFullName}/git/trees/${sha}?recursive=1`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'BugBounty-Platform',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('GitHub Tree API Error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        throw new Error(`파일 트리를 가져오는데 실패했습니다. (${response.status})`);
      }

      const data = await response.json();
      const files = data.tree.filter((item: GitHubTreeItem) => item.type === 'blob');
      console.log('Successfully fetched files:', files.length);
      return files;
    } catch (error) {
      console.error('Error fetching file tree:', error);
      throw error;
    }
  };

  const checkUserAuth = async (): Promise<any> => {
    const token = getAccessToken();
    if (!token) throw new Error('GitHub 액세스 토큰이 없습니다.');

    try {
      console.log('Checking GitHub user authentication...');
      const response = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'BugBounty-Platform',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('GitHub User API Error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        throw new Error(`GitHub 사용자 정보를 가져오는데 실패했습니다. (${response.status})`);
      }

      const user = await response.json();
      console.log('GitHub user authenticated:', user.login);
      return user;
    } catch (error) {
      console.error('Error checking user auth:', error);
      throw error;
    }
  };

  const createIssue = async (repoFullName: string, title: string, body: string): Promise<string> => {
    const token = getAccessToken();
    if (!token) throw new Error('GitHub 액세스 토큰이 없습니다.');

    try {
      console.log(`Creating issue in ${repoFullName}...`);
      const response = await fetch(`https://api.github.com/repos/${repoFullName}/issues`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'User-Agent': 'BugBounty-Platform',
        },
        body: JSON.stringify({
          title,
          body,
          labels: ['security', 'bug-bounty']
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('GitHub Issue Creation Error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        throw new Error(`GitHub 이슈 생성에 실패했습니다. (${response.status})`);
      }

      const issue = await response.json();
      console.log('Successfully created issue:', issue.html_url);
      return issue.html_url;
    } catch (error) {
      console.error('Error creating issue:', error);
      throw error;
    }
  };

  return {
    loading,
    fetchUserRepos,
    fetchRepoBranches,
    fetchRepoTree,
    createIssue,
    checkUserAuth,
  };
}