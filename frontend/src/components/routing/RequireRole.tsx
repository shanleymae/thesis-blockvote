import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

type RequireRoleProps = {
  role: 'ADMIN' | 'VOTER' | 'SUPERADMIN';
};

const loadingShell = (
  <div className="min-h-screen bg-bv-bg flex items-center justify-center">
    <p className="text-bv-ink-secondary text-sm">Checking access...</p>
  </div>
);

export default function RequireRole({ role }: RequireRoleProps) {
  const location = useLocation();
  const { user, token, loading } = useAuth();

  if (loading) return loadingShell;

  if (!token || !user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  const allowed =
    role === 'ADMIN'
      ? user.role === 'ADMIN' || user.role === 'SUPERADMIN'
      : user.role === role;

  if (!allowed) {
    return (
      <Navigate
        to={user.role === 'VOTER' ? '/voter/dashboard' : '/admin/dashboard'}
        replace
      />
    );
  }

  return <Outlet />;
}
