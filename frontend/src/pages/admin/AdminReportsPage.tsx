import { useEffect, useMemo, useState } from 'react';
import { BarChart3, CheckCircle, Clock, FileText, Users, Vote } from 'lucide-react';
import Sidebar from '../../components/layout/Sidebar';
import StatsCard from '../../components/shared/StatsCard';
import Badge from '../../components/ui/Badge';
import {
  electionGroupsApi,
  usersApi,
  type ElectionGroupListItem,
  type ElectionStatus,
  type User,
} from '../../api/client';

type GroupVoteSummary = {
  totalVotes: number;
  turnout: number;
};

function statusToVariant(status: ElectionStatus): 'active' | 'upcoming' | 'closed' {
  if (status === 'ACTIVE') return 'active';
  if (status === 'UPCOMING' || status === 'PAUSED') return 'upcoming';
  return 'closed';
}

function formatDate(iso?: string) {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function AdminReportsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<ElectionGroupListItem[]>([]);
  const [voteSummaries, setVoteSummaries] = useState<Record<string, GroupVoteSummary>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const [usersRes, groupList] = await Promise.all([
          usersApi.getUsers({ limit: 1000 }),
          electionGroupsApi.getManageList(),
        ]);

        if (cancelled) return;

        setUsers(usersRes.users);
        setGroups(groupList);

        const entries = await Promise.all(
          groupList.map(async (group) => {
            try {
              const result = await electionGroupsApi.getResults(group.id);
              const totalVotes = result.positions.reduce(
                (sum, position) => sum + position.results.totalVotes,
                0
              );
              const turnoutValues = result.positions
                .map((position) => position.results.statistics.turnoutPercentage)
                .filter((value) => Number.isFinite(value));
              const turnout =
                turnoutValues.length > 0
                  ? Math.round((turnoutValues.reduce((sum, value) => sum + value, 0) / turnoutValues.length) * 10) / 10
                  : 0;

              return [group.id, { totalVotes, turnout }] as const;
            } catch {
              return [group.id, { totalVotes: 0, turnout: 0 }] as const;
            }
          })
        );

        if (!cancelled) setVoteSummaries(Object.fromEntries(entries));
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load reports');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const report = useMemo(() => {
    const voters = users.filter((user) => user.role === 'VOTER');
    const approved = voters.filter((user) => user.status === 'APPROVED');
    const pending = voters.filter((user) => user.status === 'PENDING');
    const rejected = voters.filter((user) => user.status === 'REJECTED');
    const active = groups.filter((group) => group.status === 'ACTIVE');
    const upcoming = groups.filter((group) => group.status === 'UPCOMING');
    const closed = groups.filter((group) => group.status === 'CLOSED');
    const totalCandidates = groups.reduce((sum, group) => sum + group.candidateCount, 0);
    const totalPositions = groups.reduce((sum, group) => sum + group.positionCount, 0);
    const totalVotes = Object.values(voteSummaries).reduce((sum, summary) => sum + summary.totalVotes, 0);

    return {
      voters,
      approved,
      pending,
      rejected,
      active,
      upcoming,
      closed,
      totalCandidates,
      totalPositions,
      totalVotes,
    };
  }, [groups, users, voteSummaries]);

  return (
    <div className="min-h-screen bg-bv-bg flex">
      <Sidebar variant="admin" />

      <main className="ml-56 flex-1 overflow-y-auto px-10 py-8">
        <div className="mb-8 flex items-end justify-between border-b border-white/10 pb-5">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-bv-ink-muted">System Reports</p>
            <h1 className="mt-1 text-2xl font-semibold text-bv-ink">Administrative Reports</h1>
            <p className="mt-1 text-sm text-bv-ink-secondary">
              Review voter approvals, election coverage, candidate counts, and turnout.
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-right">
            <p className="text-xs uppercase tracking-wide text-bv-ink-muted">Generated</p>
            <p className="mt-1 text-sm font-medium text-bv-ink">{new Date().toLocaleString()}</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="mb-8 grid grid-cols-4 gap-4">
          <StatsCard icon={<Users size={20} />} value={report.voters.length} label="Total Voters" />
          <StatsCard icon={<CheckCircle size={20} />} value={report.approved.length} label="Approved Voters" />
          <StatsCard icon={<Clock size={20} />} value={report.pending.length} label="Pending Voters" />
          <StatsCard icon={<Vote size={20} />} value={report.totalVotes} label="Votes Cast" />
        </div>

        <div className="mb-8 grid grid-cols-4 gap-4">
          <StatsCard icon={<FileText size={20} />} value={groups.length} label="Election Groups" />
          <StatsCard icon={<BarChart3 size={20} />} value={report.active.length} label="Active Groups" />
          <StatsCard icon={<BarChart3 size={20} />} value={report.totalPositions} label="Positions" />
          <StatsCard icon={<Users size={20} />} value={report.totalCandidates} label="Candidates" />
        </div>

        <section className="mb-8 grid grid-cols-3 gap-4">
          {[
            { label: 'Upcoming', value: report.upcoming.length },
            { label: 'Closed', value: report.closed.length },
            { label: 'Rejected Voters', value: report.rejected.length },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-bv-ink-muted">{item.label}</p>
              <p className="mt-3 text-2xl font-semibold text-bv-ink">{item.value}</p>
            </div>
          ))}
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-bv-ink">Election Group Summary</h2>
            {loading && <span className="text-sm text-bv-ink-muted">Loading report data...</span>}
          </div>

          <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  {['Election Group', 'Status', 'Schedule', 'Positions', 'Candidates', 'Votes', 'Avg. Turnout', 'Published'].map((heading) => (
                    <th key={heading} className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-bv-ink-muted">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {groups.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-10 text-center text-sm text-bv-ink-muted">
                      No election groups available for reports yet.
                    </td>
                  </tr>
                ) : (
                  groups.map((group) => {
                    const summary = voteSummaries[group.id] ?? { totalVotes: 0, turnout: 0 };
                    return (
                      <tr key={group.id} className="transition-colors hover:bg-white/[0.03]">
                        <td className="px-5 py-4">
                          <p className="text-sm font-semibold text-bv-ink">{group.title}</p>
                          <p className="mt-1 text-xs text-bv-ink-muted">
                            {group.scope === 'GLOBAL' ? 'Global' : group.organization?.name ?? 'Organization'}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <Badge variant={statusToVariant(group.status)} />
                        </td>
                        <td className="px-5 py-4 text-sm text-bv-ink-secondary">
                          {formatDate(group.startDate)} - {formatDate(group.endDate)}
                        </td>
                        <td className="px-5 py-4 text-sm text-bv-ink-secondary">{group.positionCount}</td>
                        <td className="px-5 py-4 text-sm text-bv-ink-secondary">{group.candidateCount}</td>
                        <td className="px-5 py-4 text-sm text-bv-ink-secondary">{summary.totalVotes}</td>
                        <td className="px-5 py-4 text-sm text-bv-ink-secondary">{summary.turnout}%</td>
                        <td className="px-5 py-4 text-sm text-bv-ink-secondary">
                          {group.resultsPublished ? 'Published' : 'Pending'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
