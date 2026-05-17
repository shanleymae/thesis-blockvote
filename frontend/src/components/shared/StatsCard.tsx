import React from 'react';

interface StatsCardProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  trend?: string;
  trendUp?: boolean;
}

const StatsCard: React.FC<StatsCardProps> = ({ icon, value, label, trend, trendUp }) => {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.015] p-5 transition-colors duration-150 hover:bg-white/[0.03]">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-bv-ink">
          {icon}
        </div>
        {trend && (
          <span className={`text-xs font-medium ${trendUp ? 'text-bv-ink-secondary' : 'text-bv-ink-muted'}`}>
            {trendUp ? '+' : '-'}{trend}
          </span>
        )}
      </div>
      <div className="mb-0.5 text-2xl font-semibold tracking-[-0.04em] text-bv-ink">{value}</div>
      <div className="text-xs font-medium uppercase tracking-[0.18em] text-bv-ink-muted">{label}</div>
    </div>
  );
};

export default StatsCard;
