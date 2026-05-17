import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  LayoutDashboard,
  Vote,
  Receipt,
  Search,
  User,
  Users,
  ScrollText,
  BarChart3,
  Settings,
  Shield,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import Badge from '../ui/Badge';
import ConnectWalletButton from '../wallet/ConnectWalletButton';
import { useAuth } from '../../context/AuthContext';

type SidebarVariant = 'voter' | 'admin';

interface SidebarProps {
  variant?: SidebarVariant;
}

const COLLAPSED_WIDTH = '3.5rem';
const EXPANDED_WIDTH = '14rem';

const voterNavItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/voter/dashboard' },
  { icon: Vote, label: 'Elections', path: '/voter/elections' },
  { icon: Receipt, label: 'My Votes', path: '/voter/receipt' },
  { icon: Search, label: 'Verify Vote', path: '/voter/verify' },
  { icon: User, label: 'Profile', path: '/voter/profile' },
];

const adminNavItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
  { icon: Vote, label: 'Elections', path: '/admin/elections' },
  { icon: Users, label: 'Voters', path: '/admin/voters' },
  { icon: BarChart3, label: 'Reports', path: '/admin/reports' },
  { icon: ScrollText, label: 'Logs', path: '/admin/logs' },
  { icon: Shield, label: 'Security', path: '/admin/security' },
  { icon: Settings, label: 'Settings', path: '/admin/settings' },
];

const Sidebar: React.FC<SidebarProps> = ({ variant = 'voter' }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isPinned, setIsPinned] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const navItems =
    variant === 'admin'
      ? user?.role === 'SUPERADMIN'
        ? [...adminNavItems, { icon: Shield, label: 'Superadmin', path: '/admin/superadmin' }]
        : adminNavItems
      : voterNavItems;
  const isExpanded = isPinned || isHovered;

  const walletShort = user?.walletAddress
    ? `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}`
    : null;

  return (
    <aside
      className="fixed left-0 top-0 bottom-0 z-40 flex flex-col border-r border-white/10 bg-[#070707]"
      style={{
        width: isExpanded ? EXPANDED_WIDTH : COLLAPSED_WIDTH,
        transition: 'width 0.2s ease',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex-shrink-0 border-b border-white/10 p-3">
        <div className="mb-2 flex justify-end">
          <button
            type="button"
            onClick={() => setIsPinned((prev) => !prev)}
            className="rounded-md p-1.5 text-bv-ink-muted transition-colors hover:bg-white/[0.06] hover:text-bv-ink"
            aria-label={isPinned ? 'Collapse sidebar' : 'Pin sidebar'}
            title={isPinned ? 'Collapse sidebar' : 'Pin sidebar'}
          >
            {isPinned ? <PanelLeftClose size={15} /> : <PanelLeftOpen size={15} />}
          </button>
        </div>
        <Link to="/" className="flex min-w-0 items-center gap-2.5 text-bv-ink no-underline">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white text-black">
            <Box size={16} />
          </div>
          <div className={`min-w-0 overflow-hidden transition-all ${isExpanded ? 'opacity-100' : 'w-0 opacity-0'}`}>
            <div className="text-sm font-bold tracking-wide">BLOCKVOTE</div>
            {variant === 'admin' && (
              <div className="mt-0.5 text-[10px] text-bv-ink-muted">Admin Panel</div>
            )}
          </div>
        </Link>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto p-2.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex min-w-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-white text-black'
                  : 'text-bv-ink-secondary hover:bg-white/[0.06] hover:text-bv-ink'
              }`}
            >
              <Icon size={17} className="flex-shrink-0" />
              <span className={`overflow-hidden whitespace-nowrap transition-all ${isExpanded ? 'opacity-100' : 'w-0 opacity-0'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="space-y-2 border-t border-white/10 p-3">
        <div className="flex min-w-0 items-center gap-2.5 px-1">
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-white/10">
            <User size={14} className="text-white" />
          </div>
          <div className="min-w-0 flex-1 overflow-hidden">
            <div className={`truncate text-[13px] font-medium text-bv-ink transition-all ${isExpanded ? 'opacity-100' : 'opacity-0'}`}>
              {user?.name ?? 'Guest'}
            </div>
            {variant === 'admin' ? (
              <span className={`mt-0.5 block transition-all ${isExpanded ? 'opacity-100' : 'opacity-0'}`}>
                <Badge variant="admin">
                  {user?.role === 'SUPERADMIN' ? 'Super Admin' : 'Admin'}
                </Badge>
              </span>
            ) : (
              <div className={`truncate font-mono text-[10px] text-bv-ink-muted transition-all ${isExpanded ? 'opacity-100' : 'opacity-0'}`}>
                {walletShort ?? 'No wallet'}
              </div>
            )}
          </div>
        </div>
        {isExpanded && <ConnectWalletButton variant="outline" size="sm" fullWidth showIcon={true} />}
        <button
          type="button"
          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[13px] font-medium text-bv-ink-muted transition-colors hover:bg-white/[0.06] hover:text-bv-ink"
          onClick={() => {
            logout();
            navigate('/');
          }}
        >
          <LogOut size={15} className="flex-shrink-0" />
          <span className={`overflow-hidden whitespace-nowrap transition-all ${isExpanded ? 'opacity-100' : 'w-0 opacity-0'}`}>
            Log out
          </span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
