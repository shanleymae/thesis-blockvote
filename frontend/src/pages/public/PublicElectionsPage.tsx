import { useState, useEffect, useMemo } from 'react'
import { Search, Calendar, LogIn, Shield, Trophy } from 'lucide-react'
import { Link } from 'react-router-dom'
import Navbar from '../../components/layout/Navbar'
import ElectionCard from '../../components/shared/ElectionCard'
import { electionsApi, type ElectionListItem } from '../../api/client'

type FilterTab = 'all' | 'ACTIVE' | 'UPCOMING' | 'CLOSED'

const tabs: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'ACTIVE', label: 'Active' },
  { key: 'UPCOMING', label: 'Upcoming' },
  { key: 'CLOSED', label: 'Closed' },
]

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function statusToVariant(s: string): 'active' | 'upcoming' | 'closed' {
  const lower = s.toLowerCase()
  if (lower === 'active') return 'active'
  if (lower === 'upcoming' || lower === 'paused') return 'upcoming'
  return 'closed'
}

const PublicElectionsPage = () => {
  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const [search, setSearch] = useState('')
  const [elections, setElections] = useState<ElectionListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const status = activeTab === 'all' ? undefined : activeTab
    setLoading(true)
    setError(null)
    electionsApi
      .getList({ status, scope: 'GLOBAL' })
      .then(setElections)
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false))
  }, [activeTab])

  const filtered = elections.filter((e) =>
    e.title.toLowerCase().includes(search.toLowerCase())
  )

  const schedule = [...filtered].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  )
  const publishedCount = useMemo(
    () => elections.filter((election) => election.resultsPublished).length,
    [elections]
  )
  const hasFilters = activeTab !== 'all' || search.trim().length > 0

  return (
    <div className="min-h-screen bg-bv-bg text-bv-ink">
      <Navbar />

      <main className="pt-24 pb-16 px-8 max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-bv-ink">Elections</h1>
          <p className="text-bv-ink-secondary mt-1">View election schedules, candidate information, and public statuses without an account.</p>
        </div>

        <div className="mb-6 rounded-[24px] border border-bv-border bg-bv-surface px-5 py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-bv-accent-muted text-bv-accent">
                <Shield size={18} />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-bv-ink">Guest view</h2>
                <p className="mt-1 text-sm leading-6 text-bv-ink-secondary">
                  Guests can browse schedules, statuses, candidates, published results, and public transaction proofs. Login is required only for voting and account actions.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row lg:flex-shrink-0">
              <Link to="/published-elections">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-xl border border-bv-border px-4 py-2.5 text-sm font-medium text-bv-ink-secondary transition-colors hover:border-bv-accent hover:text-bv-accent"
                >
                  <Trophy size={15} />
                  Published Results ({publishedCount})
                </button>
              </Link>
              <Link to="/login">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-xl border border-bv-border px-4 py-2.5 text-sm font-medium text-bv-ink-secondary transition-colors hover:border-bv-accent hover:text-bv-accent"
                >
                  <LogIn size={15} />
                  Log in to vote
                </button>
              </Link>
            </div>
          </div>
        </div>

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-bv-ink-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search elections..."
              className="bg-bv-surface border border-bv-border rounded-lg pl-9 pr-4 py-2.5 text-bv-ink placeholder-bv-ink-muted focus:border-bv-accent focus:outline-none w-full text-sm"
            />
          </div>
          {hasFilters && (
            <button
              type="button"
              onClick={() => {
                setActiveTab('all')
                setSearch('')
              }}
              className="inline-flex items-center justify-center rounded-lg border border-bv-border px-3 py-2 text-xs text-bv-ink-secondary transition-colors hover:text-bv-ink"
            >
              Clear filters
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 mb-6 bg-bv-surface border border-bv-border rounded-xl p-1 w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                activeTab === tab.key ? 'bg-bv-accent text-bv-bg' : 'text-bv-ink-secondary hover:text-bv-ink'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-16 text-bv-ink-muted">Loading elections...</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-bv-border bg-bv-surface p-8 text-center text-sm text-bv-ink-muted">
            No elections match your current search or status filter.
          </div>
        ) : (
          <>
            <section className="mb-12">
              <h2 className="text-xl font-semibold text-bv-ink mb-4 flex items-center gap-2">
                <Calendar size={20} />
                Election schedule
              </h2>
              <div className="overflow-x-auto rounded-xl border border-bv-border bg-bv-surface">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-bv-border">
                      <th className="px-5 py-3 text-left text-xs text-bv-ink-muted uppercase tracking-wide font-medium">Title</th>
                      <th className="px-5 py-3 text-left text-xs text-bv-ink-muted uppercase tracking-wide font-medium">Status</th>
                      <th className="px-5 py-3 text-left text-xs text-bv-ink-muted uppercase tracking-wide font-medium">Start</th>
                      <th className="px-5 py-3 text-left text-xs text-bv-ink-muted uppercase tracking-wide font-medium">End</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-bv-border">
                    {schedule.map((e) => (
                      <tr key={e.id} className="hover:bg-bv-surface-hover/50">
                        <td className="px-5 py-3 text-bv-ink text-sm font-medium">{e.title}</td>
                        <td className="px-5 py-3">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                            e.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400' :
                            e.status === 'UPCOMING' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {e.status}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-bv-ink-secondary text-sm">{formatDate(e.startDate)}</td>
                        <td className="px-5 py-3 text-bv-ink-secondary text-sm">{formatDate(e.endDate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-bv-ink mb-4">All elections</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filtered.map((election) => (
                  <ElectionCard
                    key={election.id}
                    id={election.id}
                    title={election.title}
                    description={election.description}
                    status={statusToVariant(election.status)}
                    startDate={election.startDate}
                    endDate={election.endDate}
                    candidateCount={election.candidateCount}
                    hasVoted={false}
                    role="public"
                    syncState={election.contractElectionId != null ? 'synced' : 'needs-sync'}
                  />
                ))}
              </div>
            </section>
          </>
        )}

        <p className="mt-8 text-bv-ink-muted text-sm">
          <Link to="/verify" className="text-bv-accent hover:underline">Verify a public transaction</Link>
          {' or '}
          <Link to="/login" className="text-bv-accent hover:underline">log in</Link>
          {' to participate in active elections.'}
        </p>
      </main>
    </div>
  )
}

export default PublicElectionsPage
