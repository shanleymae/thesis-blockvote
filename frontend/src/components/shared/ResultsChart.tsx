import { BarChart3, Trophy } from 'lucide-react';

type ResultCandidate = {
  candidateId: string;
  name: string;
  voteCount: number;
};

interface ResultsChartProps {
  candidates: ResultCandidate[];
  winner: ResultCandidate | null;
  totalVotes: number;
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
}

const ResultsChart: React.FC<ResultsChartProps> = ({
  candidates,
  winner,
  totalVotes,
  loading = false,
  error = null,
  emptyMessage = 'No votes have been recorded for this election yet.',
}) => {
  const maxVotes = Math.max(...candidates.map((candidate) => candidate.voteCount), 1);
  const orderedCandidates = [...candidates].sort((left, right) => right.voteCount - left.voteCount);

  if (loading && candidates.length === 0) {
    return <p className="text-bv-ink-muted text-sm">Loading live results...</p>;
  }

  if (error) {
    return <p className="text-red-400 text-sm">{error}</p>;
  }

  if (candidates.length === 0) {
    return <p className="text-bv-ink-muted text-sm">{emptyMessage}</p>;
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-bv-border bg-bv-bg px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-bv-ink-muted">
            Total Votes
          </p>
          <p className="mt-2 text-2xl font-bold text-bv-ink">{totalVotes}</p>
        </div>
        <div className="rounded-2xl border border-bv-border bg-bv-bg px-4 py-3 md:col-span-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-bv-ink-muted">
            Current Leader
          </p>
          <div className="mt-2 flex items-center gap-2 text-bv-ink">
            <Trophy size={16} className="text-bv-accent" />
            <span className="text-base font-semibold">
              {winner ? winner.name : 'No leader yet'}
            </span>
            {winner && (
              <span className="rounded-full bg-bv-accent-muted px-2.5 py-1 text-[11px] font-semibold text-bv-accent">
                {winner.voteCount} votes
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-[24px] border border-bv-border bg-bv-bg p-4">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-bv-accent-muted text-bv-accent">
            <BarChart3 size={18} />
          </div>
          <div>
            <p className="text-sm font-semibold text-bv-ink">Live Tally</p>
            <p className="text-xs text-bv-ink-muted">Vote counts update in real time from recorded ballots.</p>
          </div>
        </div>

        <div className="space-y-3">
          {orderedCandidates.map((candidate) => {
            const percentage =
              totalVotes > 0 ? Math.round((candidate.voteCount / totalVotes) * 100) : 0;
            const widthPercent =
              candidate.voteCount > 0
                ? Math.max((candidate.voteCount / maxVotes) * 100, 8)
                : 0;
            const isWinner = winner?.candidateId === candidate.candidateId;

            return (
              <div
                key={candidate.candidateId}
                className={`rounded-[20px] border px-4 py-4 transition-colors ${
                  isWinner
                    ? 'border-bv-accent/25 bg-bv-surface'
                    : 'border-bv-border bg-bv-surface'
                }`}
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold text-bv-ink">{candidate.name}</p>
                      {isWinner && (
                        <span className="rounded-full bg-bv-accent-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-bv-accent">
                          Leading
                        </span>
                      )}
                    </div>
                    <p className={`mt-1 text-xs ${isWinner ? 'text-bv-accent' : 'text-bv-ink-muted'}`}>
                      {percentage}% of votes
                    </p>
                  </div>
                  <div className="rounded-full border border-bv-border bg-bv-bg px-3 py-1 text-[11px] font-semibold text-bv-ink-secondary">
                    {candidate.voteCount} votes
                  </div>
                </div>

                <div className="h-3 overflow-hidden rounded-full bg-bv-bg-deep">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isWinner
                        ? 'bg-bv-accent shadow-[0_0_22px_rgba(0,212,200,0.18)]'
                        : 'bg-bv-ink-muted/50'
                    }`}
                    style={{ width: `${widthPercent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ResultsChart;
