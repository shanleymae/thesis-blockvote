import { useEffect, useMemo, useState } from 'react';
import { Copy, Database, ExternalLink, FileCode, Radio, Search, ShieldCheck } from 'lucide-react';
import Sidebar from '../../components/layout/Sidebar';
import Badge from '../../components/ui/Badge';
import {
  electionGroupsApi,
  resultsApi,
  type Candidate,
  type ElectionGroupListItem,
} from '../../api/client';

type VoteLog = {
  id: string;
  txHash: string;
  candidateId: string;
  timestamp: string;
  electionId: string;
  positionTitle: string;
};

function statusVariant(status?: string): 'active' | 'upcoming' | 'closed' {
  if (status === 'ACTIVE') return 'active';
  if (status === 'CLOSED') return 'closed';
  return 'upcoming';
}

const explorerBase = 'https://sepolia.etherscan.io';

const BlockchainLogsPage = () => {
  const [elections, setElections] = useState<ElectionGroupListItem[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [logs, setLogs] = useState<VoteLog[]>([]);
  const [candidatesById, setCandidatesById] = useState<Record<string, Candidate>>({});
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadElections = async () => {
      try {
        setError(null);
        const list = await electionGroupsApi.getManageList();
        setElections(list);
        if (list.length > 0) {
          setSelectedGroupId(list[0].id);
        } else {
          setLoading(false);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load election groups');
        setLoading(false);
      }
    };

    void loadElections();
  }, []);

  useEffect(() => {
    const loadLogs = async () => {
      if (!selectedGroupId) return;

      setLoading(true);
      try {
        setError(null);
        const group = await electionGroupsApi.getByIdForAdmin(selectedGroupId);
        const map: Record<string, Candidate> = {};

        group.positions.forEach((position) => {
          position.candidates.forEach((candidate) => {
            map[candidate.id] = candidate;
          });
        });
        setCandidatesById(map);

        const positionLogs = await Promise.all(
          group.positions.map(async (position) => {
            const positionTitle = position.positionTitle ?? position.title;
            const items = await resultsApi.getElectionLogs(position.id);
            return items.map((log) => ({
              ...log,
              electionId: position.id,
              positionTitle,
            }));
          })
        );

        setLogs(
          positionLogs
            .flat()
            .sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime())
        );
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load blockchain logs');
        setLogs([]);
        setCandidatesById({});
      } finally {
        setLoading(false);
      }
    };

    void loadLogs();
  }, [selectedGroupId]);

  const filteredLogs = useMemo(() => {
    const query = search.toLowerCase().trim();
    if (!query) return logs;
    return logs.filter((log) => log.txHash.toLowerCase().includes(query));
  }, [logs, search]);

  const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS as string | undefined;
  const selectedGroup = elections.find((election) => election.id === selectedGroupId) ?? null;
  const latestLog = logs[0] ?? null;
  const uniquePositionsWithLogs = new Set(logs.map((log) => log.electionId)).size;
  const uniqueCandidatesWithLogs = new Set(logs.map((log) => log.candidateId)).size;

  return (
    <div className="min-h-screen bg-bv-bg flex">
      <Sidebar variant="admin" />

      <main className="ml-56 flex-1 overflow-y-auto px-10 py-8">
        <div className="mb-8 flex items-end justify-between border-b border-white/10 pb-5">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-bv-ink-muted">Blockchain Monitoring</p>
            <h1 className="mt-1 text-2xl font-semibold text-bv-ink">Audit Logs</h1>
            <p className="mt-1 text-sm text-bv-ink-secondary">
              Monitor vote transaction receipts by election group and verify them on-chain.
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-right">
            <p className="text-xs uppercase tracking-wide text-bv-ink-muted">Network</p>
            <p className="mt-1 text-sm font-medium text-bv-ink">Sepolia</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="mb-8 grid grid-cols-4 gap-4">
          <div className="rounded-xl border border-bv-border bg-bv-surface p-5">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-bv-accent-muted">
                <Database size={18} className="text-bv-accent" />
              </div>
              <span className="text-xs uppercase tracking-wide text-bv-ink-muted">Total Transactions</span>
            </div>
            <div className="text-2xl font-bold text-bv-ink">{logs.length}</div>
          </div>

          <div className="rounded-xl border border-bv-border bg-bv-surface p-5">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-bv-accent-muted">
                <Radio size={18} className="text-bv-accent" />
              </div>
              <span className="text-xs uppercase tracking-wide text-bv-ink-muted">Latest Vote</span>
            </div>
            <div className="text-sm font-bold text-bv-ink">
              {latestLog ? new Date(latestLog.timestamp).toLocaleString() : 'No votes yet'}
            </div>
          </div>

          <div className="rounded-xl border border-bv-border bg-bv-surface p-5">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-bv-accent-muted">
                <FileCode size={18} className="text-bv-accent" />
              </div>
              <span className="text-xs uppercase tracking-wide text-bv-ink-muted">Contract Address</span>
            </div>
            <div className="text-sm font-bold text-bv-accent font-mono">
              {contractAddress ? `${contractAddress.slice(0, 6)}...${contractAddress.slice(-4)}` : 'Not configured'}
            </div>
          </div>

          <div className="rounded-xl border border-bv-border bg-bv-surface p-5">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-bv-accent-muted">
                <ShieldCheck size={18} className="text-bv-accent" />
              </div>
              <span className="text-xs uppercase tracking-wide text-bv-ink-muted">Trace Coverage</span>
            </div>
            <div className="text-sm font-bold text-bv-ink">
              {uniquePositionsWithLogs}/{selectedGroup?.positionCount ?? 0} positions
            </div>
          </div>
        </div>

        <section className="mb-6 rounded-xl border border-white/10 bg-white/[0.02] p-5">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-bv-ink-muted">Selected Election Group</p>
              <h2 className="mt-2 text-lg font-semibold text-bv-ink">
                {selectedGroup?.title ?? 'No election group selected'}
              </h2>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-bv-ink-secondary">
                {selectedGroup ? <Badge variant={statusVariant(selectedGroup.status)} /> : null}
                <span>{selectedGroup?.positionCount ?? 0} positions</span>
                <span>{selectedGroup?.candidateCount ?? 0} candidates</span>
                <span>{uniqueCandidatesWithLogs} candidates with votes</span>
              </div>
            </div>
            {contractAddress && (
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-bv-ink-secondary transition-colors hover:border-bv-accent hover:text-bv-accent"
                onClick={() => window.open(`${explorerBase}/address/${contractAddress}`, '_blank')}
              >
                <ExternalLink size={14} />
                View Contract
              </button>
            )}
          </div>
        </section>

        <div className="mb-5 flex items-center gap-3">
          <select
            className="cursor-pointer appearance-none rounded-lg border border-bv-border bg-bv-surface px-4 py-2.5 text-sm text-bv-ink focus:border-bv-accent focus:outline-none"
            value={selectedGroupId}
            onChange={(e) => setSelectedGroupId(e.target.value)}
          >
            {elections.length === 0 && <option value="">No election groups</option>}
            {elections.map((election) => (
              <option key={election.id} value={election.id}>
                {election.title} ({election.positionCount} position{election.positionCount === 1 ? '' : 's'})
              </option>
            ))}
          </select>

          <div className="relative max-w-xs flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-bv-ink-muted" />
            <input
              type="text"
              placeholder="Search by tx hash..."
              className="w-full rounded-lg border border-bv-border bg-bv-surface py-2.5 pl-9 pr-4 font-mono text-sm text-bv-ink placeholder-bv-ink-muted focus:border-bv-accent focus:outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {search.trim() && (
            <button
              type="button"
              className="rounded-lg border border-bv-border px-3 py-2.5 text-xs text-bv-ink-secondary transition-colors hover:text-bv-ink"
              onClick={() => setSearch('')}
            >
              Clear search
            </button>
          )}
        </div>

        <div className="overflow-hidden rounded-xl border border-bv-border bg-bv-surface">
          {loading ? (
            <div className="p-8 text-center text-sm text-bv-ink-muted">Loading logs...</div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-8 text-center text-sm text-bv-ink-muted">
              {logs.length === 0
                ? 'No blockchain vote transactions have been recorded for this election group yet.'
                : 'No transactions match your search.'}
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-bv-border">
                  {['Tx Hash', 'Position', 'Candidate', 'Timestamp', ''].map((heading) => (
                    <th
                      key={heading}
                      className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-bv-ink-muted"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-bv-border">
                {filteredLogs.map((log) => {
                  const candidate = candidatesById[log.candidateId];
                  const shortHash =
                    log.txHash.length > 14 ? `${log.txHash.slice(0, 10)}...${log.txHash.slice(-4)}` : log.txHash;

                  return (
                    <tr key={log.id} className="group transition-colors hover:bg-bv-surface-hover/50">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm text-bv-accent">{shortHash}</span>
                          <button
                            type="button"
                            className="text-bv-ink-muted opacity-0 transition-all hover:text-bv-accent group-hover:opacity-100"
                            onClick={() => navigator.clipboard.writeText(log.txHash)}
                            title="Copy transaction hash"
                          >
                            <Copy size={12} />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm font-medium text-bv-ink">{log.positionTitle}</td>
                      <td className="px-4 py-4 text-sm font-medium text-bv-ink">
                        {candidate ? candidate.name : 'Unknown candidate'}
                      </td>
                      <td className="px-4 py-4 text-xs text-bv-ink-secondary">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="px-4 py-4">
                        <button
                          type="button"
                          className="flex items-center gap-1 text-xs text-bv-ink-muted transition-colors hover:text-bv-accent"
                          onClick={() => window.open(`${explorerBase}/tx/${log.txHash}`, '_blank')}
                        >
                          <ExternalLink size={13} />
                          Etherscan
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
};

export default BlockchainLogsPage;
