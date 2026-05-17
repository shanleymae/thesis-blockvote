import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Wallet, Shield, AlertTriangle, CheckCircle2, Building2 } from 'lucide-react';
import Sidebar from '../../components/layout/Sidebar';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import ConnectWalletButton from '../../components/wallet/ConnectWalletButton';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../api/client';
import { notifyError, notifySuccess } from '../../lib/toast';

const ProfilePage = () => {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setPhone(user.phone ?? '');
    }
  }, [user?.id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await authApi.updateProfile({ name: name.trim(), phone: phone.trim() || null });
      setUser(updated);
      notifySuccess('Profile updated.');
    } catch (err) {
      notifyError(err instanceof Error ? err.message : 'Failed to update profile');
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
      notifySuccess('Account deleted.');
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
        <p className="text-bv-ink-secondary">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bv-bg flex">
      <Sidebar variant="voter" />

      <main className="ml-56 flex-1 overflow-y-auto px-6 py-8 md:px-8">
        <div className="mx-auto w-full max-w-4xl">
          <div className="mx-auto max-w-3xl">
            <div className="mb-8 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-bv-accent">
                Account Settings
              </p>
              <h1 className="mt-3 text-3xl font-bold text-bv-ink">Profile Management</h1>
              <p className="mt-3 text-sm leading-7 text-bv-ink-secondary">
                Keep your identity details current, confirm your wallet linkage, and manage account access from one place.
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
                      Account Owner
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
                      {user.role}
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
              {!user.walletAddress && (
                <div className="mt-5 rounded-2xl border border-dashed border-bv-accent/30 bg-bv-accent/5 px-4 py-4">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-bv-ink">Wallet required for on-chain voting</p>
                      <p className="mt-1 text-sm text-bv-ink-secondary">
                        Link your MetaMask wallet now so your account can be approved and used for blockchain voting.
                      </p>
                    </div>
                    <div className="md:w-52">
                      <ConnectWalletButton
                        variant="primary"
                        size="sm"
                        fullWidth
                        showIcon
                        label="Link Wallet"
                      />
                    </div>
                  </div>
                </div>
              )}
            </section>

            <form onSubmit={handleSave} className="space-y-6">
              <section className="rounded-[28px] border border-bv-border bg-bv-surface p-6 md:p-7">
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-bv-ink">Personal information</h2>
                  <p className="mt-1 text-sm text-bv-ink-secondary">
                    Update the details associated with your account profile.
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

                <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs uppercase tracking-wide text-bv-ink-muted">Email</label>
                    <div className="flex min-h-[50px] items-center gap-3 rounded-xl border border-bv-border bg-bv-bg px-4 py-3 text-sm text-bv-ink-secondary">
                      <Mail size={16} className="text-bv-ink-muted" />
                      <span className="break-all">{user.email}</span>
                    </div>
                    <p className="mt-1.5 text-xs text-bv-ink-muted">Email cannot be changed.</p>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs uppercase tracking-wide text-bv-ink-muted">Organization</label>
                    <div className="flex min-h-[50px] items-center gap-3 rounded-xl border border-bv-border bg-bv-bg px-4 py-3 text-sm text-bv-ink-secondary">
                      <Building2 size={16} className="text-bv-ink-muted" />
                      <span>{user.organization?.name ?? 'Not assigned'}</span>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs uppercase tracking-wide text-bv-ink-muted">Wallet</label>
                    {user.walletAddress ? (
                      <div className="flex min-h-[50px] items-center gap-3 rounded-xl border border-bv-border bg-bv-bg px-4 py-3 font-mono text-sm text-bv-ink-secondary">
                        <Wallet size={16} className="text-bv-ink-muted" />
                        <span className="break-all">{user.walletAddress}</span>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-bv-border bg-bv-bg px-4 py-4">
                        <p className="mb-3 text-sm text-bv-ink-muted">
                          No wallet linked. Connect one to vote on-chain.
                        </p>
                        <ConnectWalletButton variant="outline" size="sm" showIcon label="Link Wallet" />
                      </div>
                    )}
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
                Deleting your account will remove your profile data and vote records from the application database. This action cannot be undone.
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
        <Modal title="Delete account" onClose={() => !deleting && setDeleteModalOpen(false)}>
          <div className="space-y-4">
            <p className="text-bv-ink-secondary text-sm">
              This will permanently delete your account and all associated data. Type <strong className="text-bv-ink">DELETE</strong> to confirm.
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

export default ProfilePage;
