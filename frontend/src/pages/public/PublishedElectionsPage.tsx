import { useEffect, useMemo, useState } from 'react'
import { Calendar, Search, Trophy } from 'lucide-react'
import { Link } from 'react-router-dom'
import Navbar from '../../components/layout/Navbar'
import ElectionCard from '../../components/shared/ElectionCard'
import { electionsApi, type ElectionListItem } from '../../api/client'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const PublishedElectionsPage = () => {
  const [search, setSearch] = useState('')
  const [elections, setElections] = useState<ElectionListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    electionsApi
      .getList({ status: 'CLOSED', scope: 'GLOBAL' })
      .then(setElections)
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false))
  }, [])

  const publishedElections = useMemo(
    () =>
      elections
        .filter((election) => election.resultsPublished)
        .filter((election) => election.title.toLowerCase().includes(search.toLowerCase()))
        .sort((left, right) => {
          const leftTs = new Date(left.resultsPublishedAt ?? left.endDate).getTime()
          const rightTs = new Date(right.resultsPublishedAt ?? right.endDate).getTime()
          return rightTs - leftTs
        }),
    [elections, search]
  )
  const hasSearch = search.trim().length > 0

  return (
    <div className="min-h-screen bg-bv-bg text-bv-ink">
      <Navbar />

      <main className="mx-auto max-w-6xl px-8 pb-16 pt-24">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-bv-accent">
              Official Results
            </p>
            <h1 className="mt-3 text-3xl font-bold text-bv-ink">Published Elections</h1>
            <p className="mt-2 max-w-2xl text-sm text-bv-ink-secondary">
              Browse elections whose official results have already been published by the administrator.
            </p>
          </div>
          <Link
            to="/elections"
            className="inline-flex items-center gap-2 text-sm font-medium text-bv-accent hover:underline"
          >
            Back to active and upcoming elections
          </Link>
        </div>

        <div className="mt-8 rounded-[24px] border border-bv-border bg-bv-surface px-5 py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-bv-accent-muted text-bv-accent">
                <Trophy size={18} />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-bv-ink">Published election archive</h2>
                <p className="mt-1 text-sm leading-6 text-bv-ink-secondary">
                  Only elections with officially published results appear here. Live and pending elections stay on the main elections page.
                </p>
              </div>
            </div>
            <div className="relative w-full max-w-sm">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-bv-ink-muted" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search published elections..."
                className="w-full rounded-lg border border-bv-border bg-bv-bg pl-9 pr-4 py-2.5 text-sm text-bv-ink placeholder-bv-ink-muted focus:border-bv-accent focus:outline-none"
              />
            </div>
          </div>
          {hasSearch && (
            <div className="mt-3">
              <button
                type="button"
                onClick={() => setSearch('')}
                className="rounded-lg border border-bv-border px-3 py-2 text-xs text-bv-ink-secondary transition-colors hover:text-bv-ink"
              >
                Clear search
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-16 text-center text-bv-ink-muted">Loading published elections...</div>
        ) : publishedElections.length === 0 ? (
          <div className="rounded-xl border border-bv-border bg-bv-surface p-8 text-center text-sm text-bv-ink-muted">
            No published elections match your search yet.
          </div>
        ) : (
          <>
            <section className="mt-8">
              <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-bv-ink">
                <Calendar size={20} />
                Publication schedule
              </h2>
              <div className="overflow-x-auto rounded-xl border border-bv-border bg-bv-surface">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-bv-border">
                      <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-bv-ink-muted">Title</th>
                      <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-bv-ink-muted">Published</th>
                      <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-bv-ink-muted">Ended</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-bv-border">
                    {publishedElections.map((election) => (
                      <tr key={election.id} className="hover:bg-bv-surface-hover/50">
                        <td className="px-5 py-3 text-sm font-medium text-bv-ink">{election.title}</td>
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
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                {publishedElections.map((election) => (
                  <ElectionCard
                    key={election.id}
                    id={election.id}
                    title={election.title}
                    description={election.description}
                    status="closed"
                    startDate={election.startDate}
                    endDate={election.endDate}
                    candidateCount={election.candidateCount}
                    hasVoted={false}
                    role="public"
                  />
                ))}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  )
}

export default PublishedElectionsPage
