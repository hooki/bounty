import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../hooks/useProfile';

export default function ProfilePage() {
  const { user } = useAuth();
  const { profile, loading, updateWalletAddress } = useProfile();
  const [walletAddress, setWalletAddress] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  useEffect(() => {
    if (profile?.wallet_address) {
      setWalletAddress(profile.wallet_address);
    }
  }, [profile]);

  const handleSave = async () => {
    try {
      setSaveLoading(true);
      await updateWalletAddress(walletAddress);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update wallet address:', error);
      alert('Failed to update wallet address.');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleCancel = () => {
    setWalletAddress(profile?.wallet_address || '');
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-pixel-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-pixel-accent mx-auto mb-4"></div>
          <p className="mt-4 text-pixel-text font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Header */}
      <div className="pixel-card bg-pixel-bg-light border-pixel-border p-8">
        <h1 className="text-2xl font-pixel text-pixel-text mb-6 border-b-4 border-pixel-border pb-4">
          Profile Settings
        </h1>

        {/* User Info */}
        <div className="space-y-6">
          <div className="flex items-center space-x-4 p-4 bg-pixel-bg border-2 border-pixel-border">
            <img
              className="h-16 w-16 rounded-full ring-4 ring-pixel-border"
              src={user?.user_metadata?.avatar_url}
              alt={user?.user_metadata?.user_name}
            />
            <div>
              <div className="text-lg font-medium text-pixel-text">
                {user?.user_metadata?.user_name}
              </div>
              <div className="text-2xl text-pixel-text-muted">
                {user?.email}
              </div>
              <div className="text-sm text-pixel-text-muted mt-1">
                Hunter
              </div>
            </div>
          </div>

          {/* Wallet Address */}
          <div className="p-6 bg-pixel-bg border-2 border-pixel-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-pixel text-pixel-text">
                Wallet Address
              </h2>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="pixel-btn-secondary text-2xl"
                >
                  Edit
                </button>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-2xl font-medium text-pixel-text-muted mb-2">
                  Wallet Address
                </label>
                <p className="text-sm text-pixel-text-muted mb-3">
                  Enter your EVM compatible wallet address to receive bug bounty rewards
                </p>
                {isEditing ? (
                  <input
                    type="text"
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                    placeholder="Enter your wallet address"
                    className="w-full px-4 py-3 bg-pixel-bg border-2 border-pixel-border text-pixel-text font-mono text-2xl focus:outline-none focus:border-pixel-accent"
                  />
                ) : (
                  <div className="px-4 py-3 bg-pixel-bg-light border-2 border-pixel-border text-pixel-text font-mono text-2xl">
                    {walletAddress || 'No wallet address set'}
                  </div>
                )}
              </div>

              {isEditing && (
                <div className="flex space-x-3">
                  <button
                    onClick={handleSave}
                    disabled={saveLoading}
                    className="pixel-btn text-2xl"
                  >
                    {saveLoading ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={saveLoading}
                    className="pixel-btn-secondary text-2xl"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* GitHub Info */}
          <div className="p-6 bg-pixel-bg border-2 border-pixel-border">
            <h2 className="text-lg font-pixel text-pixel-text mb-4">
              GitHub Info
            </h2>
            <div className="space-y-3">
              <div>
                <div className="text-sm text-pixel-text-muted mb-1">Username</div>
                <div className="text-2xl text-pixel-text font-mono">
                  {user?.user_metadata?.user_name}
                </div>
              </div>
              <div>
                <div className="text-sm text-pixel-text-muted mb-1">Organization</div>
                <div className="text-2xl text-pixel-text font-mono">
                  {profile?.organization || 'N/A'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
