import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import Header from './Header';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce-slow">⚡</div>
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-primary-500 mx-auto mb-4"></div>
          <p className="mt-4 text-white font-medium">Initializing Participants Console...</p>
          <div className="mt-2 text-gray-400 text-sm">🎮 Preparing your cybersecurity adventure</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Animated Background Pattern */}
      <div className="fixed inset-0 opacity-10 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, #6366f1 0%, transparent 50%),
                           radial-gradient(circle at 75% 75%, #d946ef 0%, transparent 50%),
                           radial-gradient(circle at 50% 50%, #06b6d4 0%, transparent 50%)`
        }}></div>
      </div>

      <Header />
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}