import { useState, useEffect } from 'react'
import { Search, Trophy } from 'lucide-react'
import { Link } from 'react-router-dom'
import Sidebar from '../../components/layout/Sidebar'
import ElectionCard from '../../components/shared/ElectionCard'
import { electionGroupsApi, type ElectionGroupListItem } from '../../api/client'
import { useAuth } from '../../context/AuthContext'

type FilterTab = 'all' | 'ACTIVE' | 'UPCOMING' | 'CLOSED'
type ScopeTab = 'all' | 'GLOBAL' | 'ORGANIZATION'

const tabs: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'ACTIVE', label: 'Active' },
  { key: 'UPCOMING', label: 'Upcoming' },
  { key: 'CLOSED', label: 'Closed' },
]

function statusToVariant(s: string): 'active' | 'upcoming' | 'closed' {
  const lower = s.toLowerCase()
  if (lower === 'active') return 'active'
  if (lower === 'upcoming' || lower === 'paused') return 'upcoming'
  return 'closed'
}

const ElectionsPage = () => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const [scopeTab, setScopeTab] = useState<ScopeTab>('all')
  const [search, setSearch] = useState('')
  const [elections, setElections] = useState<ElectionGroupListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const status = activeTab === 'all' ? undefined : activeTab
    setLoading(true)
    setError(null)
    electionGroupsApi
      .getMyList({ status })
      .then(setElections)
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false))
  }, [activeTab])

  const filtered = elections.filter((e) => {
    const matchesSearch = e.title.toLowerCase().includes(search.toLowerCase())
    if (!matchesSearch) return false
    if (scopeTab === 'all') return true
    return e.scope === scopeTab
  })
  const hasActiveFilters = activeTab !== 'all' || scopeTab !== 'all' || search.trim().length > 0

  return (
    <div className="min-h-screen bg-bv-bg flex">
      <Sidebar variant="voter" />

      <main className="ml-56 flex-1 p-8 overflow-y-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-bv-ink">Elections</h1>
            <p className="text-bv-ink-secondary text-sm mt-1">Browse and participate in ongoing elections</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/voter/published-results"
              className="inline-flex items-center gap-2 rounded-xl border border-bv-border px-4 py-2.5 text-sm font-medium text-bv-ink-secondary transition-colors hover:border-bv-accent hover:text-bv-accent"
            >
              <Trophy size={15} />
              Published Results
            </Link>
            <div className="relative w-64">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-bv-ink-muted" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search elections..."
                className="bg-bv-surface border border-bv-border rounded-lg pl-9 pr-4 py-2.5 text-bv-ink placeholder-bv-ink-muted focus:border-bv-accent focus:outline-none w-full text-sm"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

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

        <div className="mb-6 flex items-center gap-2">
          <button
            onClick={() => setScopeTab('all')}
            className={`rounded-lg border px-4 py-2 text-sm transition-colors ${
              scopeTab === 'all'
                ? 'border-bv-accent bg-bv-accent text-bv-bg'
                : 'border-bv-border text-bv-ink-secondary hover:text-bv-ink'
            }`}
          >
            All scopes
          </button>
          <button
            onClick={() => setScopeTab('ORGANIZATION')}
            className={`rounded-lg border px-4 py-2 text-sm transition-colors ${
              scopeTab === 'ORGANIZATION'
                ? 'border-bv-accent bg-bv-accent text-bv-bg'
                : 'border-bv-border text-bv-ink-secondary hover:text-bv-ink'
            }`}
          >
            My organization
          </button>
          <button
            onClick={() => setScopeTab('GLOBAL')}
            className={`rounded-lg border px-4 py-2 text-sm transition-colors ${
              scopeTab === 'GLOBAL'
                ? 'border-bv-accent bg-bv-accent text-bv-bg'
                : 'border-bv-border text-bv-ink-secondary hover:text-bv-ink'
            }`}
          >
            Global
          </button>
          {hasActiveFilters && (
            <button
              onClick={() => {
                setActiveTab('all')
                setScopeTab('all')
                setSearch('')
              }}
              className="ml-1 rounded-lg border border-bv-border px-3 py-2 text-xs text-bv-ink-secondary transition-colors hover:text-bv-ink"
            >
              Clear filters
            </button>
          )}
          <span className="ml-2 text-xs text-bv-ink-muted">
            {user?.organization?.name ? `Org: ${user.organization.name}` : ''}
          </span>
        </div>

        {loading ? (
          <div className="text-center py-16 text-bv-ink-muted">Loading elections...</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-bv-border bg-bv-surface p-8 text-center text-sm text-bv-ink-muted">
            No elections found for this filter set. Try changing status/scope or clearing search.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
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
                role="voter"
                syncState={election.syncedPositionCount === election.positionCount ? 'synced' : 'needs-sync'}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default ElectionsPage
