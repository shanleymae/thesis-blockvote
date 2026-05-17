import { useEffect, useMemo, useState } from 'react';
import { CheckCircle, Copy, ExternalLink, Download, Receipt, Shield, Clock3 } from 'lucide-react';
import jsPDF from 'jspdf';
import { Link, useSearchParams } from 'react-router-dom';
import Sidebar from '../../components/layout/Sidebar';
import Button from '../../components/ui/Button';
import { votesApi } from '../../api/client';
import { notifyError, notifySuccess } from '../../lib/toast';

function formatDateTime(value: string) {
  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatHash(hash: string) {
  return hash.length > 18 ? `${hash.slice(0, 10)}...${hash.slice(-6)}` : hash;
}

type VoteReceipt = {
  id: string
  txHash: string
  createdAt: string
  election: { id: string; title: string; positionTitle?: string | null; group?: { id: string; title: string } | null }
  candidate: { id: string; name: string }
}

function getReceiptElectionTitle(receipt: VoteReceipt) {
  return receipt.election.group?.title ?? receipt.election.title
}

function getReceiptPositionTitle(receipt: VoteReceipt) {
  return receipt.election.positionTitle ?? (receipt.election.group ? receipt.election.title : null)
}

const ReceiptPage = () => {
  const [searchParams] = useSearchParams()
  const txFromQuery = searchParams.get('tx') ?? ''

  const [receipts, setReceipts] = useState<VoteReceipt[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const latestReceipt = useMemo(
    () => receipts.find((receipt) => receipt.txHash === txFromQuery) ?? receipts[0] ?? null,
    [receipts, txFromQuery]
  )

  const copiedHash = async (hash: string) => {
    await navigator.clipboard.writeText(hash)
    notifySuccess('Transaction hash copied.')
  }

  const downloadReceiptPdf = (receipt: VoteReceipt) => {
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      })

      const left = 20
      let top = 24

      pdf.setFillColor(7, 10, 18)
      pdf.rect(0, 0, 210, 297, 'F')

      pdf.setDrawColor(42, 48, 66)
      pdf.setFillColor(17, 22, 32)
      pdf.roundedRect(14, 16, 182, 118, 6, 6, 'FD')

      pdf.setTextColor(0, 212, 200)
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(10)
      pdf.text('BLOCKVOTE RECEIPT', left, top)

      top += 10
      pdf.setTextColor(245, 247, 250)
      pdf.setFontSize(22)
      pdf.text('Vote Receipt', left, top)

      top += 8
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(11)
      pdf.setTextColor(164, 174, 196)
      pdf.text('This receipt confirms that your ballot was recorded on-chain.', left, top)

      top += 16
      const rows: Array<[string, string]> = [
        ['Election', getReceiptElectionTitle(receipt)],
        ...(getReceiptPositionTitle(receipt) ? ([['Position', getReceiptPositionTitle(receipt)!]] as Array<[string, string]>) : []),
        ['Candidate', receipt.candidate.name],
        ['Recorded', formatDateTime(receipt.createdAt)],
        ['Transaction Hash', receipt.txHash],
      ]

      rows.forEach(([label, value]) => {
        pdf.setDrawColor(42, 48, 66)
        pdf.line(left, top + 2, 188, top + 2)

        pdf.setFont('helvetica', 'bold')
        pdf.setFontSize(10)
        pdf.setTextColor(0, 212, 200)
        pdf.text(label.toUpperCase(), left, top + 10)

        pdf.setFont('helvetica', 'normal')
        pdf.setFontSize(12)
        pdf.setTextColor(245, 247, 250)
        const wrapped = pdf.splitTextToSize(value, 132)
        pdf.text(wrapped, 72, top + 10)
        top += Math.max(16, wrapped.length * 6 + 6)
      })

      pdf.setDrawColor(42, 48, 66)
      pdf.line(left, top + 4, 188, top + 4)

      top += 18
      pdf.setFont('helvetica', 'italic')
      pdf.setFontSize(10)
      pdf.setTextColor(164, 174, 196)
      pdf.text('Use the transaction hash to verify this vote at any time.', left, top)

      const safeElection = getReceiptElectionTitle(receipt).replace(/[^a-z0-9]+/gi, '-').toLowerCase()
      pdf.save(`blockvote-receipt-${safeElection || 'vote'}.pdf`)
      notifySuccess('Receipt PDF downloaded.')
    } catch (error) {
      notifyError(error instanceof Error ? error.message : 'Failed to download receipt PDF.')
    }
  }

  useEffect(() => {
    const loadAll = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await votesApi.myVotes()
        setReceipts(res)
      } catch (e) {
        setError((e as Error).message)
      } finally {
        setLoading(false)
      }
    }
    loadAll()
  }, [])

  return (
    <div className="min-h-screen bg-bv-bg flex">
      <Sidebar variant="voter" />

      <main className="ml-56 flex-1 overflow-y-auto p-8">
        <div className="mx-auto w-full max-w-6xl">
          <div className="mb-8 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-green-400">
                <CheckCircle size={14} />
                Vote Recorded
              </div>
              <h1 className="text-3xl font-bold text-bv-ink">My Vote Receipts</h1>
              <p className="mt-2 max-w-2xl text-sm text-bv-ink-secondary">
                Review every vote you have cast, copy transaction hashes, and open the blockchain proof for each recorded ballot.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 xl:min-w-[480px]">
              <div className="rounded-2xl border border-bv-border bg-bv-surface px-4 py-4">
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-bv-ink-muted">
                  <Receipt size={14} className="text-bv-accent" />
                  Total Receipts
                </div>
                <p className="mt-3 text-2xl font-bold text-bv-ink">{receipts.length}</p>
              </div>
              <div className="rounded-2xl border border-bv-border bg-bv-surface px-4 py-4">
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-bv-ink-muted">
                  <Shield size={14} className="text-bv-accent" />
                  Latest Election
                </div>
                <p className="mt-3 truncate text-sm font-semibold text-bv-ink">
                  {latestReceipt ? getReceiptElectionTitle(latestReceipt) : 'No votes yet'}
                </p>
              </div>
              <div className="rounded-2xl border border-bv-border bg-bv-surface px-4 py-4">
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-bv-ink-muted">
                  <Clock3 size={14} className="text-bv-accent" />
                  Last Recorded
                </div>
                <p className="mt-3 text-sm font-semibold text-bv-ink">
                  {latestReceipt ? formatDateTime(latestReceipt.createdAt) : 'No activity'}
                </p>
              </div>
            </div>
          </div>

          <div className="mb-5 flex flex-col gap-3 lg:flex-row">
            <Link to="/voter/verify" className="lg:w-auto">
              <Button variant="primary">
                Verify My Vote
              </Button>
            </Link>
            <Link to="/voter/elections" className="lg:w-auto">
              <Button variant="outline">
                Back to Elections
              </Button>
            </Link>
          </div>

          <section className="overflow-hidden rounded-[26px] border border-bv-border bg-bv-surface">
            <div className="border-b border-bv-border px-6 py-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-bv-accent">
                    Receipt Ledger
                  </p>
                  <h2 className="mt-2 text-xl font-bold text-bv-ink">Recorded Votes</h2>
                </div>
                <p className="max-w-xl text-sm text-bv-ink-secondary">
                  Every row represents one submitted ballot with its election, selected candidate, recording time, and blockchain transaction hash.
                </p>
              </div>
            </div>

            <div className="hidden grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)_180px_minmax(0,1.3fr)_170px] gap-4 border-b border-bv-border bg-bv-bg/55 px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-bv-ink-muted lg:grid">
              <span>Election</span>
              <span>Candidate</span>
              <span>Recorded</span>
              <span>Transaction</span>
              <span className="text-right">Actions</span>
            </div>

            {loading && (
              <div className="px-6 py-12 text-center text-sm text-bv-ink-muted">
                Loading your receipts...
              </div>
            )}
            {error && (
              <div className="px-6 py-12 text-center text-sm text-red-400">
                {error}
              </div>
            )}
            {!loading && !error && receipts.length === 0 && (
              <div className="px-6 py-14 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-bv-border bg-bv-bg">
                  <Receipt size={22} className="text-bv-ink-muted" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-bv-ink">No vote receipts yet</h3>
                <p className="mt-2 text-sm text-bv-ink-secondary">
                  Once you cast a vote, the receipt will appear here as a permanent ledger entry.
                </p>
              </div>
            )}
            {!loading && !error && receipts.length > 0 && (
              <div className="divide-y divide-bv-border">
                {receipts.map((r) => {
                  const isLatest = txFromQuery ? r.txHash === txFromQuery : r.id === receipts[0]?.id
                  return (
                    <div
                      key={r.id}
                      className={`px-6 py-5 transition-colors hover:bg-bv-bg/45 ${
                        isLatest ? 'bg-bv-accent/5' : ''
                      }`}
                    >
                      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)_180px_minmax(0,1.3fr)_170px] lg:items-center lg:gap-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            {isLatest && (
                              <span className="rounded-full border border-green-500/20 bg-green-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-green-400">
                                Latest
                              </span>
                            )}
                            <span className="text-[11px] uppercase tracking-[0.16em] text-bv-ink-muted lg:hidden">
                              Election
                            </span>
                          </div>
                          <p className="mt-2 truncate text-sm font-semibold text-bv-ink">
                            {getReceiptElectionTitle(r)}
                          </p>
                          {getReceiptPositionTitle(r) && (
                            <p className="mt-1 truncate text-xs text-bv-ink-secondary">
                              {getReceiptPositionTitle(r)}
                            </p>
                          )}
                        </div>

                        <div className="min-w-0">
                          <span className="text-[11px] uppercase tracking-[0.16em] text-bv-ink-muted lg:hidden">
                            Candidate
                          </span>
                          <p className="mt-1 text-sm text-bv-ink-secondary lg:mt-0">
                            {r.candidate.name}
                          </p>
                        </div>

                        <div>
                          <span className="text-[11px] uppercase tracking-[0.16em] text-bv-ink-muted lg:hidden">
                            Recorded
                          </span>
                          <p className="mt-1 text-sm text-bv-ink-secondary lg:mt-0">
                            {formatDateTime(r.createdAt)}
                          </p>
                        </div>

                        <div className="min-w-0">
                          <span className="text-[11px] uppercase tracking-[0.16em] text-bv-ink-muted lg:hidden">
                            Transaction
                          </span>
                          <div className="mt-1 flex items-center gap-2 lg:mt-0">
                            <span className="truncate font-mono text-xs text-bv-accent">
                              {formatHash(r.txHash)}
                            </span>
                            <button
                              type="button"
                              className="text-bv-ink-muted transition-colors hover:text-bv-accent"
                              onClick={() => copiedHash(r.txHash)}
                              title="Copy transaction hash"
                            >
                              <Copy size={13} />
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 lg:justify-end">
                          <button
                            type="button"
                            className="inline-flex h-9 items-center gap-1 rounded-xl border border-bv-border px-3 text-xs font-medium text-bv-ink-secondary transition-colors hover:border-bv-accent hover:text-bv-accent"
                            onClick={() => downloadReceiptPdf(r)}
                          >
                            <Download size={13} />
                            PDF
                          </button>
                          <button
                            type="button"
                            className="inline-flex h-9 items-center gap-1 rounded-xl border border-bv-border px-3 text-xs font-medium text-bv-ink-secondary transition-colors hover:border-bv-accent hover:text-bv-accent"
                            onClick={() => copiedHash(r.txHash)}
                          >
                            <Copy size={13} />
                            Copy
                          </button>
                          <button
                            type="button"
                            className="inline-flex h-9 items-center gap-1 rounded-xl border border-bv-border px-3 text-xs font-medium text-bv-ink-secondary transition-colors hover:border-bv-accent hover:text-bv-accent"
                            onClick={() =>
                              window.open(`https://sepolia.etherscan.io/tx/${r.txHash}`, '_blank')
                            }
                          >
                            <ExternalLink size={13} />
                            View
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )} 
          </section>

          <div className="mt-5 flex items-start gap-2 rounded-2xl border border-bv-border bg-bv-surface px-4 py-4">
            <div className="w-1 h-1 rounded-full bg-bv-accent mt-2 flex-shrink-0" />
            <p className="text-sm leading-relaxed text-bv-ink-secondary">
              Keep your transaction hash for independent verification at any time. Each receipt row is a permanent record of a submitted ballot and can be checked directly on-chain.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ReceiptPage;
