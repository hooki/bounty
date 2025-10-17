import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Profile {
  id: string;
  github_id: string;
  username: string;
  avatar_url: string;
  email: string;
  organization: string;
  wallet_address: string | null;
  created_at: string;
}

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user!.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateWalletAddress = async (walletAddress: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ wallet_address: walletAddress })
        .eq('id', user!.id);

      if (error) throw error;

      // Update local state
      setProfile(prev => prev ? { ...prev, wallet_address: walletAddress } : null);
    } catch (error) {
      console.error('Failed to update wallet address:', error);
      throw error;
    }
  };

  return {
    profile,
    loading,
    updateWalletAddress,
    refetch: fetchProfile,
  };
}
