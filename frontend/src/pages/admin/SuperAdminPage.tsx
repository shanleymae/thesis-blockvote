import { useEffect, useMemo, useState } from 'react';
import { Shield, Users } from 'lucide-react';
import Sidebar from '../../components/layout/Sidebar';
import Button from '../../components/ui/Button';
import { organizationsApi, usersApi, type Organization, type User } from '../../api/client';
import { notifyError, notifySuccess } from '../../lib/toast';

const SuperAdminPage = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [newOrgName, setNewOrgName] = useState('');
  const [creatingOrg, setCreatingOrg] = useState(false);
  const [actingUserId, setActingUserId] = useState<string | null>(null);
  const [scopeOrgByUser, setScopeOrgByUser] = useState<Record<string, string>>({});
  const [scopeGlobalByUser, setScopeGlobalByUser] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [orgs, userRes] = await Promise.all([organizationsApi.list(), usersApi.getUsers()]);
      setOrganizations(orgs);
      setUsers(userRes.users.filter((u) => u.role !== 'SUPERADMIN'));
    } catch (error) {
      notifyError(error instanceof Error ? error.message : 'Failed to load superadmin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filteredUsers = useMemo(
    () =>
      users.filter(
        (u) =>
          u.name.toLowerCase().includes(search.toLowerCase()) ||
          u.email.toLowerCase().includes(search.toLowerCase())
      ),
    [users, search]
  );

  const createOrganization = async () => {
    if (!newOrgName.trim()) return;
    setCreatingOrg(true);
    try {
      await organizationsApi.create(newOrgName.trim());
      setNewOrgName('');
      notifySuccess('Organization created.');
      await load();
    } catch (error) {
      notifyError(error instanceof Error ? error.message : 'Failed to create organization');
    } finally {
      setCreatingOrg(false);
    }
  };

  const updateRoleScope = async (user: User, role: 'ADMIN' | 'VOTER') => {
    setActingUserId(user.id);
    try {
      await usersApi.assignRoleScope(user.id, {
        role,
        organizationId:
          scopeOrgByUser[user.id] || user.organizationId || organizations[0]?.id,
        canCreateGlobalElections:
          role === 'ADMIN' ? Boolean(scopeGlobalByUser[user.id] ?? user.canCreateGlobalElections) : false,
      });
      notifySuccess(role === 'ADMIN' ? 'Admin scope saved.' : 'Voter scope saved.');
      await load();
    } catch (error) {
      notifyError(error instanceof Error ? error.message : 'Failed to update role scope');
    } finally {
      setActingUserId(null);
    }
  };

  const getPendingScope = (user: User) => {
    const organizationId = scopeOrgByUser[user.id] || user.organizationId || organizations[0]?.id || '';
    const canCreateGlobalElections = Boolean(scopeGlobalByUser[user.id] ?? user.canCreateGlobalElections);
    const organizationChanged = organizationId !== (user.organizationId || '');
    const globalScopeChanged =
      user.role === 'ADMIN' && canCreateGlobalElections !== Boolean(user.canCreateGlobalElections);
    const scopeChanged = organizationChanged || globalScopeChanged;

    return { organizationId, canCreateGlobalElections, organizationChanged, scopeChanged };
  };

  return (
    <div className="min-h-screen bg-bv-bg flex">
      <Sidebar variant="admin" />
      <main className="ml-56 flex-1 overflow-y-auto px-10 py-8">
        <div className="mb-8 border-b border-white/10 pb-5">
          <p className="text-xs uppercase tracking-[0.2em] text-bv-ink-muted">Superadmin Console</p>
          <h1 className="mt-1 text-2xl font-semibold text-bv-ink">Admin & Organization Control</h1>
        </div>

        <section className="mb-8 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <div className="mb-4 flex items-center gap-2">
            <Shield size={16} className="text-bv-ink-secondary" />
            <h2 className="text-base font-semibold text-bv-ink">Organizations</h2>
          </div>
          <div className="flex gap-3">
            <input
              value={newOrgName}
              onChange={(e) => setNewOrgName(e.target.value)}
              placeholder="New organization name"
              className="flex-1 rounded-lg border border-white/10 bg-black/20 px-4 py-2.5 text-sm text-bv-ink"
            />
            <Button type="button" variant="primary" onClick={createOrganization} loading={creatingOrg}>
              {creatingOrg ? 'Creating...' : 'Create Organization'}
            </Button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {organizations.length === 0 ? (
              <p className="text-xs text-bv-ink-muted">No organizations yet. Create one to assign admin scope.</p>
            ) : (
              organizations.map((org) => (
                <span key={org.id} className="rounded-full border border-white/10 px-3 py-1 text-xs text-bv-ink-secondary">
                  {org.name}
                </span>
              ))
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-bv-ink-secondary" />
              <h2 className="text-base font-semibold text-bv-ink">User Role Scope</h2>
            </div>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users"
              className="w-72 rounded-lg border border-white/10 bg-black/20 px-4 py-2.5 text-sm text-bv-ink"
            />
          </div>
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-bv-ink-muted">
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Current Role</th>
                  <th className="px-4 py-3">Organization</th>
                  <th className="px-4 py-3">Create Global</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-sm text-bv-ink-muted">
                      Loading users...
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-sm text-bv-ink-muted">
                      No users match your search.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const pendingScope = getPendingScope(u);
                    return (
                  <tr key={u.id}>
                    <td className="px-4 py-3 text-sm text-bv-ink">
                      <div>{u.name}</div>
                      <div className="text-xs text-bv-ink-muted">{u.email}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-bv-ink-secondary">{u.role}</td>
                    <td className="px-4 py-3">
                      <select
                        value={scopeOrgByUser[u.id] || u.organizationId || organizations[0]?.id || ''}
                        onChange={(e) => setScopeOrgByUser((prev) => ({ ...prev, [u.id]: e.target.value }))}
                        className="rounded border border-white/10 bg-bv-surface px-2 py-1 text-sm text-bv-ink shadow-sm outline-none focus:border-bv-accent"
                      >
                        {organizations.map((org) => (
                          <option key={org.id} value={org.id}>
                            {org.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      {u.role === 'ADMIN' ? (
                        <label className="flex items-center gap-2 text-sm text-bv-ink-secondary">
                          <input
                            type="checkbox"
                            checked={Boolean(scopeGlobalByUser[u.id] ?? u.canCreateGlobalElections)}
                            onChange={(e) =>
                              setScopeGlobalByUser((prev) => ({ ...prev, [u.id]: e.target.checked }))
                            }
                          />
                          Allowed
                        </label>
                      ) : (
                        <span className="text-sm text-bv-ink-muted">Voter</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => void updateRoleScope(u, u.role === 'ADMIN' ? 'ADMIN' : 'VOTER')}
                          disabled={
                            actingUserId === u.id ||
                            organizations.length === 0 ||
                            !pendingScope.scopeChanged
                          }
                          className="rounded-lg bg-blue-500/20 px-2.5 py-1.5 text-xs text-blue-300 hover:bg-blue-500/30 disabled:opacity-50"
                        >
                          {actingUserId === u.id
                            ? 'Saving...'
                            : pendingScope.scopeChanged
                              ? 'Apply Changes'
                              : 'Applied'}
                        </button>
                        {u.role === 'VOTER' && (
                          <button
                            type="button"
                            onClick={() => void updateRoleScope(u, 'ADMIN')}
                            disabled={actingUserId === u.id || organizations.length === 0}
                            className="rounded-lg bg-emerald-500/20 px-2.5 py-1.5 text-xs text-emerald-300 hover:bg-emerald-500/30 disabled:opacity-50"
                          >
                            Make Admin
                          </button>
                        )}
                        {u.role === 'ADMIN' && (
                          <button
                            type="button"
                            onClick={() => void updateRoleScope(u, 'VOTER')}
                            disabled={actingUserId === u.id}
                            className="rounded-lg bg-gray-500/20 px-2.5 py-1.5 text-xs text-gray-300 hover:bg-gray-500/30 disabled:opacity-50"
                          >
                            Make Voter
                          </button>
                        )}
                      </div>
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
};

export default SuperAdminPage;
