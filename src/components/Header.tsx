import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Header() {
  const { user, signOut } = useAuth();
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/', emoji: '🏠' },
    { name: 'Missions', href: '/projects', emoji: '🎯' },
    { name: 'Issues', href: '/issues', emoji: '🐛' },
  ];

  return (
    <header className="relative z-50 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 shadow-2xl border-b border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            {/* Gaming Logo */}
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="text-3xl animate-pulse-fast">⚡</div>
              <div>
                <div className="text-xl font-bold bg-gradient-to-r from-neon-blue to-neon-purple bg-clip-text text-transparent">
                  CyberHunt
                </div>
                <div className="text-xs text-gray-400 -mt-1">Bug Bounty Platform</div>
              </div>
            </Link>

            {user && (
              <>
                {/* Desktop Navigation */}
                <nav className="hidden md:flex space-x-1">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center space-x-2 cursor-pointer ${location.pathname === item.href
                        ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg transform scale-105'
                        : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                        }`}
                    >
                      <span className="text-lg">{item.emoji}</span>
                      <span>{item.name}</span>
                    </Link>
                  ))}
                </nav>

                {/* Mobile Navigation */}
                <nav className="flex md:hidden space-x-1">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-300 flex flex-col items-center cursor-pointer ${location.pathname === item.href
                        ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg'
                        : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                        }`}
                    >
                      <span className="text-lg">{item.emoji}</span>
                      <span className="text-xs mt-1">{item.name.split(' ')[0]}</span>
                    </Link>
                  ))}
                </nav>
              </>
            )}
          </div>

          {user && (
            <div className="flex items-center space-x-4">
              {/* User Profile */}
              <div className="flex items-center space-x-3 bg-gray-800/50 rounded-lg px-3 py-2">
                <img
                  className="h-8 w-8 rounded-full ring-2 ring-primary-500/50"
                  src={user.user_metadata?.avatar_url}
                  alt={user.user_metadata?.user_name}
                />
                <div className="hidden sm:block">
                  <div className="text-sm font-medium text-white">
                    {user.user_metadata?.user_name}
                  </div>
                  <div className="text-xs text-gray-400">Hunter</div>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={signOut}
                className="bg-gradient-to-r from-cyber-600 to-cyber-700 hover:from-cyber-500 hover:to-cyber-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 transform hover:scale-105 flex items-center space-x-2"
              >
                <span>🔌</span>
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}