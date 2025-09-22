import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithGitHub: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // 초기 세션 확인
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (!mounted) return;

        if (error) {
          console.error('Session initialization error:', error);
          setLoading(false);
          return;
        }

        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // 기존 세션이 있으면 사용자 프로필 동기화
        if (session?.user) {
          await syncUserProfile(session.user);
        }

        setLoading(false);
      } catch (error) {
        console.error('Auth initialization failed:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // 인증 상태 변경 리스너
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event) => {
      if (!mounted) return;

      if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
      }
    });

    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const syncUserProfile = async (user: User) => {
    try {
      const githubData = user.user_metadata;

      if (!githubData?.user_name) {
        console.error('Missing GitHub user data');
        return;
      }

      const organization = await getUserOrganization(githubData.user_name);

      // 허용된 조직 체크
      const allowedOrgs = process.env.VITE_ALLOWED_ORGANIZATIONS?.split(',') || [];
      if (allowedOrgs?.[0] !== "all") {
        if (allowedOrgs.length > 0 && !allowedOrgs.includes(organization)) {
          console.warn(`Unauthorized organization: ${organization}`);
          await signOut();
          throw new Error('Unauthorized organization.');
        }
      }

      const { error } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          github_id: githubData.provider_id,
          username: githubData.user_name,
          avatar_url: githubData.avatar_url,
          email: user.email || '',
          organization: organization,
        });

      if (error) {
        console.error('User profile sync error:', error);
        // 프로필 동기화 실패가 치명적이지 않도록 처리
        // throw하지 않고 로그만 남김
      }
    } catch (error) {
      console.error('User profile sync failed:', error);
      // organization 체크 실패의 경우에만 throw
      if (error instanceof Error && error.message.includes('Unauthorized organization')) {
        throw error;
      }
    }
  };

  const getUserOrganization = async (username: string): Promise<string> => {
    try {
      // GitHub API를 통해 사용자의 조직 정보를 가져옵니다
      // 실제 구현에서는 GitHub API 토큰이 필요할 수 있습니다
      const response = await fetch(`https://api.github.com/users/${username}/orgs`);

      if (!response.ok) {
        console.warn(`GitHub API responded with status: ${response.status}`);
        return username;
      }

      const orgs = await response.json();

      // 첫 번째 조직을 반환하거나, 개인 계정의 경우 username을 반환
      return orgs.length > 0 ? orgs[0].login : username;
    } catch (error) {
      console.error('Failed to fetch organization info:', error);
      // 네트워크 오류 시 username을 기본값으로 사용
      return username;
    }
  };

  const signInWithGitHub = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          scopes: 'read:org repo',
          redirectTo: window.location.origin,
        },
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('GitHub 로그인 오류:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('로그아웃 오류:', error);
      throw error;
    }
  };

  const value = {
    user,
    session,
    loading,
    signInWithGitHub,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}