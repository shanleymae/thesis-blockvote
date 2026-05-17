import { useState } from 'react';
import { CheckCircle, ExternalLink, Shield, Search } from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { votesApi } from '../../api/client';

function maskWalletAddress(walletAddress?: string | null) {
  if (!walletAddress) return 'Unknown wallet';
  if (walletAddress.includes('...')) return walletAddress;
  if (walletAddress.length <= 12) return walletAddress;
  return `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
}

const PublicVerifyPage = () => {
  const [txHash, setTxHash] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    election: string;
    candidate: string;
    wallet: string;
    timestamp: string;
    txHash: string;
  } | null>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = txHash.trim();
    if (!value) return;
    if (!/^0x[a-fA-F0-9]{64}$/.test(value)) {
      setError('Enter a valid transaction hash (0x + 64 hex characters).');
      setResult(null);
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await votesApi.verify(value);
      if (!res.verified) {
        setError('Vote not found for this transaction hash.');
        return;
      }
      const createdAt = (res as { vote: { createdAt?: string } }).vote.createdAt ?? new Date().toISOString();
      setResult({
        election: res.vote.election.title,
        candidate: res.vote.candidate.name,
        wallet: maskWalletAddress(res.vote.user.walletAddress),
        timestamp: new Date(createdAt).toLocaleString(),
        txHash: res.vote.txHash,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bv-bg text-bv-ink">
      <Navbar />

      <main className="mx-auto max-w-5xl px-8 pb-16 pt-24">
        <section className="rounded-[28px] border border-bv-border bg-bv-surface p-6 md:p-8">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-bv-accent/20 bg-bv-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-bv-accent">
              <Search size={14} />
              Public Blockchain Transaction Viewing
            </div>
            <h1 className="mt-4 text-3xl font-bold text-bv-ink">Verify a recorded vote</h1>
            <p className="mt-3 text-sm leading-7 text-bv-ink-secondary">
              Guests can inspect a vote by transaction hash to confirm that a ballot was recorded and matched to an election entry.
            </p>
          </div>

          <form className="mt-8 rounded-2xl border border-bv-border bg-bv-bg p-5" onSubmit={handleVerify}>
            <Input
              label="Transaction Hash"
              type="text"
              placeholder="Enter transaction hash (0x...)"
              className="mb-4 text-sm font-mono"
              value={txHash}
              onChange={(e) => setTxHash(e.target.value)}
            />
            <div className="flex flex-wrap gap-3">
              <Button variant="primary" size="lg" type="submit" disabled={loading}>
                {loading ? 'Verifying...' : 'Verify Transaction'}
              </Button>
              {txHash && (
                <Button
                  variant="outline"
                  size="lg"
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    setTxHash('');
                    setError(null);
                    setResult(null);
                  }}
                >
                  Clear
                </Button>
              )}
            </div>
            {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
          </form>

          {result && (
            <div className="mt-6 rounded-2xl border border-green-500/25 bg-green-500/5 p-6">
              <div className="mb-5 flex items-center gap-2 text-green-400">
                <CheckCircle size={16} />
                <span className="text-xs font-semibold uppercase tracking-[0.2em]">
                  Verified Record
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {[
                  { label: 'Election', value: result.election },
                  { label: 'Candidate', value: result.candidate },
                  { label: 'Wallet', value: result.wallet },
                  { label: 'Recorded', value: result.timestamp },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl border border-bv-border bg-bv-surface px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-bv-ink-muted">
                      {item.label}
                    </p>
                    <p className="mt-2 text-sm font-medium text-bv-ink break-all">{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <a
                  href={`https://sepolia.etherscan.io/tx/${result.txHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-bv-border bg-bv-surface px-4 py-2.5 text-sm font-medium text-bv-ink-secondary transition-colors hover:border-bv-accent hover:text-bv-accent"
                >
                  <ExternalLink size={15} />
                  View on Etherscan
                </a>
              </div>
            </div>
          )}
        </section>

        <section className="mt-6 rounded-[24px] border border-bv-border bg-bv-surface px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-bv-accent-muted text-bv-accent">
              <Shield size={18} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-bv-ink">Guest access note</h2>
              <p className="mt-1 text-sm leading-6 text-bv-ink-secondary">
                Guests can browse election schedules, candidate information, live public tallies, published results, and transaction proofs. Voting and account actions require login.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default PublicVerifyPage;
