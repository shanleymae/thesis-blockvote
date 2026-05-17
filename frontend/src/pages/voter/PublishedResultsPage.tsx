import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Calendar, Search, Trophy } from 'lucide-react'
import { Link } from 'react-router-dom'
import Sidebar from '../../components/layout/Sidebar'
import ElectionCard from '../../components/shared/ElectionCard'
import { electionGroupsApi, type ElectionGroupListItem } from '../../api/client'
import { useAuth } from '../../context/AuthContext'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function statusToVariant(status: string): 'active' | 'upcoming' | 'closed' {
  const lower = status.toLowerCase()
  if (lower === 'active') return 'active'
  if (lower === 'upcoming' || lower === 'paused') return 'upcoming'
  return 'closed'
}

type PositionResultSummary = {
  electionId: string
  positionTitle: string
  winner: { name: string; voteCount: number } | null
  totalVotes: number
  published: boolean
}

const PublishedResultsPage = () => {
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [elections, setElections] = useState<ElectionGroupListItem[]>([])
  const [resultSummaries, setResultSummaries] = useState<Record<string, PositionResultSummary[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    setLoading(true)
    setError(null)
    electionGroupsApi
      .getMyList({ status: 'CLOSED' })
      .then(async (items) => {
        if (cancelled) return
        setElections(items)

        const publishedItems = items.filter(
          (election) => election.resultsPublished || election.positions.some((position) => position.resultsPublished)
        )
        const summaries = await Promise.all(
          publishedItems.map(async (election) => {
            try {
              const data = await electionGroupsApi.getResults(election.id)
              return [
                election.id,
                data.positions.map((position) => ({
                  electionId: position.electionId,
                  positionTitle: position.positionTitle,
                  winner: position.results.winner
                    ? {
                        name: position.results.winner.name,
                        voteCount: position.results.winner.voteCount,
                      }
                    : null,
                  totalVotes: position.results.totalVotes,
                  published: position.results.published,
                })),
              ] as const
            } catch {
              return [election.id, []] as const
            }
          })
        )

        if (!cancelled) {
          setResultSummaries(Object.fromEntries(summaries))
        }
      })
      .catch((e) => {
        if (!cancelled) setError((e as Error).message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const publishedElections = useMemo(
    () =>
      elections
        .filter((election) => election.resultsPublished || election.positions.some((position) => position.resultsPublished))
        .filter((election) => {
          const term = search.toLowerCase()
          return (
            election.title.toLowerCase().includes(term) ||
            election.organization?.name?.toLowerCase().includes(term)
          )
        })
        .sort((left, right) => {
          const leftTs = new Date(left.resultsPublishedAt ?? left.endDate).getTime()
          const rightTs = new Date(right.resultsPublishedAt ?? right.endDate).getTime()
          return rightTs - leftTs
        }),
    [elections, search]
  )

  const hasSearch = search.trim().length > 0

  return (
    <div className="min-h-screen bg-bv-bg flex">
      <Sidebar variant="voter" />

      <main className="ml-56 flex-1 overflow-y-auto p-8">
        <div className="mb-8 flex flex-col gap-5 border-b border-white/10 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link
              to="/voter/elections"
              className="mb-4 inline-flex items-center gap-2 text-sm text-bv-ink-secondary transition-colors hover:text-bv-ink"
            >
              <ArrowLeft size={16} />
              Back to elections
            </Link>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-bv-accent">
              Official Results
            </p>
            <h1 className="mt-3 text-2xl font-bold text-bv-ink">Published Results</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-bv-ink-secondary">
              View published results for global elections and elections from your organization.
            </p>
          </div>

          <div className="relative w-full max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-bv-ink-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search published results..."
              className="w-full rounded-lg border border-bv-border bg-bv-surface py-2.5 pl-9 pr-4 text-sm text-bv-ink placeholder-bv-ink-muted focus:border-bv-accent focus:outline-none"
            />
          </div>
        </div>

        <div className="mb-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-bv-accent-muted text-bv-accent">
                <Trophy size={18} />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-bv-ink">Your accessible archive</h2>
                <p className="mt-1 text-sm leading-6 text-bv-ink-secondary">
                  {user?.organization?.name
                    ? `Showing global results and published results for ${user.organization.name}.`
                    : 'Showing published results available to your voter account.'}
                </p>
              </div>
            </div>
            {hasSearch && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="w-fit rounded-lg border border-bv-border px-3 py-2 text-xs text-bv-ink-secondary transition-colors hover:text-bv-ink"
              >
                Clear search
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-16 text-center text-bv-ink-muted">Loading published results...</div>
        ) : publishedElections.length === 0 ? (
          <div className="rounded-xl border border-bv-border bg-bv-surface p-8 text-center text-sm text-bv-ink-muted">
            No published results are available for your account yet.
          </div>
        ) : (
          <>
            <section>
              <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-bv-ink">
                <Calendar size={20} />
                Publication schedule
              </h2>
              <div className="overflow-x-auto rounded-xl border border-bv-border bg-bv-surface">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-bv-border">
                      <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-bv-ink-muted">Election</th>
                      <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-bv-ink-muted">Scope</th>
                      <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-bv-ink-muted">Published</th>
                      <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-bv-ink-muted">Ended</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-bv-border">
                    {publishedElections.map((election) => (
                      <tr key={election.id} className="hover:bg-bv-surface-hover/50">
                        <td className="px-5 py-3 text-sm font-medium text-bv-ink">{election.title}</td>
                        <td className="px-5 py-3 text-sm text-bv-ink-secondary">
                          {election.scope === 'ORGANIZATION' ? election.organization?.name ?? 'My organization' : 'Global'}
                        </td>
                        <td className="px-5 py-3 text-sm text-bv-ink-secondary">
                          {formatDate(election.resultsPublishedAt ?? election.endDate)}
                        </td>
                        <td className="px-5 py-3 text-sm text-bv-ink-secondary">{formatDate(election.endDate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="mt-10">
              <h2 className="mb-4 text-xl font-semibold text-bv-ink">Published election results</h2>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                {publishedElections.map((election) => (
                  <div
                    key={election.id}
                    className="rounded-2xl border border-white/10 bg-white/[0.015] p-4"
                  >
                    <ElectionCard
                      id={election.id}
                      title={election.title}
                      description={election.description}
                      status={statusToVariant(election.status)}
                      startDate={election.startDate}
                      endDate={election.endDate}
                      candidateCount={election.candidateCount}
                      hasVoted={false}
                      role="voter"
                      showCountdown={false}
                    />

                    <div className="mt-4 border-t border-white/10 pt-4">
                      <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-bv-ink-muted">
                        Position winners
                      </p>
                      <div className="space-y-2">
                        {(resultSummaries[election.id] ?? []).length === 0 ? (
                          <p className="text-xs text-bv-ink-muted">Official winners are still being loaded.</p>
                        ) : (
                          resultSummaries[election.id].map((position) => (
                            <Link
                              key={position.electionId}
                              to={`/voter/elections/${election.id}`}
                              className="block rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 transition-colors hover:border-bv-accent/50"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <p className="text-sm font-medium text-bv-ink">{position.positionTitle}</p>
                                <span className="rounded-full bg-bv-accent-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-bv-accent">
                                  Winner
                                </span>
                              </div>
                              <p className="mt-1 text-sm text-bv-ink-secondary">
                                {position.winner ? position.winner.name : 'No winner declared'}
                              </p>
                              <p className="mt-1 text-xs text-bv-ink-muted">
                                {position.winner ? `${position.winner.voteCount} winning votes` : 'No votes recorded'} · {position.totalVotes} total votes
                              </p>
                            </Link>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  )
}

export default PublishedResultsPage
