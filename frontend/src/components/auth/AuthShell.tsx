import type { ReactNode } from 'react';
import { Box, Search, Shield, Vote } from 'lucide-react';
import { Link } from 'react-router-dom';

type AuthShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
  asideNote?: string;
};

const highlights = [
  { icon: Shield, title: 'Verified access', body: 'Keep identity checks and admin approval visible from the start.' },
  { icon: Vote, title: 'Signed participation', body: 'Connect a wallet once, then move through a cleaner voting flow.' },
  { icon: Search, title: 'Proof after action', body: 'Verification stays available after the election, not just during it.' },
];

export const AuthShell = ({
  eyebrow,
  title,
  description,
  children,
  footer,
  asideNote = 'Blockvote keeps the interface calm so the trust signals stay easy to read.',
}: AuthShellProps) => {
  return (
    <div className="auth-page min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="auth-page__aurora auth-page__aurora--one" aria-hidden="true" />
      <div className="auth-page__aurora auth-page__aurora--two" aria-hidden="true" />

      <div className="auth-shell auth-page-enter mx-auto grid min-h-[calc(100vh-3rem)] max-w-6xl overflow-hidden rounded-[2rem] border border-white/10 lg:grid-cols-[minmax(320px,0.92fr)_minmax(0,1.08fr)]">
        <aside className="auth-shell__aside relative flex flex-col justify-between p-8 sm:p-10">
          <div className="auth-shell__mesh" aria-hidden="true" />

          <div className="relative z-10">
            <Link to="/" className="inline-flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-bv-accent shadow-[0_0_28px_rgba(0,212,200,0.28)]">
                <Box size={18} className="text-bv-bg" />
              </div>
              <span className="text-sm font-semibold tracking-[0.24em] text-white">BLOCKVOTE</span>
            </Link>

            <div className="mt-16 max-w-sm">
              <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-bv-accent">
                {eyebrow}
              </p>
              <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-white sm:text-5xl">
                {title}
              </h1>
              <p className="mt-5 text-sm leading-7 text-bv-ink-secondary sm:text-base">
                {description}
              </p>
            </div>

            <div className="mt-12 space-y-5">
              {highlights.map(({ icon: Icon, title: itemTitle, body }) => (
                <div key={itemTitle} className="flex items-start gap-4">
                  <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-bv-accent">
                    <Icon size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{itemTitle}</p>
                    <p className="mt-1 text-sm leading-6 text-bv-ink-secondary">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="relative z-10 mt-12 max-w-xs text-xs leading-6 text-bv-ink-muted">
            {asideNote}
          </p>
        </aside>

        <section className="auth-shell__form auth-shell__form-scroll flex min-h-full flex-col justify-center px-6 py-8 sm:px-10 sm:py-10 lg:px-12">
          {children}
          {footer ? <div className="mt-6">{footer}</div> : null}
        </section>
      </div>
    </div>
  );
};

type AuthStatusScreenProps = {
  tone?: 'neutral' | 'success' | 'error';
  eyebrow: string;
  title: string;
  description: ReactNode;
  action?: ReactNode;
  note?: string;
  icon?: ReactNode;
};

export const AuthStatusScreen = ({
  tone = 'neutral',
  eyebrow,
  title,
  description,
  action,
  note,
  icon,
}: AuthStatusScreenProps) => {
  return (
    <div className="auth-page min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="auth-page__aurora auth-page__aurora--one" aria-hidden="true" />
      <div className="auth-page__aurora auth-page__aurora--two" aria-hidden="true" />

      <div className="auth-status auth-page-enter mx-auto flex min-h-[calc(100vh-3rem)] max-w-2xl items-center justify-center">
        <div className={`auth-status__panel auth-status__panel--${tone} w-full rounded-[2rem] border border-white/10 px-8 py-10 text-center sm:px-12 sm:py-12`}>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.5rem] border border-white/10 bg-white/[0.05]">
            {icon ?? <Box size={28} className="text-bv-accent" />}
          </div>
          <p className="mt-6 text-[11px] font-medium uppercase tracking-[0.3em] text-bv-accent">
            {eyebrow}
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">
            {title}
          </h1>
          <div className="mx-auto mt-4 max-w-lg text-sm leading-7 text-bv-ink-secondary sm:text-base">
            {description}
          </div>
          {action ? <div className="mt-8 flex justify-center">{action}</div> : null}
          {note ? <p className="mt-5 text-xs text-bv-ink-muted">{note}</p> : null}
        </div>
      </div>
    </div>
  );
};
