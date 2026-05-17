import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, LoaderCircle, MailCheck, OctagonAlert } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { authApi } from '../../api/client';
import { AuthStatusScreen } from '../../components/auth/AuthShell';
import Button from '../../components/ui/Button';
import { notifyError, notifySuccess } from '../../lib/toast';

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [autoApproved, setAutoApproved] = useState(false);
  const hasVerified = useRef(false);

  useEffect(() => {
    if (hasVerified.current) return;
    hasVerified.current = true;

    if (!token) {
      setStatus('error');
      setMessage('Missing verification token.');
      notifyError('Missing verification token.');
      return;
    }

    authApi
      .verifyEmail(token)
      .then((res) => {
        setStatus('success');
        setMessage(res.message);
        setAutoApproved(Boolean(res.autoApproved));
        notifySuccess(res.autoApproved ? 'You are verified and approved.' : 'Email verified successfully.');
      })
      .catch((err) => {
        const errorMessage = err instanceof Error ? err.message : 'Verification failed';
        setStatus('error');
        setMessage(errorMessage);
        notifyError(errorMessage);
      });
  }, [token]);

  if (status === 'loading') {
    return (
      <AuthStatusScreen
        eyebrow="Email Verification"
        title="Verifying your email."
        description="We're confirming the token and activating your account now."
        note="Please keep this page open for a moment."
        icon={<LoaderCircle className="animate-spin text-bv-accent" size={28} />}
      />
    );
  }

  if (status === 'success') {
    return (
      <AuthStatusScreen
        tone="success"
        eyebrow="Verified"
        title="Your account is ready."
        description={
          <>
            <span>{message}</span>
            {autoApproved ? (
              <span className="mt-4 block rounded-2xl border border-bv-accent/25 bg-bv-accent-muted/30 px-4 py-3 text-sm text-bv-ink-secondary">
                Your first vote request will finalize on-chain voter approval if the contract still
                needs it.
              </span>
            ) : null}
          </>
        }
        icon={<MailCheck size={28} className="text-bv-accent" />}
        action={
          <Link to="/login">
            <Button variant="primary" size="lg">
              Go to login
              <CheckCircle2 size={16} />
            </Button>
          </Link>
        }
      />
    );
  }

  return (
    <AuthStatusScreen
      tone="error"
      eyebrow="Verification Failed"
      title="We couldn't confirm this link."
      description={message}
      icon={<OctagonAlert size={28} className="text-red-400" />}
      action={
        <Link to="/login">
          <Button variant="outline" size="lg" className="border-white/10 bg-white/[0.03]">
            Back to login
          </Button>
        </Link>
      }
    />
  );
};

export default VerifyEmailPage;
