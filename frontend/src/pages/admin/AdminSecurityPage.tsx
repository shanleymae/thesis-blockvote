import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  FileText,
  Info,
  KeyRound,
  LockKeyhole,
  MailCheck,
  ShieldCheck,
  UserCheck,
  Wallet,
} from 'lucide-react';
import Sidebar from '../../components/layout/Sidebar';
import { useAuth } from '../../context/AuthContext';
import { formatRoleLabel } from '../../lib/roleLabels';
import { ROLE_TRANSPARENCY_CARDS } from '../../content/roleTransparency';

const controls = [
  {
    icon: MailCheck,
    title: 'Email Verification',
    status: 'Enabled',
    description: 'New accounts must verify their email before they can sign in and continue through the voter workflow.',
    evidence: 'Registration and login flow',
  },
  {
    icon: Wallet,
    title: 'Wallet Binding',
    status: 'Enabled',
    description: 'Each voter account is tied to a wallet address used for wallet login and vote transaction signing.',
    evidence: 'Registration, profile, and voting flow',
  },
  {
    icon: UserCheck,
    title: 'Admin Voter Approval',
    status: 'Enabled',
    description: 'Voters remain pending until an administrator approves them. Only approved voters can cast votes.',
    evidence: 'Admin voters queue',
  },
  {
    icon: CheckCircle2,
    title: 'One Vote Enforcement',
    status: 'Enabled',
    description: 'The system checks recorded votes and the smart contract before accepting another vote for the same election position.',
    evidence: 'Voting service and smart contract checks',
  },
  {
    icon: KeyRound,
    title: 'JWT Protected Routes',
    status: 'Enabled',
    description: 'Admin and voter APIs require an authenticated token, and role guards separate administrator and voter pages.',
    evidence: 'Auth middleware and route guards',
  },
  {
    icon: FileText,
    title: 'Receipt And Audit Trail',
    status: 'Enabled',
    description: 'Each saved vote includes a transaction hash, receipt view, and public verification path for audit review.',
    evidence: 'Receipts, verify page, and logs',
  },
  {
    icon: ShieldCheck,
    title: 'Blockchain Verification',
    status: 'Enabled',
    description: 'Vote transactions can be opened on Etherscan and compared against the stored receipt metadata.',
    evidence: 'Blockchain monitoring page',
  },
  {
    icon: LockKeyhole,
    title: 'Scoped Election Access',
    status: 'Enabled',
    description: 'Organization elections are restricted to voters and administrators within the assigned organization scope.',
    evidence: 'Election group access logic',
  },
];

const operationalChecks = [
  'Keep backend JWT secret and wallet private key outside shared repositories.',
  'Rotate exposed development secrets before public deployment or submission sharing.',
  'Confirm the frontend contract address matches the backend contract address.',
  'Run a demo vote and verify the transaction hash before presentation.',
  'Review pending voters before each active election starts.',
];

export default function AdminSecurityPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-bv-bg flex">
      <Sidebar variant="admin" />

      <main className="ml-56 flex-1 overflow-y-auto px-10 py-8">
        <div className="mb-8 flex items-end justify-between border-b border-white/10 pb-5">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-bv-ink-muted">Security Controls</p>
            <h1 className="mt-1 text-2xl font-semibold text-bv-ink">System Protection Overview</h1>
            <p className="mt-1 max-w-3xl text-sm text-bv-ink-secondary">
              Review the identity, access, voting, and audit safeguards currently implemented in Blockvote.
            </p>
          </div>
          <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-right">
            <p className="text-xs uppercase tracking-wide text-emerald-300">Controls</p>
            <p className="mt-1 text-sm font-semibold text-emerald-200">{controls.length} enabled</p>
          </div>
        </div>

        <section className="mb-10 rounded-xl border border-white/10 bg-white/[0.02] p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="flex gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-bv-accent">
                <Info size={20} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-bv-ink">Role transparency</h2>
                <p className="mt-1 max-w-3xl text-sm leading-7 text-bv-ink-secondary">
                  Super Admin, Admin, and Voter are separate privilege levels. The backend enforces what each role can
                  see and change so responsibilities stay clear for security and accountability.
                </p>
              </div>
            </div>
            {user && (
              <div className="rounded-xl border border-bv-accent/20 bg-bv-accent-muted/15 px-4 py-3 text-sm md:text-right">
                <p className="text-[11px] uppercase tracking-[0.18em] text-bv-ink-muted">Your session</p>
                <p className="mt-1 font-medium text-bv-ink">
                  Signed in as <span className="text-bv-accent">{formatRoleLabel(user.role)}</span>
                </p>
                {user.role === 'ADMIN' && (
                  <p className="mt-1 text-xs text-bv-ink-secondary">Organization-scoped admin access.</p>
                )}
                {user.role === 'SUPERADMIN' && (
                  <p className="mt-1 text-xs text-bv-ink-secondary">Full role-assignment and cross-org management.</p>
                )}
              </div>
            )}
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {ROLE_TRANSPARENCY_CARDS.map(({ id, title, icon: Icon, borderClass, iconWrapClass, bullets }) => (
              <article
                key={id}
                className={`flex flex-col rounded-xl border bg-black/20 p-5 ${borderClass}`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl border ${iconWrapClass}`}
                  >
                    <Icon size={18} />
                  </div>
                  <h3 className="text-base font-semibold text-bv-ink">{title}</h3>
                </div>
                <ul className="mt-4 list-disc space-y-2.5 pl-4 text-sm leading-6 text-bv-ink-secondary">
                  {bullets.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="mb-8 grid grid-cols-1 gap-4 xl:grid-cols-2">
          {controls.map(({ icon: Icon, title, status, description, evidence }) => (
            <article key={title} className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-bv-accent">
                  <Icon size={19} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-base font-semibold text-bv-ink">{title}</h2>
                    <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-[11px] font-medium text-emerald-300 ring-1 ring-inset ring-emerald-500/20">
                      {status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-7 text-bv-ink-secondary">{description}</p>
                  <p className="mt-3 text-xs uppercase tracking-[0.18em] text-bv-ink-muted">{evidence}</p>
                </div>
              </div>
            </article>
          ))}
        </section>

        <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
            <h2 className="text-lg font-semibold text-bv-ink">Operational Checklist</h2>
            <div className="mt-5 space-y-3">
              {operationalChecks.map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-xl border border-white/10 bg-black/20 px-4 py-3">
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-bv-accent" />
                  <p className="text-sm leading-6 text-bv-ink-secondary">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <aside className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
            <h2 className="text-lg font-semibold text-bv-ink">Review Areas</h2>
            <div className="mt-5 space-y-3">
              <Link
                to="/admin/voters"
                className="block rounded-xl border border-white/10 px-4 py-3 text-sm text-bv-ink-secondary transition-colors hover:border-bv-accent hover:text-bv-accent"
              >
                Voter approvals
              </Link>
              <Link
                to="/admin/logs"
                className="block rounded-xl border border-white/10 px-4 py-3 text-sm text-bv-ink-secondary transition-colors hover:border-bv-accent hover:text-bv-accent"
              >
                Blockchain audit logs
              </Link>
              <Link
                to="/admin/reports"
                className="block rounded-xl border border-white/10 px-4 py-3 text-sm text-bv-ink-secondary transition-colors hover:border-bv-accent hover:text-bv-accent"
              >
                System reports
              </Link>
              <Link
                to="/verify"
                className="block rounded-xl border border-white/10 px-4 py-3 text-sm text-bv-ink-secondary transition-colors hover:border-bv-accent hover:text-bv-accent"
              >
                Public verification
              </Link>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}
