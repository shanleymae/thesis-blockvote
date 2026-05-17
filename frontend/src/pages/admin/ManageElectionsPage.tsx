import { useState, useEffect } from 'react';
import { Plus, Eye, Trash2, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Sidebar from '../../components/layout/Sidebar';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import { electionGroupsApi, organizationsApi, type ElectionGroupListItem, type Organization } from '../../api/client';

type FilterTab = 'all' | 'ACTIVE' | 'UPCOMING' | 'CLOSED';

const tabs: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'ACTIVE', label: 'Active' },
  { key: 'UPCOMING', label: 'Upcoming' },
  { key: 'CLOSED', label: 'Closed' },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function statusToVariant(s: string): 'active' | 'upcoming' | 'closed' {
  const lower = s.toLowerCase();
  if (lower === 'active') return 'active';
  if (lower === 'upcoming' || lower === 'paused') return 'upcoming';
  return 'closed';
}

const ManageElectionsPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [showModal, setShowModal] = useState(false);
  const [elections, setElections] = useState<ElectionGroupListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formStart, setFormStart] = useState('');
  const [formEnd, setFormEnd] = useState('');
  const [formScope, setFormScope] = useState<'GLOBAL' | 'ORGANIZATION'>('GLOBAL');
  const [formOrganizationId, setFormOrganizationId] = useState('');
  const [formPositions, setFormPositions] = useState<string[]>(['President']);
  const [organizations, setOrganizations] = useState<Organization[]>([]);

  useEffect(() => {
    const status = activeTab === 'all' ? undefined : activeTab;
    setLoading(true);
    setError(null);
    electionGroupsApi
      .getManageList({ status })
      .then(setElections)
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, [activeTab]);

  useEffect(() => {
    organizationsApi
      .list()
      .then((items) => {
        setOrganizations(items);
        if (items.length > 0) setFormOrganizationId((current) => current || items[0].id);
      })
      .catch(() => {
        // no-op for now, create flow will show backend errors
      });
  }, []);

  const filtered = elections.filter((e) => activeTab === 'all' || e.status === activeTab);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formDescription.trim() || !formStart || !formEnd) {
      setCreateError('Please fill all fields.');
      return;
    }
    const start = new Date(formStart);
    const end = new Date(formEnd);
    if (end <= start) {
      setCreateError('End date must be after start date.');
      return;
    }
    if (formScope === 'ORGANIZATION' && !formOrganizationId) {
      setCreateError('Select an organization for organization elections.');
      return;
    }
    const positions = formPositions.map((position) => position.trim()).filter(Boolean);
    if (positions.length === 0) {
      setCreateError('Add at least one position.');
      return;
    }
    if (new Set(positions.map((position) => position.toLowerCase())).size !== positions.length) {
      setCreateError('Position names must be unique.');
      return;
    }
    setCreateLoading(true);
    setCreateError(null);
    try {
      const created = await electionGroupsApi.create({
        title: formTitle.trim(),
        description: formDescription.trim(),
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        scope: formScope,
        organizationId: formScope === 'ORGANIZATION' ? formOrganizationId : undefined,
        positions,
      });
      setShowModal(false);
      setFormTitle('');
      setFormDescription('');
      setFormStart('');
      setFormEnd('');
      setFormScope('GLOBAL');
      setFormPositions(['President']);
      navigate(`/admin/elections/${created.id}`);
    } catch (err) {
      setCreateError((err as Error).message);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteElection = async (id: string, title: string) => {
    if (!window.confirm(`Delete election "${title}"? This cannot be undone.`)) return;
    setDeleteLoadingId(id);
    try {
      await electionGroupsApi.delete(id);
      setElections((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setDeleteLoadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-bv-bg flex">
      <Sidebar variant="admin" />

      <main className="ml-56 flex-1 overflow-y-auto px-10 py-8">
        {/* Header */}
        <div className="mb-8 flex items-end justify-between border-b border-white/10 pb-5">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-bv-ink-muted">Election Workflow</p>
            <h1 className="mt-1 text-2xl font-semibold text-bv-ink">Manage Elections</h1>
            <p className="mt-1 text-sm text-bv-ink-secondary">Create elections, then finish setup in the detail page.</p>
          </div>
          <Button variant="primary" onClick={() => setShowModal(true)}>
            <Plus size={16} />
            Create Election
          </Button>
        </div>

        {/* Filter tabs */}
        <div className="mb-6 flex w-fit items-center gap-1 rounded-xl border border-white/10 bg-white/[0.02] p-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                activeTab === tab.key ? 'bg-white text-black' : 'text-bv-ink-secondary hover:text-bv-ink'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-16 text-bv-ink-muted">Loading elections...</div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  {['Title', 'Scope', 'Status', 'Start Date', 'End Date', 'Positions', 'Candidates', 'Actions'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs text-bv-ink-muted uppercase tracking-wide font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filtered.map((el) => (
                  <tr key={el.id} className="transition-colors hover:bg-white/[0.04]">
                    <td className="px-5 py-4 text-bv-ink text-sm font-medium">{el.title}</td>
                    <td className="px-5 py-4 text-bv-ink-secondary text-sm">
                      {el.scope === 'GLOBAL' ? 'Global' : el.organization?.name ?? 'Organization'}
                    </td>
                    <td className="px-5 py-4"><Badge variant={statusToVariant(el.status)} /></td>
                    <td className="px-5 py-4 text-bv-ink-secondary text-sm">{formatDate(el.startDate)}</td>
                    <td className="px-5 py-4 text-bv-ink-secondary text-sm">{formatDate(el.endDate)}</td>
                    <td className="px-5 py-4 text-bv-ink-secondary text-sm">{el.positionCount}</td>
                    <td className="px-5 py-4 text-bv-ink-secondary text-sm">{el.candidateCount}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Link to={`/admin/elections/${el.id}`} className="rounded p-1.5 text-bv-ink-secondary transition-colors hover:bg-white/[0.06] hover:text-bv-ink">
                          <Eye size={15} />
                        </Link>
                        <button
                          disabled={deleteLoadingId === el.id}
                          className="rounded p-1.5 text-bv-ink-secondary transition-colors hover:bg-white/[0.06] hover:text-red-300"
                          onClick={() => handleDeleteElection(el.id, el.title)}
                          title={deleteLoadingId === el.id ? 'Deleting election...' : 'Delete election'}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Create Election Modal */}
      {showModal && (
        <Modal title="Create New Election" onClose={() => setShowModal(false)}>
          <form className="space-y-5" onSubmit={handleCreateSubmit}>
            <Input
              label="Election Title"
              placeholder="e.g. CSPS Election 2026"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
            />

            <div>
              <label className="block text-xs text-bv-ink-muted uppercase tracking-wide mb-1.5">
                Description
              </label>
              <textarea
                rows={3}
                placeholder="Describe the purpose of this election..."
                className="bg-bv-bg border border-bv-border rounded-lg px-4 py-3 text-bv-ink placeholder-bv-ink-muted focus:border-bv-accent focus:outline-none w-full resize-none transition-colors"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="block text-xs text-bv-ink-muted uppercase tracking-wide">
                  Positions
                </label>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1 text-xs text-bv-ink-secondary transition-colors hover:text-bv-ink"
                  onClick={() => setFormPositions((current) => [...current, ''])}
                >
                  <Plus size={13} />
                  Add position
                </button>
              </div>
              <div className="space-y-2">
                {formPositions.map((position, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      aria-label={`Position ${index + 1}`}
                      placeholder={index === 0 ? 'President' : 'Vice President'}
                      value={position}
                      onChange={(e) =>
                        setFormPositions((current) =>
                          current.map((item, itemIndex) => (itemIndex === index ? e.target.value : item))
                        )
                      }
                    />
                    <button
                      type="button"
                      disabled={formPositions.length === 1}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 text-bv-ink-secondary transition-colors hover:text-red-300 disabled:opacity-40"
                      onClick={() =>
                        setFormPositions((current) => current.filter((_, itemIndex) => itemIndex !== index))
                      }
                      title="Remove position"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Start Date & Time"
                type="datetime-local"
                value={formStart}
                onChange={(e) => setFormStart(e.target.value)}
              />
              <Input
                label="End Date & Time"
                type="datetime-local"
                value={formEnd}
                onChange={(e) => setFormEnd(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs uppercase tracking-wide text-bv-ink-muted">Scope</label>
                <select
                  value={formScope}
                  onChange={(e) => setFormScope(e.target.value as 'GLOBAL' | 'ORGANIZATION')}
                  className="w-full rounded-lg border border-bv-border bg-bv-bg px-4 py-3 text-bv-ink"
                >
                  <option value="GLOBAL">Global</option>
                  <option value="ORGANIZATION">Organization</option>
                </select>
              </div>
              {formScope === 'ORGANIZATION' && (
                <div>
                  <label className="mb-1.5 block text-xs uppercase tracking-wide text-bv-ink-muted">Organization</label>
                  <select
                    value={formOrganizationId}
                    onChange={(e) => setFormOrganizationId(e.target.value)}
                    className="w-full rounded-lg border border-bv-border bg-bv-bg px-4 py-3 text-bv-ink"
                  >
                    {organizations.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {createError && (
              <p className="text-red-400 text-sm">{createError}</p>
            )}

            <div className="flex gap-3 pt-2">
              <Button type="submit" variant="primary" fullWidth loading={createLoading}>
                {createLoading ? 'Creating election...' : 'Create and Continue'}
              </Button>
              <Button type="button" variant="outline" fullWidth onClick={() => setShowModal(false)} disabled={createLoading}>
                Cancel
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default ManageElectionsPage;
