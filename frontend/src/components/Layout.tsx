import { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  ListOrdered,
  Users,
  MapPin,
  FileText,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  TriangleAlert,
  ChevronDown,
  ChevronRight,
  Settings
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [abuseMenuOpen, setAbuseMenuOpen] = useState(
    location.pathname.startsWith('/abuse-safety')
  );
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const { user, logout } = useAuth();

  const mainNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Food Listings', href: '/food-listings', icon: ListOrdered },
    { name: 'User Activity', href: '/user-activity', icon: Users },
    { name: 'Location Activity', href: '/location-activity', icon: MapPin },
    { name: 'Generate Report', href: '/reports', icon: FileText },
  ];

  const isActive = (path: string) => location.pathname === path;

  const isAbuseSection = location.pathname.startsWith('/abuse-safety');

  // Actual sign out execution triggered from inside the modal
  const confirmSignOut = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    try {
      await logout();
      setShowSignOutModal(false);
      setSidebarOpen(false);
      navigate('/login', { replace: true });
    } catch (err) {
      console.error("Sign out error:", err);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white shadow-md"
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`admin-sidebar fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="admin-sidebar-brand px-6 py-6">
            <div className="flex items-center gap-3">
              <img
                src="/zero_hunger_um_logo.png"
                alt="Zero Hunger UM"
                className="w-10 h-auto mx-auto mb-4"
              />
              <div>
                <h1 className="admin-sidebar-brand-title text-xl font-semibold">Zero Hunger UM</h1>
                <p className="admin-sidebar-brand-subtitle text-xs">Admin Dashboard</p>
              </div>
            </div>
          </div>

          {/* Navigation */}

          <nav className="flex-1 px-4 py-6 overflow-y-auto">

            {/* Main Menu */}
            <div className="mb-7">
              <p className="admin-sidebar-section-label px-4 mb-3 text-[10px] font-semibold uppercase tracking-[0.16em]">
                Main Menu
              </p>

              <div className="space-y-1.5">
                {mainNavigation.map((item) => {
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`admin-sidebar-nav-item ${isActive(item.href) ? 'active' : ''
                        }`}
                    >
                      <Icon size={19} className="admin-sidebar-nav-icon" />
                      <span>{item.name}</span>

                      {isActive(item.href) && (
                        <span className="admin-sidebar-active-indicator" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Safety & Moderation */}
            <div className="mb-7">
              <p className="admin-sidebar-section-label px-4 mb-3 text-[10px] font-semibold uppercase tracking-[0.16em]">
                Safety & Moderation
              </p>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setAbuseMenuOpen(!abuseMenuOpen)}
                  className={`admin-sidebar-nav-item w-full ${isAbuseSection ? 'active' : ''
                    }`}
                >
                  <TriangleAlert size={19} className="admin-sidebar-nav-icon" />
                  <span className="flex-1 text-left">Abuse & Safety</span>

                  {abuseMenuOpen ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  )}
                </button>

                {abuseMenuOpen && (
                  <div className="ml-5 space-y-1.5 border-l border-white/15 pl-3 py-1">
                    <Link
                      to="/abuse-safety"
                      onClick={() => setSidebarOpen(false)}
                      className={`admin-sidebar-nav-item text-sm ${location.pathname === '/abuse-safety' ? 'active' : ''
                        }`}
                    >
                      <ListOrdered size={17} className="admin-sidebar-nav-icon" />
                      <span>Ticket Queue</span>
                    </Link>

                    <Link
                      to="/abuse-safety/ai-config"
                      onClick={() => setSidebarOpen(false)}
                      className={`admin-sidebar-nav-item text-sm ${location.pathname === '/abuse-safety/ai-config' ? 'active' : ''
                        }`}
                    >
                      <Settings size={17} className="admin-sidebar-nav-icon" />
                      <span>AI Configuration</span>
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Administration */}
            {user?.role === 'super_admin' && (
              <div>
                <p className="admin-sidebar-section-label px-4 mb-3 text-[10px] font-semibold uppercase tracking-[0.16em]">
                  Administration
                </p>

                <Link
                  to="/admin-approval"
                  onClick={() => setSidebarOpen(false)}
                  className={`admin-sidebar-nav-item ${isActive('/admin-approval') ? 'active' : ''
                    }`}
                >
                  <ShieldCheck size={19} className="admin-sidebar-nav-icon" />
                  <span>Admin Approval</span>

                  {isActive('/admin-approval') && (
                    <span className="admin-sidebar-active-indicator" />
                  )}
                </Link>
              </div>
            )}

          </nav>

          {/* User section */}
          <div className="admin-sidebar-user-section p-4">
            <div className="admin-sidebar-user-card">
              <div className="admin-sidebar-avatar">
                <span>
                  {user?.name ? user.name[0].toUpperCase() : 'A'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="admin-sidebar-user-name text-sm font-medium truncate">{user?.name || 'Admin User'}</p>
                <p className="admin-sidebar-user-email text-xs truncate">{user?.email || 'admin@um.edu.my'}</p>
                {user?.role === 'super_admin' && (
                  <span className="admin-sidebar-role-badge">
                    Super Admin
                  </span>
                )}
              </div>
            </div>

            {/* Triggers confirmation modal instead of immediate signout */}
            <button
              onClick={() => setShowSignOutModal(true)}
              className="admin-sidebar-signout"
            >
              <LogOut size={20} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="admin-content-area lg:ml-64">
        <div className="px-4 py-8 lg:px-8">
          <Outlet />
        </div>
      </main>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Confirmation Modal */}
      {showSignOutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 border border-gray-100 transform transition-all scale-100">
            <div className="flex items-center gap-3 text-[#D32F2F] mb-3">
              <div className="p-2 bg-red-50 rounded-lg">
                <LogOut size={22} />
              </div>
              <h3 className="text-lg font-semibold text-[#212121]">Sign Out</h3>
            </div>

            <p className="text-sm text-[#757575] mb-6 leading-relaxed">
              Are you sure you want to log out? Any unsaved changes on your active forms will be lost.
            </p>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                disabled={isLoggingOut}
                onClick={() => setShowSignOutModal(false)}
                className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-[#757575] hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isLoggingOut}
                onClick={confirmSignOut}
                className="px-4 py-2.5 rounded-lg bg-[#D32F2F] hover:bg-[#C62828] text-white text-sm font-medium transition-colors min-w-[90px] flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {isLoggingOut ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Leaving...
                  </>
                ) : (
                  'Sign Out'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}