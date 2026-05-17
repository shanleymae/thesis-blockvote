import { useState, useEffect, useCallback } from 'react';
import { Search, CheckCircle, XCircle, MinusCircle, Trash2 } from 'lucide-react';
import Sidebar from '../../components/layout/Sidebar';
import Badge from '../../components/ui/Badge';
import { usersApi, type User } from '../../api/client';
import { notifyError, notifySuccess } from '../../lib/toast';

type FilterTab = 'all' | 'pending' | 'approved' | 'rejected';
type VoterStatus = 'pending' | 'approved' | 'rejected';

interface Voter {
  id: string;
  name: string;
  email: string;
  idNumber: string;
  wallet: string;
  status: VoterStatus;
  registered: string;
  organizationId?: string | null;
  organizationName?: string | null;
  role: User['role'];
}

function formatDate(iso: string | undefined): string {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return '—';
  }
}

function toVoter(u: User): Voter {
  const status = (u.status?.toLowerCase() ?? 'pending') as VoterStatus;
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    idNumber: u.idNumber?.trim() ? u.idNumber : '—',
    wallet: u.walletAddress ? `${u.walletAddress.slice(0, 6)}...${u.walletAddress.slice(-4)}` : '—',
    status: status === 'pending' || status === 'approved' || status === 'rejected' ? status : 'pending',
    registered: formatDate(u.createdAt),
    organizationId: u.organizationId,
    organizationName: u.organization?.name ?? null,
    role: u.role,
  };
}

const tabs: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
];

const ManageVotersPage = () => {
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [search, setSearch] = useState('');
  const [votersList, setVotersList] = useState<Voter[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actioningId, setActioningId] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { users } = await usersApi.getUsers();
      setVotersList(users.map(toVoter));
    } catch (err) {
      notifyError(err instanceof Error ? err.message : 'Failed to load voters');
      setVotersList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const updateVoterStatus = (id: string, status: VoterStatus) => {
    setVotersList((prev) => prev.map((v) => (v.id === id ? { ...v, status } : v)));
  };

  const handleApprove = async (voter: Voter) => {
    setActioningId(voter.id);
    try {
      await usersApi.approveUser(voter.id);
      updateVoterStatus(voter.id, 'approved');
      notifySuccess('Voter approved.');
    } catch (err) {
      notifyError(err instanceof Error ? err.message : 'Failed to approve');
    } finally {
      setActioningId(null);
    }
  };

  const handleReject = async (voter: Voter) => {
    setActioningId(voter.id);
    try {
      await usersApi.rejectUser(voter.id);
      updateVoterStatus(voter.id, 'rejected');
      notifySuccess('Voter rejected.');
    } catch (err) {
      notifyError(err instanceof Error ? err.message : 'Failed to reject');
    } finally {
      setActioningId(null);
    }
  };

  const handleRevoke = async (voter: Voter) => {
    setActioningId(voter.id);
    try {
      await usersApi.revokeUser(voter.id);
      updateVoterStatus(voter.id, 'pending');
      notifySuccess('Voter revoked.');
    } catch (err) {
      notifyError(err instanceof Error ? err.message : 'Failed to revoke');
    } finally {
      setActioningId(null);
    }
  };

  const handleDelete = async (voter: Voter) => {
    if (!window.confirm(`Delete ${voter.name} (${voter.email})? This cannot be undone.`)) return;
    setDeletingId(voter.id);
    try {
      await usersApi.deleteUser(voter.id);
      setVotersList((prev) => prev.filter((v) => v.id !== voter.id));
      notifySuccess('User deleted.');
    } catch (err) {
      notifyError(err instanceof Error ? err.message : 'Failed to delete user');
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = votersList.filter((v) => {
    const matchesTab = activeTab === 'all' || v.status === activeTab;
    const q = search.toLowerCase();
    const matchesSearch =
      v.name.toLowerCase().includes(q) ||
      v.email.toLowerCase().includes(q) ||
      (v.idNumber !== '—' && v.idNumber.toLowerCase().includes(q));
    return matchesTab && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-bv-bg flex">
      <Sidebar variant="admin" />

      <main className="ml-56 flex-1 p-8 overflow-y-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-bv-ink">Manage Voters</h1>
            <p className="text-bv-ink-secondary text-sm mt-1">Review and manage voter registrations</p>
          </div>
          <div className="relative w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-bv-ink-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search voters..."
              className="bg-bv-surface border border-bv-border rounded-lg pl-9 pr-4 py-2.5 text-bv-ink placeholder-bv-ink-muted focus:border-bv-accent focus:outline-none w-full text-sm"
            />
          </div>
        </div>

        <div className="flex items-center gap-1 mb-6 bg-bv-surface border border-bv-border rounded-xl p-1 w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                activeTab === tab.key ? 'bg-bv-accent text-bv-bg' : 'text-bv-ink-secondary hover:text-bv-ink'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto rounded-xl border border-bv-border bg-bv-surface">
          {loading ? (
            <div className="p-12 text-center text-bv-ink-secondary">Loading voters...</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-bv-border">
                  {['Name', 'Email', 'ID number', 'Role', 'Wallet Address', 'Status', 'Registered Date', 'Actions'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs text-bv-ink-muted uppercase tracking-wide font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-bv-border">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center text-bv-ink-secondary text-sm">
                      {votersList.length === 0 ? 'No voters yet.' : 'No voters match the current filters.'}
                    </td>
                  </tr>
                ) : (
                  filtered.map((voter) => (
                    <tr
                      key={voter.id}
                      className={`transition-colors ${
                        voter.status === 'pending'
                          ? 'bg-yellow-500/[0.03] hover:bg-yellow-500/[0.06]'
                          : 'hover:bg-bv-surface-hover/50'
                      }`}
                    >
                      <td className="px-5 py-4 text-bv-ink text-sm font-medium">{voter.name}</td>
                      <td className="px-5 py-4 text-bv-ink-secondary text-sm">
                        {voter.email}
                        {voter.organizationName && (
                          <div className="text-xs text-bv-ink-muted">{voter.organizationName}</div>
                        )}
                      </td>
                      <td className="px-5 py-4 text-bv-ink-secondary text-sm font-mono">{voter.idNumber}</td>
                      <td className="px-5 py-4 text-bv-ink-secondary text-sm">
                        {voter.role === 'SUPERADMIN' ? 'Superadmin' : voter.role === 'ADMIN' ? 'Admin' : 'Voter'}
                      </td>
                      <td className="px-5 py-4 text-bv-ink-secondary text-sm font-mono">{voter.wallet}</td>
                      <td className="px-5 py-4">
                        <Badge variant={voter.status} />
                      </td>
                      <td className="px-5 py-4 text-bv-ink-secondary text-sm">{voter.registered}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          {voter.role === 'VOTER' && voter.status !== 'approved' && (
                            <button
                              type="button"
                              onClick={() => handleApprove(voter)}
                              disabled={!!actioningId || voter.wallet === '—'}
                              className="flex items-center gap-1 px-2.5 py-1.5 bg-green-500/20 text-green-400 text-xs rounded-lg hover:bg-green-500/30 transition-colors disabled:opacity-50"
                              title={voter.wallet === '—' ? 'User has no linked wallet yet' : 'Approve voter'}
                            >
                              <CheckCircle size={12} /> {voter.wallet === '—' ? 'No Wallet' : actioningId === voter.id ? '...' : 'Approve'}
                            </button>
                          )}
                          {voter.role === 'VOTER' && voter.status !== 'rejected' && (
                            <button
                              type="button"
                              onClick={() => handleReject(voter)}
                              disabled={!!actioningId}
                              className="flex items-center gap-1 px-2.5 py-1.5 bg-red-500/20 text-red-400 text-xs rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-50"
                            >
                              <XCircle size={12} /> {actioningId === voter.id ? '...' : 'Reject'}
                            </button>
                          )}
                          {voter.role === 'VOTER' && voter.status === 'approved' && (
                            <button
                              type="button"
                              onClick={() => handleRevoke(voter)}
                              disabled={!!actioningId}
                              className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-500/20 text-gray-400 text-xs rounded-lg hover:bg-gray-500/30 transition-colors disabled:opacity-50"
                            >
                              <MinusCircle size={12} /> {actioningId === voter.id ? '...' : 'Revoke'}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDelete(voter)}
                            disabled={!!deletingId}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-red-500/20 text-red-400 text-xs rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-50"
                            title="Delete user"
                          >
                            <Trash2 size={12} /> {deletingId === voter.id ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
};

export default ManageVotersPage;
