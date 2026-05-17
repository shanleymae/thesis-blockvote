import { useEffect, useState } from 'react';
import { Users, CheckCircle, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import Sidebar from '../../components/layout/Sidebar';
import StatsCard from '../../components/shared/StatsCard';
import ElectionCard from '../../components/shared/ElectionCard';
import { electionGroupsApi, usersApi, type ElectionGroupListItem, type User } from '../../api/client';

const AdminDashboard = () => {
  const [elections, setElections] = useState<ElectionGroupListItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [allElections, usersRes] = await Promise.all([
          electionGroupsApi.getManageList(),
          usersApi.getUsers(),
        ]);
        setElections(allElections);
        setUsers(usersRes.users);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const totalElections = elections.length;
  const activeElections = elections.filter((e) => e.status === 'ACTIVE');
  const totalVoters = users.length;
  const pendingUsers = users.filter((u) => u.status === 'PENDING');

  return (
    <div className="min-h-screen bg-bv-bg flex">
      <Sidebar variant="admin" />

      <main className="ml-56 flex-1 overflow-y-auto px-10 py-8">
        <div className="mb-8 flex items-end justify-between border-b border-white/10 pb-5">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-bv-ink-muted">Admin Workspace</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-bv-ink">Dashboard</h1>
          </div>
          <p className="mt-1 text-sm text-bv-ink-secondary">
            Review approvals and monitor active elections.
          </p>
        </div>

        <div className="mb-8 grid grid-cols-3 gap-4">
          <StatsCard icon={<CheckCircle size={20} />} value={activeElections.length} label="Active Elections" />
          <StatsCard icon={<Clock size={20} />} value={pendingUsers.length} label="Pending Approvals" />
          <StatsCard icon={<Users size={20} />} value={totalVoters} label="Total Voters" />
        </div>

        <section className="mb-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-bv-ink">Pending Voter Approvals</h2>
            <Link to="/admin/voters" className="text-sm text-bv-ink-secondary transition-colors hover:text-bv-ink">
              Review all
            </Link>
          </div>
          <div className="overflow-hidden rounded-2xl border border-white/8 bg-white/[0.02]">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/8">
                  {['Name', 'Email', 'Wallet', 'Registered', 'Actions'].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3 text-left text-xs font-medium uppercase tracking-[0.18em] text-bv-ink-muted"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/8">
                {pendingUsers.slice(0, 5).map((voter) => (
                  <tr key={voter.id} className="transition-colors hover:bg-white/[0.03]">
                    <td className="px-5 py-4 text-sm font-medium text-bv-ink">{voter.name}</td>
                    <td className="px-5 py-4 text-sm text-bv-ink-secondary">{voter.email}</td>
                    <td className="px-5 py-4 font-mono text-sm text-bv-ink-secondary">
                      {voter.walletAddress
                        ? `${voter.walletAddress.slice(0, 6)}...${voter.walletAddress.slice(-4)}`
                        : '-'}
                    </td>
                    <td className="px-5 py-4 text-sm text-bv-ink-secondary">
                      {voter.createdAt ? new Date(voter.createdAt).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-5 py-4">
                      <Link to="/admin/voters" className="text-sm text-bv-ink-secondary transition-colors hover:text-bv-ink">
                        Open queue
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-bv-ink">Active Elections</h2>
            <Link to="/admin/elections" className="text-sm text-bv-ink-secondary transition-colors hover:text-bv-ink">
              View all
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {loading ? (
              <div className="col-span-2 text-sm text-bv-ink-muted">Loading elections...</div>
            ) : activeElections.length === 0 ? (
              <div className="col-span-2 text-sm text-bv-ink-muted">No active elections right now.</div>
            ) : (
              activeElections.slice(0, 4).map((election) => (
                <ElectionCard
                  key={election.id}
                  id={election.id}
                  title={election.title}
                  description={election.description}
                  status="active"
                  startDate={election.startDate}
                  endDate={election.endDate}
                  candidateCount={election.candidateCount}
                  role="admin"
                  showCountdown={false}
                />
              ))
            )}
          </div>
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-4 text-sm text-bv-ink-secondary">
            <span className="font-medium text-bv-ink">{totalElections}</span> total elections across all states.
            Use the Elections page for filtering, schedule setup, and result review.
          </div>
        </section>
      </main>
    </div>
  );
};

export default AdminDashboard;
