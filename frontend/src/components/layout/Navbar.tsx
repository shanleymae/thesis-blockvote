import { Link } from 'react-router-dom';
import { Box, Search, LayoutDashboard, LogOut } from 'lucide-react';
import Button from '../ui/Button';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
  const { user, token, logout } = useAuth();
  const dashboardHref = user?.role === 'VOTER' ? '/voter/dashboard' : '/admin/dashboard';
  const isAuthenticated = Boolean(token && user);

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 border-b border-white/10 bg-[#0a0d12]/70 px-4 py-3 backdrop-blur-2xl sm:px-8">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-bv-accent shadow-[0_0_30px_rgba(0,212,200,0.28)]">
          <Box size={16} className="text-bv-bg" />
          </div>
          <span className="text-sm font-semibold tracking-[0.24em] text-bv-ink sm:text-base">
            BLOCKVOTE
          </span>
        </Link>

        <div className="hidden items-center gap-7 md:flex">
          <a
            href="#verification-story"
            className="text-sm text-bv-ink-secondary transition-colors hover:text-bv-ink"
          >
            Verification
          </a>
          <Link
            to="/elections"
            className="text-sm text-bv-ink-secondary transition-colors hover:text-bv-ink"
          >
            Elections
          </Link>
          <Link
            to="/published-elections"
            className="text-sm text-bv-ink-secondary transition-colors hover:text-bv-ink"
          >
            Results
          </Link>
          <Link
            to="/verify"
            className="inline-flex items-center gap-1.5 text-sm text-bv-ink-secondary transition-colors hover:text-bv-ink"
          >
            <Search size={14} />
            Verify
          </Link>
          <Link
            to="/help"
            className="text-sm text-bv-ink-secondary transition-colors hover:text-bv-ink"
          >
            Help
          </Link>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {isAuthenticated ? (
            <>
              <Link to={dashboardHref}>
                <Button variant="outline" size="sm" className="border-white/[0.12] bg-white/[0.04]">
                  <LayoutDashboard size={14} />
                  <span className="hidden sm:inline">Dashboard</span>
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={logout}>
                <LogOut size={14} />
                <span className="hidden sm:inline">Log out</span>
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="outline" size="sm" className="border-white/[0.12] bg-white/[0.04]">
                  Log in
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="primary" size="sm">
                  Register
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
