import { useEffect, useState } from 'react';
import { ArrowRight, Eye, EyeOff, LoaderCircle, Lock, Mail, Wallet } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../../api/client';
import { AuthShell, AuthStatusScreen } from '../../components/auth/AuthShell';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useAuth } from '../../context/AuthContext';
import { notifyError, notifyInfo, notifySuccess } from '../../lib/toast';
import { requestWalletAddress, signWalletMessage } from '../../utils/wallet';

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [walletSubmitting, setWalletSubmitting] = useState(false);
  const { login, loginWithWallet, user, token, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading || !token || !user) return;
    navigate(user.role === 'VOTER' ? '/voter/dashboard' : '/admin/dashboard', { replace: true });
  }, [loading, token, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      notifyError('Email and password are required.');
      return;
    }

    setSubmitting(true);
    try {
      const currentUser = await login(email.trim(), password);
      notifySuccess('Signed in successfully.');
      navigate(currentUser.role === 'VOTER' ? '/voter/dashboard' : '/admin/dashboard', {
        replace: true,
      });
    } catch (err) {
      notifyError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email.trim()) {
      notifyError('Enter your email above first.');
      return;
    }
    setResending(true);
    try {
      const { message } = await authApi.resendVerification(email.trim());
      notifySuccess(message);
    } catch (err) {
      notifyError(err instanceof Error ? err.message : 'Could not resend email');
    } finally {
      setResending(false);
    }
  };

  const handleWalletLogin = async () => {
    setWalletSubmitting(true);
    try {
      notifyInfo('Open MetaMask to confirm the sign-in message.');
      const walletAddress = await requestWalletAddress();
      const { message } = await authApi.requestWalletLoginNonce(walletAddress);
      const signed = await signWalletMessage(message);

      if (signed.address.toLowerCase() !== walletAddress.toLowerCase()) {
        throw new Error('Please sign in with the same wallet account you connected.');
      }

      const currentUser = await loginWithWallet(walletAddress, signed.signature);
      notifySuccess('Signed in with MetaMask.');
      navigate(currentUser.role === 'VOTER' ? '/voter/dashboard' : '/admin/dashboard', {
        replace: true,
      });
    } catch (err) {
      notifyError(err instanceof Error ? err.message : 'Wallet login failed');
    } finally {
      setWalletSubmitting(false);
    }
  };

  if (loading && token) {
    return (
      <AuthStatusScreen
        eyebrow="Session Restore"
        title="Checking your saved access."
        description="Your Blockvote session is still active, so we're validating it before sending you back in."
        note="This usually takes a moment."
        icon={<LoaderCircle className="animate-spin text-bv-accent" size={28} />}
      />
    );
  }

  return (
    <AuthShell
      eyebrow="Sign In"
      title="Return to the verified voting flow."
      description="Use your email and password or confirm a wallet signature to continue where you left off."
      footer={
        <p className="text-center text-xs text-bv-ink-muted">
          Use the wallet already linked to your account when signing in with MetaMask.
        </p>
      }
    >
      <div className="max-w-xl">
        <p className="text-sm text-bv-ink-secondary">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="font-medium text-bv-accent transition-opacity hover:opacity-80">
            Register now
          </Link>
        </p>

        <div className="mt-10 rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.22)] backdrop-blur-xl sm:p-8">
          <div className="mb-6">
            <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-bv-accent">
              Account access
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-white">
              Welcome back
            </h2>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              icon={<Mail size={16} />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              icon={<Lock size={16} />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="text-bv-ink-muted transition-colors hover:text-bv-ink-secondary"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
            />

            <Button type="submit" variant="primary" fullWidth size="lg" loading={submitting}>
              {submitting ? 'Signing in...' : 'Sign in'}
              {!submitting ? <ArrowRight size={16} /> : null}
            </Button>

            <p className="text-center text-xs text-bv-ink-muted">
              Didn&apos;t get a verification email after registering?{' '}
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={resending}
                className="font-medium text-bv-accent underline-offset-2 hover:underline disabled:opacity-50"
              >
                {resending ? 'Sending…' : 'Resend verification link'}
              </button>
            </p>
          </form>

          <div className="auth-divider my-6">
            <span>or continue with</span>
          </div>

          <Button
            type="button"
            variant="outline"
            fullWidth
            size="lg"
            className="border-white/10 bg-white/[0.03]"
            onClick={handleWalletLogin}
            loading={walletSubmitting}
          >
            <Wallet size={16} />
            {walletSubmitting ? 'Waiting for MetaMask...' : 'Sign in with MetaMask'}
          </Button>
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

export default LoginPage;
