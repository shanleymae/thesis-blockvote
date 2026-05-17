import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Phone,
  Hash,
  User,
  Wallet,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi, organizationsApi, type Organization, type WalletRegistrationStatus } from '../../api/client';
import { AuthShell, AuthStatusScreen } from '../../components/auth/AuthShell';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useAuth } from '../../context/AuthContext';
import { notifyError, notifyInfo, notifySuccess } from '../../lib/toast';
import {
  clearPendingWallet,
  getPendingWallet,
  requestWalletAddress,
  setPendingWallet,
} from '../../utils/wallet';

const RegisterPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [organizationId, setOrganizationId] = useState('');
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [registerDone, setRegisterDone] = useState<{ emailVerificationSkipped: boolean } | null>(
    null,
  );
  const [submitting, setSubmitting] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(() => getPendingWallet());
  const [connectingWallet, setConnectingWallet] = useState(false);
  const [walletStatus, setWalletStatus] = useState<WalletRegistrationStatus | null>(null);
  const [checkingWallet, setCheckingWallet] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setWalletAddress(getPendingWallet());
  }, []);

  useEffect(() => {
    organizationsApi
      .list()
      .then((items) => {
        setOrganizations(items);
        if (items.length > 0) setOrganizationId((current) => current || items[0].id);
      })
      .catch((error) => notifyError(error instanceof Error ? error.message : 'Failed to load organizations'));
  }, []);

  useEffect(() => {
    if (!walletAddress) {
      setWalletStatus(null);
      return;
    }

    let cancelled = false;
    setCheckingWallet(true);

    authApi
      .getWalletStatus(walletAddress)
      .then((status) => {
        if (cancelled) return;
        setWalletStatus(status);
      })
      .catch((error) => {
        if (cancelled) return;
        setWalletStatus(null);
        notifyError(error instanceof Error ? error.message : 'Failed to check wallet status');
      })
      .finally(() => {
        if (!cancelled) setCheckingWallet(false);
      });

    return () => {
      cancelled = true;
    };
  }, [walletAddress]);

  const shortWallet = useMemo(() => {
    if (!walletAddress) return '';
    return `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
  }, [walletAddress]);

  const handleConnectWallet = async () => {
    setConnectingWallet(true);
    try {
      notifyInfo('Open MetaMask to connect the wallet you want tied to this account.');
      const address = await requestWalletAddress();
      setPendingWallet(address);
      setWalletAddress(address);
      const status = await authApi.getWalletStatus(address);
      setWalletStatus(status);
      if (status.isRegistered) {
        notifyInfo('This wallet is already linked to an existing Blockvote account.');
      } else {
        notifySuccess('Wallet connected. You can continue registration now.');
      }
    } catch (error) {
      notifyError(error instanceof Error ? error.message : 'Failed to connect wallet');
    } finally {
      setConnectingWallet(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      notifyError('Name is required.');
      return;
    }
    if (!email.trim()) {
      notifyError('Email is required.');
      return;
    }
    if (!password) {
      notifyError('Password is required.');
      return;
    }
    if (password !== confirmPassword) {
      notifyError('Passwords do not match.');
      return;
    }
    if (!walletAddress) {
      notifyError('Connect your wallet before registering.');
      return;
    }
    if (!idNumber.trim()) {
      notifyError('ID number is required.');
      return;
    }
    if (!organizationId) {
      notifyError('Please choose your organization.');
      return;
    }
    if (!agreed) {
      notifyError('Please agree to the Terms and Privacy Policy before continuing.');
      return;
    }
    if (walletStatus?.isRegistered) {
      notifyError('This wallet is already registered. Please sign in instead.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await register({
        name: name.trim(),
        email: email.trim(),
        password,
        phone: phone.trim() || undefined,
        walletAddress,
        organizationId,
        idNumber: idNumber.trim(),
      });
      clearPendingWallet();
      setRegisterDone({ emailVerificationSkipped: Boolean(res.emailVerificationSkipped) });
      notifySuccess(res.message);
      window.setTimeout(() => navigate('/login', { replace: true }), 2500);
    } catch (err) {
      notifyError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (registerDone) {
    const skipped = registerDone.emailVerificationSkipped;
    return (
      <AuthStatusScreen
        tone="success"
        eyebrow={skipped ? 'Account created' : 'Verification sent'}
        title={skipped ? 'You can sign in now.' : 'Check your inbox.'}
        description={
          skipped ? (
            <>
              Email verification is turned off on this server. You may sign in with{' '}
              <strong className="text-white">{email}</strong> once you are redirected. Your account
              still needs administrator approval before you can vote.
            </>
          ) : (
            <>
              We sent a verification link to <strong className="text-white">{email}</strong>. Open
              it to activate your account, then return here to sign in.
            </>
          )
        }
        note="Redirecting you to login..."
        icon={<CheckCircle2 size={28} className="text-bv-accent" />}
      />
    );
  }

  if (walletAddress && walletStatus?.isRegistered) {
    return (
      <AuthStatusScreen
        eyebrow="Wallet Found"
        title="This wallet is already registered."
        description={
          <>
            {walletStatus.maskedEmail ? (
              <>
                We found an existing account linked to <strong className="text-white">{walletStatus.maskedEmail}</strong>.
              </>
            ) : (
              'We found an existing Blockvote account linked to this wallet.'
            )}{' '}
            {walletStatus.isVerified
              ? 'Use the sign-in flow instead of creating a new account.'
              : 'Verify that account from your email, then sign in.'}
          </>
        }
        note={
          walletStatus.isVerified
            ? 'If this is your wallet, continue to login.'
            : 'Once the email is verified, wallet sign-in will work too.'
        }
        icon={<Wallet size={28} className="text-bv-accent" />}
        action={
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link to="/login">
              <Button variant="primary" size="lg">
                Go to login
                <ArrowRight size={16} />
              </Button>
            </Link>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] px-6 py-3 text-sm font-medium text-bv-ink transition-colors hover:border-bv-accent hover:text-bv-accent"
              onClick={() => {
                clearPendingWallet();
                setWalletAddress(null);
                setWalletStatus(null);
              }}
            >
              Use another wallet
            </button>
          </div>
        }
      />
    );
  }

  return (
    <AuthShell
      eyebrow="Create Account"
      title="Set up a voter profile with a linked wallet."
      description="Registration starts with identity details and the wallet you'll use later for approval checks and ballot signing."
      asideNote="After you verify your email, we match your email and ID to the official roster. If both match, you are approved automatically; otherwise an admin reviews your account."
    >
      <div className="max-w-xl">
        <p className="text-sm text-bv-ink-secondary">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-bv-accent transition-opacity hover:opacity-80">
            Log in
          </Link>
        </p>

        <div className="mt-10 rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.22)] backdrop-blur-xl sm:p-8">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-bv-accent">
                Account details
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-white">
                Register for Blockvote
              </h2>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-right">
              <p className="text-[11px] uppercase tracking-[0.24em] text-bv-ink-muted">Wallet</p>
              <p className="mt-2 font-mono text-sm text-white">
                {walletAddress ? shortWallet : 'Not linked'}
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            fullWidth
            size="lg"
            className="border-white/10 bg-white/[0.03]"
            onClick={handleConnectWallet}
            loading={connectingWallet || checkingWallet}
          >
            <Wallet size={16} />
            {walletAddress
              ? connectingWallet || checkingWallet
                ? 'Updating wallet...'
                : 'Change connected wallet'
              : connectingWallet || checkingWallet
                ? 'Connecting wallet...'
                : 'Connect wallet'}
          </Button>

          <div className="mt-4 rounded-2xl border border-bv-accent/15 bg-bv-accent-muted/40 px-4 py-3">
            <p className="text-xs leading-6 text-bv-ink-secondary">
              Your wallet is required before registration so vote casting and wallet sign-in stay
              aligned from the first step.
            </p>
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <Input
              label="Full name"
              type="text"
              placeholder="Your full name"
              icon={<User size={15} />}
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              icon={<Mail size={15} />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
            <Input
              label="ID number"
              type="text"
              placeholder="As on your official voter list (e.g. student or national ID)"
              icon={<Hash size={15} />}
              value={idNumber}
              onChange={(e) => setIdNumber(e.target.value)}
              autoComplete="off"
            />
            <Input
              label="Phone"
              type="tel"
              placeholder="Optional phone number"
              icon={<Phone size={15} />}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
            />
            <div>
              <label className="mb-1.5 block text-xs uppercase tracking-wide text-bv-ink-muted">Organization</label>
              <select
                value={organizationId}
                onChange={(e) => setOrganizationId(e.target.value)}
                className="w-full rounded-lg border border-bv-border bg-bv-surface px-4 py-3 text-sm text-bv-ink focus:border-bv-accent focus:outline-none"
              >
                {organizations.length === 0 && <option value="">No organizations available</option>}
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Create a password"
              icon={<Lock size={15} />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="text-bv-ink-muted transition-colors hover:text-bv-ink-secondary"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              }
            />
            <Input
              label="Confirm password"
              type={showConfirm ? 'text' : 'password'}
              placeholder="Repeat your password"
              icon={<Lock size={15} />}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowConfirm((value) => !value)}
                  className="text-bv-ink-muted transition-colors hover:text-bv-ink-secondary"
                >
                  {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              }
            />

            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
              <button
                type="button"
                aria-pressed={agreed}
                onClick={() => setAgreed((value) => !value)}
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
                  agreed
                    ? 'border-bv-accent bg-bv-accent text-bv-bg'
                    : 'border-white/[0.12] bg-white/[0.04] text-transparent'
                }`}
              >
                <CheckCircle2 size={12} />
              </button>
              <span className="text-xs leading-6 text-bv-ink-secondary">
                I agree to the{' '}
                <Link
                  to="/terms"
                  className="text-bv-accent hover:underline"
                >
                  Terms and Conditions
                </Link>{' '}
                and{' '}
                <Link
                  to="/privacy"
                  className="text-bv-accent hover:underline"
                >
                  Privacy Policy
                </Link>
                . I understand that if my email and ID are not on the official roster I must be
                approved by an administrator before I can vote.
              </span>
            </label>

            <Button type="submit" variant="primary" fullWidth size="lg" loading={submitting}>
              {submitting ? 'Creating account...' : 'Create account'}
              {!submitting ? <ArrowRight size={16} /> : null}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center">
          <Link to="/" className="text-sm text-bv-ink-muted transition-colors hover:text-bv-ink-secondary">
            &larr; Back to home
          </Link>
        </p>
      </div>
    </AuthShell>
  );
};

export default RegisterPage;
