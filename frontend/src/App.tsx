import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

import { Dashboard } from './pages/Dashboard';
import { FoodListings } from './pages/FoodListings';
import { UserActivity } from './pages/UserActivity';
import { LocationActivity } from './pages/LocationActivity';
import { Reports } from './pages/Reports';
import { AbuseSafety } from './pages/AbuseSafety';
import AdminApproval from './pages/AdminApproval';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ResetPassword } from './pages/ResetPassword';
import { FoodListingDetails } from './pages/FoodListingDetails';
import { Loader2 } from 'lucide-react';

function RootRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex flex-col gap-3 items-center h-screen w-screen justify-center bg-gray-50">
        <Loader2
          className="animate-spin text-[#2E7D32]"
          size={32}
        />

        <div className="text-gray-500 font-medium text-sm">
          Synchronizing system session...
        </div>
      </div>
    );
  }

  return user
    ? <Navigate to="/dashboard" replace />
    : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>

          {/* Public Routes */}
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Protected Routes */}
          <Route
            element={
              <ProtectedRoute
                allowedRoles={['admin', 'super_admin']}
              />
            }
          >
            <Route element={<Layout />}>

              <Route
                path="dashboard"
                element={<Dashboard />}
              />

              <Route
                path="food-listings"
                element={<FoodListings />}
              />

              <Route
                path="user-activity"
                element={<UserActivity />}
              />

              <Route
                path="location-activity"
                element={<LocationActivity />}
              />

              <Route
                path="reports"
                element={<Reports />}
              />

              <Route
                path="abuse-safety"
                element={<AbuseSafety />}
              />

              <Route
                path="admin-approval"
                element={<AdminApproval />}
              />

              <Route
                path="food-listings/:id"
                element={<FoodListingDetails />}
              />

            </Route>
          </Route>

          {/* Unknown route */}
          <Route
            path="*"
            element={<Navigate to="/" replace />}
          />

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}