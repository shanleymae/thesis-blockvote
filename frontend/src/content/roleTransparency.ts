import type { LucideIcon } from 'lucide-react';
import { Shield, User, Crown } from 'lucide-react';

export type RoleTransparencyCard = {
  id: 'SUPERADMIN' | 'ADMIN' | 'VOTER';
  title: string;
  icon: LucideIcon;
  borderClass: string;
  iconWrapClass: string;
  bullets: string[];
};

/** Describes access boundaries enforced in the backend (middleware + services). */
export const ROLE_TRANSPARENCY_CARDS: RoleTransparencyCard[] = [
  {
    id: 'SUPERADMIN',
    title: 'Super Admin',
    icon: Crown,
    borderClass: 'border-amber-400/25',
    iconWrapClass: 'border-amber-400/20 bg-amber-500/10 text-amber-300',
    bullets: [
      'Uses the admin panel plus the Superadmin screen to assign Admin or Voter roles, set organization scope, and optionally grant “create global elections” to an admin.',
      'User list includes accounts across all organizations (other Super Admins are hidden from the list).',
      'May create and manage global election groups and organization-scoped groups without the same org restriction as a normal Admin.',
      'API routes that change another user’s role or scope require Super Admin; regular admins cannot modify Super Admin accounts.',
    ],
  },
  {
    id: 'ADMIN',
    title: 'Admin',
    icon: Shield,
    borderClass: 'border-bv-accent/25',
    iconWrapClass: 'border-white/10 bg-white/[0.06] text-bv-accent',
    bullets: [
      'Uses the standard admin area: dashboard, elections, voter approvals, reports, blockchain logs, this security overview, and settings.',
      'Voter management is limited to Voter accounts in the same organization (approve, reject, revoke). Cannot manage other admins or Super Admins.',
      'Creates organization elections only for their assigned organization. Global elections are allowed only if Super Admin enabled “create global elections” on their account.',
      'Election and group lists are filtered to their organization (and global items when that flag applies).',
    ],
  },
  {
    id: 'VOTER',
    title: 'Voter',
    icon: User,
    borderClass: 'border-white/10',
    iconWrapClass: 'border-white/10 bg-white/[0.04] text-bv-ink-secondary',
    bullets: [
      'Uses the voter portal only: dashboard, eligible elections, voting flow, receipts, verification, and profile.',
      'Cannot open admin URLs or call admin-only APIs; role checks and JWT route guards enforce separation.',
      'Must complete email verification and receive admin approval before casting votes in active elections.',
      'Votes with a linked wallet; receipts tie activity to the blockchain for audit and public verification.',
    ],
  },
];
