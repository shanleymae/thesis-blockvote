import { useEffect, useState } from 'react';
import { Vote, Receipt, CheckCircle, AlertTriangle, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import Sidebar from '../../components/layout/Sidebar';
import StatsCard from '../../components/shared/StatsCard';
import ElectionCard from '../../components/shared/ElectionCard';
import { electionGroupsApi, votesApi, type ElectionGroupListItem } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

const VoterDashboard = () => {
  const { user } = useAuth();
  const [elections, setElections] = useState<ElectionGroupListItem[]>([]);
  const [myVotes, setMyVotes] = useState<
    {
      id: string;
      txHash: string;
      createdAt: string;
      election: { id: string; title: string };
      candidate: { id: string; name: string };
    }[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [allElections, votes] = await Promise.all([
          electionGroupsApi.getMyList(),
          votesApi.myVotes().catch(() => []),
        ]);
        setElections(allElections);
        setMyVotes(votes);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [user?.id]);

  const active = elections.filter((e) => e.status === 'ACTIVE');
  const upcoming = elections.filter((e) => e.status === 'UPCOMING');
  const votedElectionIds = new Set(myVotes.map((v) => v.election.id));
  const recentActivity = myVotes.slice(0, 5);
  const isPending = user?.status === 'PENDING';

  return (
    <div className="min-h-screen bg-bv-bg flex">
      <Sidebar variant="voter" />

      <main className="ml-56 flex-1 overflow-y-auto px-10 py-8">
        <div className="mb-8 flex items-end justify-between border-b border-white/10 pb-5">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-bv-ink-muted">Voter Workspace</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-bv-ink">
              Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
            </h1>
            <p className="mt-1 text-sm text-bv-ink-secondary">See what needs your action first.</p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2">
            <div className="h-2 w-2 rounded-full bg-bv-ink-secondary" />
            <span className="font-mono text-sm text-bv-ink-secondary">
              {user?.walletAddress
                ? `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}`
                : 'No wallet linked'}
            </span>
          </div>
        </div>

        {isPending && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.03] px-5 py-4">
            <AlertTriangle size={20} className="shrink-0 text-bv-ink-secondary" />
            <p className="text-sm text-bv-ink-secondary">
              <strong className="text-bv-ink">Account Pending:</strong> Your account is pending admin approval.
              Voting opens automatically once approved.
            </p>
          </div>
        )}

        <div className="mb-8 grid grid-cols-3 gap-4">
          <StatsCard icon={<Vote size={20} />} value={active.length} label="Active Elections" />
          <StatsCard icon={<CheckCircle size={20} />} value={votedElectionIds.size} label="Elections Voted" />
          <StatsCard icon={<Receipt size={20} />} value={myVotes.length} label="My Vote Receipts" />
        </div>

        <section className="mb-8 rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-4">
          <p className="text-xs uppercase tracking-[0.18em] text-bv-ink-muted">Next Action</p>
          {isPending ? (
            <p className="mt-2 text-sm text-bv-ink-secondary">Wait for account approval, then return to start voting.</p>
          ) : active.length > 0 ? (
            <p className="mt-2 text-sm text-bv-ink-secondary">
              {active.length} active elections available. Open elections and cast your vote.
            </p>
          ) : (
            <p className="mt-2 text-sm text-bv-ink-secondary">
              No active elections right now. Check upcoming schedule ({upcoming.length} upcoming).
            </p>
          )}
        </section>

        <section className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-bv-ink">Active Elections</h2>
            <Link to="/voter/elections" className="text-sm text-bv-ink-secondary transition-colors hover:text-bv-ink">
              View all
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {loading ? (
              <div className="col-span-2 text-sm text-bv-ink-muted">Loading elections...</div>
            ) : active.length === 0 ? (
              <div className="col-span-2 text-sm text-bv-ink-muted">No active elections right now.</div>
            ) : (
              active.slice(0, 4).map((election) => (
                <ElectionCard
                  key={election.id}
                  id={election.id}
                  title={election.title}
                  description={election.description}
                  status="active"
                  startDate={election.startDate}
                  endDate={election.endDate}
                  candidateCount={election.candidateCount}
                  hasVoted={election.positions.every((position) => votedElectionIds.has(position.id))}
                  role="voter"
                  showCountdown={false}
                />
              ))
            )}
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold text-bv-ink">Recent Activity</h2>
          <div className="overflow-hidden rounded-2xl border border-white/8 bg-white/[0.02]">
            {recentActivity.length === 0 ? (
              <div className="p-8 text-center text-bv-ink-muted">No recent activity</div>
            ) : (
              <div className="divide-y divide-white/8">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/8 bg-white/[0.04]">
                        <CheckCircle size={16} className="text-bv-ink-secondary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-bv-ink">{activity.election.title}</p>
                        <p className="mt-0.5 text-xs text-bv-ink-secondary">
                          Voted for {activity.candidate.name}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1.5 font-mono text-xs text-bv-ink-secondary">
                        <span>
                          {activity.txHash.length > 14
                            ? `${activity.txHash.slice(0, 10)}...${activity.txHash.slice(-4)}`
                            : activity.txHash}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            window.open(`https://sepolia.etherscan.io/tx/${activity.txHash}`, '_blank')
                          }
                          className="text-bv-ink-muted transition-colors hover:text-bv-ink"
                        >
                          <ExternalLink size={12} />
                        </button>
                      </div>
                      <p className="mt-0.5 text-xs text-bv-ink-muted">
                        {new Date(activity.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default VoterDashboard;
