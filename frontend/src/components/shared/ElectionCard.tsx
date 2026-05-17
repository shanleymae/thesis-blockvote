import { useEffect, useState } from 'react';
import { Calendar, Users, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

type ElectionStatus = 'active' | 'upcoming' | 'closed';

interface ElectionCardProps {
  id: string;
  title: string;
  description: string;
  status: ElectionStatus;
  startDate: string;
  endDate: string;
  candidateCount: number;
  hasVoted?: boolean;
  role?: 'voter' | 'admin' | 'public';
  syncState?: 'synced' | 'needs-sync';
  showCountdown?: boolean;
}

function formatShort(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatCountdown(msDiff: number) {
  if (msDiff <= 0) return '0s';
  const totalSeconds = Math.floor(msDiff / 1000);
  const days = Math.floor(totalSeconds / (24 * 3600));
  const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (days > 0) return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

const ElectionCard: React.FC<ElectionCardProps> = ({
  id,
  title,
  description,
  status,
  startDate,
  endDate,
  candidateCount,
  hasVoted = false,
  role = 'voter',
  syncState,
  showCountdown = true,
}) => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!showCountdown) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [showCountdown]);

  const startTs = new Date(startDate).getTime();
  const endTs = new Date(endDate).getTime();
  const isUpcoming = status === 'upcoming';
  const isActive = status === 'active';
  const voterDetailHref = `/voter/elections/${id}`;
  const publicDetailHref = `/elections/${id}`;

  let countdownLabel: string | null = null;
  if (showCountdown && isUpcoming) {
    countdownLabel = `${formatCountdown(startTs - now)} until start`;
  } else if (showCountdown && isActive) {
    countdownLabel = `${formatCountdown(endTs - now)} left`;
  }

  return (
    <div className="group flex flex-col gap-3.5 rounded-2xl border border-white/10 bg-white/[0.015] p-5 transition-colors duration-200 hover:bg-white/[0.03]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-semibold leading-snug text-bv-ink transition-colors group-hover:text-white">
            {title}
          </h3>
          {syncState && (
            <span
              className={`mt-2 inline-flex rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide ${
                syncState === 'synced'
                  ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300'
                  : 'border-amber-400/30 bg-amber-500/10 text-amber-300'
              }`}
            >
              {syncState === 'synced' ? 'Synced' : 'Needs Admin Sync'}
            </span>
          )}
        </div>
        <Badge variant={status} />
      </div>

      <p className="line-clamp-2 text-[13px] leading-relaxed text-bv-ink-secondary">{description}</p>

      {countdownLabel && (
        <div className="flex items-center gap-2 font-mono text-xs text-bv-ink-secondary">
          <div className="h-1.5 w-1.5 rounded-full bg-bv-ink-secondary animate-pulse" />
          {countdownLabel}
        </div>
      )}

      <div className="flex items-center gap-5 text-xs text-bv-ink-muted">
        <span className="flex items-center gap-1.5">
          <Calendar size={13} />
          {formatShort(startDate)} - {formatShort(endDate)}
        </span>
        <span className="flex items-center gap-1.5">
          <Users size={13} />
          {candidateCount}
        </span>
      </div>

      <div className="mt-auto border-t border-white/10 pt-2">
        {role === 'admin' ? (
          <Link to={`/admin/elections/${id}`} className="block">
            <Button variant="ghost" size="sm" fullWidth className="border border-white/10 bg-white/[0.02] hover:bg-white/[0.08]">
              Manage
            </Button>
          </Link>
        ) : role === 'public' ? (
          <Link to={publicDetailHref} className="block">
            <Button variant="ghost" size="sm" fullWidth className="border border-white/10 bg-white/[0.02] hover:bg-white/[0.08]">
              View Details
            </Button>
          </Link>
        ) : hasVoted ? (
          <div className="flex items-center justify-center gap-2 py-1.5 text-sm font-medium text-bv-ink-secondary">
            <CheckCircle size={15} />
            <span>Voted</span>
          </div>
        ) : status === 'active' ? (
          <Link to={`/voter/elections/${id}/vote`} className="block">
            <Button variant="primary" size="sm" fullWidth>
              Vote Now
            </Button>
          </Link>
        ) : (
          <Link to={voterDetailHref} className="block">
            <Button variant="ghost" size="sm" fullWidth className="border border-white/10 bg-white/[0.02] hover:bg-white/[0.08]">
              View Details
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
};

export default ElectionCard;
