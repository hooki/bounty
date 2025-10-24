import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Header() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navigation = [
    { name: 'Dashboard', href: '/' },
    { name: 'Missions', href: '/projects' },
    { name: 'Issues', href: '/issues' },
  ];

  return (
    <header className="relative z-50 bg-pixel-bg-light border-b-4 border-pixel-border">
      <div className="w-4/5 mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3 group">
              <div>
                <div className="text-2xl font-pixel text-pixel-accent">
                  BountyHunt
                </div>
                <div className="text-pixel-text-muted -mt-1">Tokamak Network</div>
              </div>
            </Link>

            {user && (
              <>
                {/* Desktop Navigation */}
                <nav className="hidden md:flex space-x-2">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`px-5 py-2 text-2xl font-medium transition-all duration-100 flex items-center cursor-pointer ${location.pathname === item.href
                        ? 'text-pixel-accent border-b-2 border-pixel-accent'
                        : 'text-pixel-text hover:text-pixel-accent'
                        }`}
                    >
                      <span>{item.name}</span>
                    </Link>
                  ))}
                </nav>

                {/* Mobile Navigation */}
                <nav className="flex md:hidden space-x-2">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`px-4 py-2 text-2xl font-medium transition-all duration-100 flex items-center cursor-pointer ${location.pathname === item.href
                        ? 'text-pixel-accent border-b-2 border-pixel-accent'
                        : 'text-pixel-text hover:text-pixel-accent'
                        }`}
                    >
                      <span>{item.name.split(' ')[0]}</span>
                    </Link>
                  ))}
                </nav>
              </>
            )}
          </div>

          {user && (
            <div className="flex items-center space-x-4">
              {/* User Profile */}
              <button
                onClick={() => navigate('/profile')}
                className="flex items-center space-x-3 px-3 py-2 hover:bg-pixel-bg transition-colors cursor-pointer"
              >
                <img
                  className="h-8 w-8 rounded-full ring-2 ring-pixel-border"
                  src={user.user_metadata?.avatar_url}
                  alt={user.user_metadata?.user_name}
                />
                <div className="hidden sm:block">
                  <div className="font-medium text-pixel-text">
                    {user.user_metadata?.user_name}
                  </div>
                  <div className="text-pixel-text-muted">Hunter</div>
                </div>
              </button>

              {/* Logout Button */}
              <button
                onClick={signOut}
                className="pixel-btn-secondary"
              >
                <span className="hidden sm:inline">Logout</span>
                <span className="sm:hidden">Exit</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}