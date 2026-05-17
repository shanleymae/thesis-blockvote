import { useEffect, useState } from 'react';
import { ArrowLeft, BarChart2, Calendar, Clock, LogIn, Radio, Search, Trophy, Users } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import CandidateCard from '../../components/shared/CandidateCard';
import ResultsChart from '../../components/shared/ResultsChart';
import { electionsApi, resultsApi, type ElectionDetail, type ElectionResults } from '../../api/client';
import { subscribeToElectionResults } from '../../lib/resultsSocket';

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString();
}

const PublicElectionDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [election, setElection] = useState<ElectionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ElectionResults | null>(null);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [resultsError, setResultsError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    const load = async () => {
      try {
        const electionData = await electionsApi.getById(id);
        if (cancelled) return;
        setElection(electionData);
        setError(null);
      } catch (e) {
        if (!cancelled) {
          setError((e as Error).message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    const loadResults = async () => {
      try {
        setResultsLoading(true);
        setResultsError(null);
        const data = await resultsApi.getElectionResults(id);
        if (!cancelled) setResults(data);
      } catch (e) {
        if (!cancelled) setResultsError((e as Error).message);
      } finally {
        if (!cancelled) setResultsLoading(false);
      }
    };

    loadResults();
    const unsubscribe = subscribeToElectionResults(id, (data) => {
      if (!cancelled) {
        setResults(data);
        setResultsLoading(false);
        setResultsError(null);
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [id]);

  const leadingCandidateId =
    results?.winner != null
      ? election?.candidates.find(
          (candidate) => candidate.id === results.winner?.candidateId
        )?.id ?? null
      : null;
  const isPublished = results?.published ?? election?.resultsPublished ?? false;
  const publishedAt = results?.publishedAt ?? election?.resultsPublishedAt ?? null;

  return (
    <div className="min-h-screen bg-bv-bg text-bv-ink">
      <Navbar />

      <main className="mx-auto max-w-7xl px-8 pb-16 pt-24">
        <Link
          to="/elections"
          className="inline-flex items-center gap-2 text-sm text-bv-ink-secondary transition-colors hover:text-bv-ink"
        >
          <ArrowLeft size={16} />
          Back to elections
        </Link>

        {loading && <p className="mt-8 text-bv-ink-muted">Loading election...</p>}

        {!loading && error && (
          <div className="mt-8 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        {!loading && election && (
          <>
            <section className="mt-8 rounded-[28px] border border-bv-border bg-bv-surface p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="max-w-3xl">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-bv-accent">
                    Election Details
                  </p>
                  <h1 className="mt-2 text-3xl font-bold text-bv-ink">{election.title}</h1>
                  <p className="mt-3 text-sm leading-7 text-bv-ink-secondary">
                    {election.description}
                  </p>
                </div>
                <div className="rounded-full border border-bv-border bg-bv-bg px-4 py-2 text-xs font-semibold uppercase tracking-wide text-bv-ink-secondary">
                  {election.status}
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3 text-sm text-bv-ink-secondary">
                <span className="inline-flex items-center gap-2 rounded-full border border-bv-border px-4 py-2">
                  <Calendar size={15} className="text-bv-accent" />
                  Opens {formatDateTime(election.startDate)}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-bv-border px-4 py-2">
                  <Clock size={15} className="text-bv-accent" />
                  Closes {formatDateTime(election.endDate)}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-bv-border px-4 py-2">
                  <Users size={15} className="text-bv-accent" />
                  {election.candidates.length} candidates
                </span>
              </div>
              {election.contractElectionId == null && (
                <div className="mt-5 rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                  This election is visible publicly but still needs admin sync for full on-chain linkage.
                </div>
              )}

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 rounded-xl bg-bv-accent px-5 py-3 text-sm font-semibold text-bv-bg transition-colors hover:opacity-90"
                >
                  <LogIn size={16} />
                  Log In To Vote
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center rounded-xl border border-bv-border px-5 py-3 text-sm font-semibold text-bv-ink transition-colors hover:bg-bv-surface-hover"
                >
                  Register
                </Link>
              </div>
            </section>

            <section className="mt-8 rounded-[28px] border border-bv-border bg-bv-bg-deep px-6 py-8">
              <div className="mx-auto mb-8 max-w-3xl text-center">
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-bv-accent">
                  Candidate Lineup
                </p>
                <h2 className="mt-3 text-4xl font-bold text-bv-ink">
                  Meet the candidates before voting opens
                </h2>
                <p className="mt-3 text-sm text-bv-ink-secondary">
                  You can review each candidate profile now. Voting becomes available once the election starts.
                </p>
              </div>

              {election.candidates.length === 0 ? (
                <div className="rounded-2xl border border-bv-border bg-bv-surface p-6 text-center text-sm text-bv-ink-muted">
                  No candidates have been added yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {election.candidates.map((candidate) => (
                    <CandidateCard
                      key={candidate.id}
                      {...candidate}
                      size="compact"
                      hideVoteButton
                      profileHref={`/elections/${election.id}/candidates/${candidate.id}`}
                      highlightLabel={leadingCandidateId === candidate.id ? 'Leading the polls' : null}
                    />
                  ))}
                </div>
              )}
            </section>

            <section className="mt-8">
              <div className="mb-3 flex items-center justify-between gap-4">
                <h2 className="text-lg font-bold text-bv-ink flex items-center gap-2">
                  <BarChart2 size={18} className="text-bv-accent" />
                  Live Public Tally
                </h2>
                <Link
                  to="/verify"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-bv-accent hover:underline"
                >
                  <Search size={14} />
                  Verify transaction
                </Link>
              </div>
              <div className="rounded-[24px] border border-bv-border bg-bv-surface p-6">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-bv-accent/20 bg-bv-accent/5 px-3 py-1 text-xs font-medium text-bv-accent">
                  <Radio size={12} />
                  Live tally remains visible during and after voting
                </div>
                <ResultsChart
                  candidates={results?.candidates ?? []}
                  winner={results?.winner ?? null}
                  totalVotes={results?.totalVotes ?? 0}
                  loading={resultsLoading}
                  error={resultsError}
                  emptyMessage="No votes have been recorded for this election yet."
                />
              </div>
            </section>

            <section className="mt-8 rounded-[24px] border border-bv-border bg-bv-surface p-6">
              <div className="flex items-center gap-2">
                <Trophy size={18} className="text-bv-accent" />
                <h2 className="text-lg font-bold text-bv-ink">Official Published Result</h2>
              </div>
              {isPublished ? (
                <>
                  <p className="mt-4 text-2xl font-bold text-bv-ink">
                    {results?.winner?.name ?? 'No winner declared'}
                  </p>
                  <p className="mt-2 text-sm text-bv-ink-secondary">
                    Published {publishedAt ? new Date(publishedAt).toLocaleString() : 'recently'} by the election administrator after closure.
                  </p>
                </>
              ) : election.status === 'CLOSED' ? (
                <>
                  <p className="mt-4 text-sm font-medium text-bv-ink">Official results are not published yet.</p>
                  <p className="mt-2 text-sm text-bv-ink-secondary">
                    The election is closed, but the administrator has not submitted the final published result yet. The live tally above is still available for transparency.
                  </p>
                </>
              ) : (
                <>
                  <p className="mt-4 text-sm font-medium text-bv-ink">Official results will appear after the election closes.</p>
                  <p className="mt-2 text-sm text-bv-ink-secondary">
                    You can still follow the live tally while the election is in progress.
                  </p>
                </>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
};

export default PublicElectionDetailPage;
