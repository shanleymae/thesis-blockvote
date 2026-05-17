import { useState } from 'react';
import { CheckCircle, Shield } from 'lucide-react';
import Sidebar from '../../components/layout/Sidebar';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { votesApi } from '../../api/client';

function maskWalletAddress(walletAddress?: string | null) {
  if (!walletAddress) return 'Unknown wallet';
  if (walletAddress.includes('...')) return walletAddress;
  if (walletAddress.length <= 12) return walletAddress;
  return `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
}

const VerifyPage = () => {
  const [txHash, setTxHash] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    election: string;
    candidate: string;
    wallet: string;
    timestamp: string;
    blockConfirmations?: string;
  } | null>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txHash.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await votesApi.verify(txHash.trim());
      if (!res.verified) {
        setError('Vote not found for this transaction hash.');
        return;
      }
      const createdAt = (res as any).vote.createdAt ?? new Date().toISOString();
      setResult({
        election: res.vote.election.title,
        candidate: res.vote.candidate.name,
        wallet: maskWalletAddress(res.vote.user.walletAddress),
        timestamp: new Date(createdAt).toLocaleString(),
        blockConfirmations: undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bv-bg flex">
      <Sidebar variant="voter" />

      <main className="ml-56 flex flex-1 items-start justify-center overflow-y-auto p-8">
        <div className="w-full max-w-lg mt-8">
          {/* Title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-bv-accent-muted border border-bv-accent/20 mb-4">
              <Shield size={26} className="text-bv-accent" />
            </div>
            <h1 className="text-3xl font-bold text-bv-ink mb-2">Verify Your Vote</h1>
            <p className="text-bv-ink-secondary text-sm">
              Enter your transaction hash to confirm your vote was recorded
            </p>
          </div>

          {/* Input + Button */}
          <form
            className="bg-bv-surface border border-bv-border rounded-2xl p-6 mb-6"
            onSubmit={handleVerify}
          >
            <Input
              label="Transaction Hash"
              type="text"
              placeholder="Enter transaction hash (0x...)"
              className="text-sm font-mono mb-4"
              value={txHash}
              onChange={(e) => setTxHash(e.target.value)}
            />
            <Button variant="primary" fullWidth size="lg" type="submit" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify'}
            </Button>
            {error && (
              <p className="mt-3 text-red-400 text-sm text-center">
                {error}
              </p>
            )}
          </form>

          {/* Verified result */}
          {result && (
            <div
              className="bg-bv-surface border border-green-500/30 rounded-2xl p-6 mb-6"
              style={{ boxShadow: '0 0 20px rgba(34, 197, 94, 0.05)' }}
            >
              {/* Verified badge */}
              <div className="flex items-center gap-2 mb-5">
                <div className="flex items-center gap-2 bg-green-500/20 border border-green-500/30 rounded-full px-3 py-1">
                  <CheckCircle size={14} className="text-green-400" />
                  <span className="text-green-400 text-xs font-semibold">VERIFIED ON BLOCKCHAIN</span>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  { label: 'Election', value: result.election },
                  { label: 'Candidate Voted', value: result.candidate },
                  { label: 'Voter Wallet', value: result.wallet },
                  { label: 'Timestamp', value: result.timestamp },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-2.5 border-b border-bv-border last:border-0">
                    <span className="text-bv-ink-muted text-xs uppercase tracking-wide">{item.label}</span>
                    <span className="text-bv-ink text-sm font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Note */}
          <div className="p-4 bg-bv-surface border border-bv-border rounded-xl">
            <p className="text-bv-ink-secondary text-sm leading-relaxed text-center">
              Anyone can verify any vote using its transaction hash. This ensures full transparency and immutability of the voting process.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default VerifyPage;
