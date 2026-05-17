import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Mail, Phone, Shield, User, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/layout/Sidebar';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../api/client';
import { notifyError, notifySuccess } from '../../lib/toast';
import { formatRoleLabel } from '../../lib/roleLabels';

const AdminSettingsPage = () => {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user) return;
    setName(user.name);
    setPhone(user.phone ?? '');
  }, [user?.id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await authApi.updateProfile({ name: name.trim(), phone: phone.trim() || null });
      setUser(updated);
      notifySuccess('Admin settings updated.');
    } catch (err) {
      notifyError(err instanceof Error ? err.message : 'Failed to update admin settings');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') return;
    setDeleting(true);
    try {
      await authApi.deleteAccount();
      logout();
      setDeleteModalOpen(false);
      notifySuccess('Admin account deleted.');
      navigate('/', { replace: true });
    } catch (err) {
      notifyError(err instanceof Error ? err.message : 'Failed to delete account');
    } finally {
      setDeleting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-bv-bg flex items-center justify-center">
        <p className="text-bv-ink-secondary">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bv-bg flex">
      <Sidebar variant="admin" />

      <main className="ml-56 flex-1 overflow-y-auto px-6 py-8 md:px-8">
        <div className="mx-auto w-full max-w-4xl">
          <div className="mx-auto max-w-3xl">
            <div className="mb-8 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-bv-accent">
                Admin Settings
              </p>
              <h1 className="mt-3 text-3xl font-bold text-bv-ink">Administrator Profile</h1>
              <p className="mt-3 text-sm leading-7 text-bv-ink-secondary">
                Manage your admin identity details and account access from one place.
              </p>
            </div>

            <section className="mb-6 rounded-[28px] border border-bv-border bg-bv-surface p-6">
              <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-bv-accent-muted text-bv-accent">
                    <User size={24} />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-bv-ink-muted">
                      Administrator
                    </p>
                    <h2 className="mt-2 text-2xl font-bold text-bv-ink">{user.name}</h2>
                    <p className="mt-1 text-sm text-bv-ink-secondary">{user.email}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:w-[320px]">
                  <div className="rounded-2xl border border-bv-border bg-bv-bg px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-bv-ink-muted">
                      Role
                    </p>
                    <div className="mt-2 flex items-center gap-2 text-sm font-medium text-bv-ink">
                      <Shield size={15} className="text-bv-accent" />
                      {formatRoleLabel(user.role)}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-bv-border bg-bv-bg px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-bv-ink-muted">
                      Status
                    </p>
                    <div className="mt-2 flex items-center gap-2 text-sm font-medium text-bv-ink">
                      <CheckCircle2 size={15} className="text-bv-accent" />
                      <span className="capitalize">{user.status?.toLowerCase()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <form onSubmit={handleSave} className="space-y-6">
              <section className="rounded-[28px] border border-bv-border bg-bv-surface p-6 md:p-7">
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-bv-ink">Contact details</h2>
                  <p className="mt-1 text-sm text-bv-ink-secondary">
                    Update the information associated with your administrator account.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <Input
                    label="Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    icon={<User size={16} />}
                  />
                  <Input
                    label="Phone (optional)"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Phone number"
                    icon={<Phone size={16} />}
                  />
                </div>

                <div className="mt-5">
                  <label className="mb-1.5 block text-xs uppercase tracking-wide text-bv-ink-muted">Email</label>
                  <div className="flex min-h-[50px] items-center gap-3 rounded-xl border border-bv-border bg-bv-bg px-4 py-3 text-sm text-bv-ink-secondary">
                    <Mail size={16} className="text-bv-ink-muted" />
                    <span className="break-all">{user.email}</span>
                  </div>
                  <p className="mt-1.5 text-xs text-bv-ink-muted">Email cannot be changed.</p>
                </div>

                <div className="mt-5">
                  <label className="mb-1.5 block text-xs uppercase tracking-wide text-bv-ink-muted">Organization</label>
                  <div className="flex min-h-[50px] items-center gap-3 rounded-xl border border-bv-border bg-bv-bg px-4 py-3 text-sm text-bv-ink-secondary">
                    <Building2 size={16} className="text-bv-ink-muted" />
                    <span>{user.organization?.name ?? 'No organization assigned'}</span>
                  </div>
                </div>

                <div className="mt-6 flex justify-center md:justify-end">
                  <Button type="submit" variant="primary" size="lg" loading={saving}>
                    {saving ? 'Saving...' : 'Save changes'}
                  </Button>
                </div>
              </section>
            </form>

            <section className="mt-6 rounded-[28px] border border-red-500/20 bg-red-500/5 p-6">
              <h2 className="text-lg font-semibold text-bv-ink">Danger zone</h2>
              <p className="mt-2 text-sm leading-7 text-bv-ink-secondary">
                Deleting your admin account will remove your profile from the application. Only do this if another administrator can still manage the system.
              </p>
              <div className="mt-5 flex justify-center md:justify-start">
                <Button variant="danger" onClick={() => setDeleteModalOpen(true)}>
                  <AlertTriangle size={18} />
                  Delete account
                </Button>
              </div>
            </section>
          </div>
        </div>
      </main>

      {deleteModalOpen && (
        <Modal title="Delete admin account" onClose={() => !deleting && setDeleteModalOpen(false)}>
          <div className="space-y-4">
            <p className="text-bv-ink-secondary text-sm">
              This will permanently delete your admin account. Type <strong className="text-bv-ink">DELETE</strong> to confirm.
            </p>
            <Input
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="Type DELETE"
              className="font-mono"
            />
            <div className="flex gap-3 justify-end pt-2">
              <Button variant="ghost" onClick={() => setDeleteModalOpen(false)} disabled={deleting}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDeleteAccount}
                loading={deleting}
                disabled={deleteConfirm !== 'DELETE' || deleting}
              >
                {deleting ? 'Deleting...' : 'Delete my account'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminSettingsPage;
