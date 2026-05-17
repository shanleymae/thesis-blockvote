import { useEffect } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  Lock,
  Search,
  ShieldCheck,
  Vote,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import LandingParticles from '../components/landing/LandingParticles';

const proofPoints = [
  {
    label: 'Identity and access',
    title: 'Only verified voters enter the ballot flow.',
    description:
      'Registration, approval, and wallet connection create a tighter chain of custody before a vote is submitted.',
    icon: ShieldCheck,
  },
  {
    label: 'On-chain records',
    title: 'Each vote leaves a receipt you can inspect later.',
    description:
      'Transactions are signed, recorded, and available for public verification without exposing ballot intent in the interface.',
    icon: Vote,
  },
  {
    label: 'Independent verification',
    title: 'Trust is earned through visibility, not promises.',
    description:
      'Receipts, hashes, and published results make it easier to audit what happened after polls close.',
    icon: Search,
  },
];

const systemNotes = [
  {
    title: 'Protected by cryptographic signing',
    description:
      'Every action moves through a wallet-confirmed flow designed to reduce tampering risk.',
    icon: Lock,
  },
  {
    title: 'Observable from registration to result',
    description:
      'Admins, voters, and the public each get a cleaner view into the election lifecycle.',
    icon: Eye,
  },
  {
    title: 'Built for verifiable outcomes',
    description:
      'The platform keeps the final step simple: confirm the vote and inspect the published trail.',
    icon: CheckCircle2,
  },
];

const metrics = [
  { value: 'Wallet-signed', label: 'vote confirmations' },
  { value: 'Immutable', label: 'blockchain receipts' },
  { value: 'Anytime', label: 'public verification' },
];

const LandingPage = () => {
  const { user, token, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading || !token || !user) return;
    navigate(user.role === 'VOTER' ? '/voter/dashboard' : '/admin/dashboard', { replace: true });
  }, [loading, token, user, navigate]);

  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.2, rootMargin: '0px 0px -10% 0px' }
    );

    elements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, []);

  if (loading && token) {
    return (
      <div className="min-h-screen bg-bv-bg text-bv-ink flex items-center justify-center px-8">
        <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-white/5 p-8 text-center shadow-[0_30px_80px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-bv-accent-muted">
            <Vote size={18} className="text-bv-accent" />
          </div>
          <h1 className="mt-4 text-2xl font-semibold">Restoring your session</h1>
          <p className="mt-2 text-sm text-bv-ink-secondary">
            Your saved access is still valid, so Blockvote is taking you back in.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="landing-page min-h-screen overflow-hidden bg-bv-bg text-bv-ink">
      <Navbar />

      <main className="relative">
        <section className="landing-hero relative flex min-h-screen items-center px-6 pb-14 pt-28 sm:px-8 lg:px-12">
          <LandingParticles />
          <div className="landing-hero__aurora" aria-hidden="true" />
          <div className="landing-hero__grid" aria-hidden="true" />

          <div className="relative z-10 mx-auto grid w-full max-w-6xl gap-16 lg:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)] lg:items-end">
            <div className="max-w-3xl">
              <div className="hero-entrance hero-entrance--delay-1 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-[11px] font-medium uppercase tracking-[0.28em] text-bv-ink-secondary backdrop-blur-xl">
                <span className="h-2 w-2 rounded-full bg-bv-accent shadow-[0_0_20px_rgba(0,212,200,0.75)]" />
                Blockvote
              </div>

              <h1 className="hero-entrance hero-entrance--delay-2 mt-8 max-w-4xl text-5xl font-semibold leading-[0.95] tracking-[-0.05em] text-white sm:text-6xl lg:text-[6.8rem]">
                Election trust,
                <br />
                recorded in motion.
              </h1>

              <p className="hero-entrance hero-entrance--delay-3 mt-6 max-w-xl text-base leading-7 text-bv-ink-secondary sm:text-lg">
                A minimal voting experience built around verified access, wallet-signed ballots,
                and public receipts that can be checked long after voting ends.
              </p>

              <div className="hero-entrance hero-entrance--delay-4 mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                <Link to="/register">
                  <Button variant="primary" size="lg" className="min-w-[168px]">
                    Launch Voting
                    <ArrowRight size={16} />
                  </Button>
                </Link>
                <a href="#verification-story">
                  <Button variant="outline" size="lg" className="border-white/[0.12] bg-white/[0.04]">
                    See verification flow
                  </Button>
                </a>
              </div>
            </div>

            <div className="hero-entrance hero-entrance--delay-4 relative">
              <div className="landing-terminal">
                <div className="landing-terminal__topline">
                  <span className="landing-terminal__pill" />
                  <span className="landing-terminal__pill" />
                  <span className="landing-terminal__pill" />
                </div>

                <div className="landing-terminal__section">
                  <p className="landing-terminal__eyebrow">Election record</p>
                  <div className="landing-terminal__row">
                    <span>Status</span>
                    <strong>Verified</strong>
                  </div>
                  <div className="landing-terminal__row">
                    <span>Receipt</span>
                    <strong>0x71...a94e</strong>
                  </div>
                  <div className="landing-terminal__row">
                    <span>Network</span>
                    <strong>Ethereum</strong>
                  </div>
                </div>

                <div className="landing-signal">
                  <div className="landing-signal__line" />
                  <div className="landing-signal__pulse" />
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  {metrics.map((metric) => (
                    <div key={metric.label} className="landing-metric">
                      <div className="text-sm uppercase tracking-[0.24em] text-bv-ink-muted">
                        {metric.label}
                      </div>
                      <div className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-white">
                        {metric.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="relative px-6 py-24 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-6xl">
            <div
              data-reveal
              className="reveal-element grid gap-12 border-y border-white/[0.08] py-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-start"
            >
              <div className="max-w-sm">
                <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-bv-accent">
                  Trust Surface
                </p>
                <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">
                  One calm interface, three proof layers.
                </h2>
              </div>

              <div className="grid gap-10 md:grid-cols-3 md:gap-6">
                {proofPoints.map((point, index) => (
                  <article
                    key={point.title}
                    className="reveal-element"
                    data-reveal
                    style={{ transitionDelay: `${index * 120}ms` }}
                  >
                    <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-bv-accent">
                      <point.icon size={22} />
                    </div>
                    <p className="text-[11px] uppercase tracking-[0.24em] text-bv-ink-muted">
                      {point.label}
                    </p>
                    <h3 className="mt-3 text-xl font-medium tracking-[-0.03em] text-white">
                      {point.title}
                    </h3>
                    <p className="mt-3 max-w-sm text-sm leading-7 text-bv-ink-secondary">
                      {point.description}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section
          id="verification-story"
          className="relative px-6 py-8 sm:px-8 lg:px-12 lg:py-16"
        >
          <div className="mx-auto grid max-w-6xl gap-16 lg:grid-cols-[minmax(280px,0.75fr)_minmax(0,1fr)]">
            <div className="lg:sticky lg:top-28 lg:self-start">
              <div data-reveal className="reveal-element max-w-md">
                <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-bv-accent">
                  Verification Story
                </p>
                <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">
                  The page gets deeper as you scroll, just like the audit trail.
                </h2>
                <p className="mt-5 text-base leading-7 text-bv-ink-secondary">
                  Instead of filling the screen with cards, the layout moves from promise to
                  evidence: verified entry, recorded action, inspectable outcome.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {systemNotes.map((note, index) => (
                <article
                  key={note.title}
                  data-reveal
                  className="reveal-element landing-story-panel"
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-start gap-5">
                    <div className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-bv-accent">
                      <note.icon size={20} />
                    </div>
                    <div>
                      <h3 className="text-xl font-medium tracking-[-0.03em] text-white">
                        {note.title}
                      </h3>
                      <p className="mt-3 max-w-xl text-sm leading-7 text-bv-ink-secondary">
                        {note.description}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="relative px-6 pb-24 pt-20 sm:px-8 lg:px-12">
          <div
            data-reveal
            className="reveal-element landing-cta mx-auto max-w-6xl rounded-[2rem] border border-white/10 px-8 py-12 sm:px-12 sm:py-16"
          >
            <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-bv-accent">
              Start Clean
            </p>
            <div className="mt-5 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <h2 className="text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">
                  Build a voting flow people can inspect, not just trust.
                </h2>
                <p className="mt-4 text-base leading-7 text-bv-ink-secondary">
                  Register voters, run elections, and keep the final experience minimal enough to
                  feel serious.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link to="/register">
                  <Button variant="primary" size="lg" className="min-w-[168px]">
                    Register now
                    <ArrowRight size={16} />
                  </Button>
                </Link>
                <Link to="/elections">
                  <Button variant="outline" size="lg" className="border-white/[0.12] bg-white/[0.04]">
                    Browse elections
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default LandingPage;
