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
  TriangleAlert
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false); // Controls modal visibility
  const { user, logout } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Food Listings', href: '/food-listings', icon: ListOrdered },
    { name: 'User Activity', href: '/user-activity', icon: Users },
    { name: 'Location Activity', href: '/location-activity', icon: MapPin },
    { name: 'Generate Report', href: '/reports', icon: FileText },
    { name: 'Abuse & Safety', href: '/abuse-safety', icon: TriangleAlert },
  ];

  if (user?.role === 'super_admin') {
    navigation.push({ name: 'Admin Approval', href: '/admin-approval', icon: ShieldCheck });
  }

  const isActive = (path: string) => location.pathname === path;

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
    <div className="min-h-screen bg-[#F9FBF9]">
      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white shadow-md"
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="px-6 py-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <img
                src="/zero_hunger_um_logo.png"
                alt="Zero Hunger UM"
                className="w-10 h-auto mx-auto mb-4"
              />
              <div>
                <h1 className="text-xl font-semibold text-[#212121]">Zero Hunger UM</h1>
                <p className="text-xs text-[#9E9E9E]">Admin Dashboard</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive(item.href)
                    ? 'bg-[#E8F5E9] text-[#2E7D32]'
                    : 'text-[#9E9E9E] hover:bg-[#F5FAF5] hover:text-[#2E7D32]'
                    }`}
                >
                  <Icon size={20} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="w-10 h-10 rounded-full bg-[#E8F5E9] flex items-center justify-center">
                <span className="text-[#2E7D32] font-semibold">
                  {user?.name ? user.name[0].toUpperCase() : 'A'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#212121] truncate">{user?.name || 'Admin User'}</p>
                <p className="text-xs text-[#9E9E9E] truncate">{user?.email || 'admin@um.edu.my'}</p>
                {user?.role === 'super_admin' && (
                  <span className="inline-block mt-1 px-2 py-0.5 bg-[#E8F5E9] text-[#2E7D32] text-[10px] font-bold rounded-full uppercase tracking-wider">
                    Super Admin
                  </span>
                )}
              </div>
            </div>

            {/* Triggers confirmation modal instead of immediate signout */}
            <button
              onClick={() => setShowSignOutModal(true)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-[#9E9E9E] hover:bg-[#F5FAF5] hover:text-[#D32F2F] transition-colors mt-2 text-left"
            >
              <LogOut size={20} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="lg:ml-64">
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