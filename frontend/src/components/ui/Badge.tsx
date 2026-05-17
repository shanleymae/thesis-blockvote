import React from 'react';

type BadgeVariant = 'active' | 'upcoming' | 'closed' | 'pending' | 'approved' | 'rejected' | 'admin';

interface BadgeProps {
  variant: BadgeVariant;
  children?: React.ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  active: 'bg-emerald-500/15 text-emerald-400 ring-emerald-500/20',
  upcoming: 'bg-amber-500/15 text-amber-400 ring-amber-500/20',
  closed: 'bg-zinc-500/15 text-zinc-400 ring-zinc-500/20',
  pending: 'bg-amber-500/15 text-amber-400 ring-amber-500/20',
  approved: 'bg-emerald-500/15 text-emerald-400 ring-emerald-500/20',
  rejected: 'bg-red-500/15 text-red-400 ring-red-500/20',
  admin: 'bg-bv-accent-muted text-bv-accent ring-bv-accent/20',
};

const defaultLabels: Record<BadgeVariant, string> = {
  active: 'Active',
  upcoming: 'Upcoming',
  closed: 'Closed',
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  admin: 'Admin',
};

const Badge: React.FC<BadgeProps> = ({ variant, children, className = '' }) => {
  return (
    <span
      className={`inline-flex items-center text-[11px] px-2 py-0.5 rounded-md font-medium ring-1 ring-inset ${variantStyles[variant]} ${className}`}
    >
      {children ?? defaultLabels[variant]}
    </span>
  );
};

export default Badge;
