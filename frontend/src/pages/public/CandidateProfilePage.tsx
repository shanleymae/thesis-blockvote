import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  LogIn,
  Sparkles,
  Star,
  User,
  Vote,
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import {
  electionsApi,
  getCandidatePhotoSrc,
  type Candidate,
  type ElectionDetail,
} from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import {
  FALLBACK_BANNER_ACCENT,
  FALLBACK_BANNER_BG,
  rgbToCss,
} from '../../lib/campaignBannerColors';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatLongDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

const CandidateProfilePage = () => {
  const { user, token } = useAuth();
  const { electionId, candidateId } = useParams<{ electionId: string; candidateId: string }>();
  const [election, setElection] = useState<ElectionDetail | null>(null);
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showImage, setShowImage] = useState(true);

  useEffect(() => {
    if (!electionId || !candidateId) return;

    setLoading(true);
    setError(null);

    electionsApi
      .getById(electionId)
      .then((data) => {
        const matchedCandidate = data.candidates.find((item) => item.id === candidateId) ?? null;
        setElection(data);
        setCandidate(matchedCandidate);
        setShowImage(Boolean(matchedCandidate?.photoUrl));
        if (!matchedCandidate) {
          setError('Candidate not found in this election.');
        }
      })
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, [candidateId, electionId]);

  const detailElectionId = election?.groupId ?? electionId ?? election?.id ?? '';
  const electionLink =
    token && user
      ? user.role !== 'VOTER'
        ? `/admin/elections/${detailElectionId}`
        : `/voter/elections/${detailElectionId}`
      : electionId
        ? `/elections/${electionId}`
        : '/elections';
  const allElectionsLink =
    token && user
      ? user.role !== 'VOTER'
        ? '/admin/elections'
        : '/voter/elections'
      : '/elections';

  const ballotNumber = useMemo(() => {
    if (!election?.candidates || !candidate) return null;
    const idx = election.candidates.findIndex((c) => c.id === candidate.id);
    return idx >= 0 ? idx + 1 : null;
  }, [election?.candidates, candidate]);

  const nameLines = useMemo(() => {
    if (!candidate) return { first: '', rest: null as string | null };
    const parts = candidate.name.trim().split(/\s+/).filter(Boolean);
    if (parts.length <= 1) {
      return { first: parts[0]?.toUpperCase() ?? '', rest: null as string | null };
    }
    return {
      first: parts[0].toUpperCase(),
      rest: parts.slice(1).join(' ').toUpperCase(),
    };
  }, [candidate]);

  const taglineRed = useMemo(() => {
    if (!candidate || !election) return '';
    if (nameLines.rest) return nameLines.rest;
    return (
      candidate.credentials?.trim() ||
      election.positionTitle?.trim() ||
      election.title ||
      ''
    );
  }, [candidate, election, nameLines.rest]);

  const bannerBgCss = useMemo(() => {
    if (!candidate) return rgbToCss(null, FALLBACK_BANNER_BG);
    if (
      candidate.bannerBgR != null &&
      candidate.bannerBgG != null &&
      candidate.bannerBgB != null
    ) {
      return rgbToCss(
        { r: candidate.bannerBgR, g: candidate.bannerBgG, b: candidate.bannerBgB },
        FALLBACK_BANNER_BG
      );
    }
    return rgbToCss(null, FALLBACK_BANNER_BG);
  }, [candidate]);

  const bannerAccentCss = useMemo(() => {
    if (!candidate) return rgbToCss(null, FALLBACK_BANNER_ACCENT);
    if (
      candidate.bannerAccentR != null &&
      candidate.bannerAccentG != null &&
      candidate.bannerAccentB != null
    ) {
      return rgbToCss(
        {
          r: candidate.bannerAccentR,
          g: candidate.bannerAccentG,
          b: candidate.bannerAccentB,
        },
        FALLBACK_BANNER_ACCENT
      );
    }
    return rgbToCss(null, FALLBACK_BANNER_ACCENT);
  }, [candidate]);

  return (
    <div className="min-h-screen bg-bv-bg text-bv-ink">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-24 sm:px-6">
        <Link
          to={electionLink}
          className="inline-flex items-center gap-2 text-sm text-bv-ink-secondary transition-colors hover:text-bv-ink"
        >
          <ArrowLeft size={16} />
          Back to election details
        </Link>

        {loading && <p className="mt-8 text-bv-ink-muted">Loading candidate...</p>}

        {!loading && error && (
          <div className="mt-8 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        {!loading && election && candidate && (
          <>
            <section
              className="relative mt-8 overflow-hidden rounded-[28px] border border-white/[0.12] shadow-[0_24px_80px_rgba(0,0,0,0.45)]"
              style={{ backgroundColor: bannerBgCss }}
            >
              {/* Decorative accent field (poster-style) */}
              <div
                className="pointer-events-none absolute -right-[12%] -top-[18%] h-[min(52vw,420px)] w-[min(52vw,420px)] rounded-full opacity-[0.94] blur-[1px]"
                style={{ backgroundColor: bannerAccentCss }}
                aria-hidden
              />
              <div
                className="pointer-events-none absolute -right-[8%] top-[8%] h-[min(48vw,380px)] w-[min(40vw,320px)] rounded-full"
                style={{ backgroundColor: bannerAccentCss, opacity: 0.38 }}
                aria-hidden
              />

              <div className="relative z-[1] px-6 pb-10 pt-8 sm:px-10 sm:pb-12 sm:pt-10 lg:px-12">
                {/* Top row: stars + ballot */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-1 text-[#fbbf24]">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={14} className="fill-[#fbbf24] text-[#fbbf24]" strokeWidth={0} />
                    ))}
                  </div>
                  {ballotNumber != null && (
                    <div
                      className="rounded-md px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-white shadow-md"
                      style={{ backgroundColor: bannerAccentCss }}
                    >
                      Vote #{ballotNumber}
                    </div>
                  )}
                </div>

                <div className="mt-8 grid grid-cols-1 items-start gap-10 lg:grid-cols-[1fr_minmax(240px,340px)] lg:gap-12">
                  {/* Headline stack */}
                  <div className="min-w-0">
                    <p className="font-serif text-sm font-medium tracking-wide text-white/85 md:text-base">
                      <span className="inline-flex items-center gap-2">
                        <Sparkles size={16} className="shrink-0 text-[#fbbf24]" />
                        {election.positionTitle ?? election.title}
                      </span>
                    </p>

                    <h1 className="mt-4 font-sans text-[clamp(2.25rem,6vw,4.25rem)] font-black leading-[0.95] tracking-[-0.04em] text-white">
                      {nameLines.first}
                    </h1>
                    {taglineRed && (
                      <p
                        className="mt-2 font-sans text-[clamp(1.75rem,4.5vw,3.25rem)] font-black leading-tight tracking-[-0.03em]"
                        style={{ color: bannerAccentCss }}
                      >
                        {taglineRed.toUpperCase()}
                      </p>
                    )}

                    {candidate.credentials && nameLines.rest && (
                      <p className="mt-5 max-w-xl text-xs font-semibold uppercase tracking-[0.28em] text-white/70">
                        {candidate.credentials}
                      </p>
                    )}
                  </div>

                  {/* Portrait */}
                  <div className="relative mx-auto w-full max-w-[300px] lg:mx-0 lg:max-w-none lg:justify-self-end">
                    <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl border-4 border-white/15 bg-black/30 shadow-2xl ring-1 ring-white/10">
                      {showImage && getCandidatePhotoSrc(candidate) ? (
                        <img
                          src={getCandidatePhotoSrc(candidate) ?? undefined}
                          alt={candidate.name}
                          className="h-full w-full object-cover object-top grayscale-[25%] contrast-[1.05]"
                          onError={() => setShowImage(false)}
                        />
                      ) : (
                        <div className="flex h-full min-h-[280px] items-center justify-center bg-[#061022]">
                          <div className="flex h-24 w-24 items-center justify-center rounded-3xl border border-white/10 bg-white/[0.06]">
                            <User size={44} className="text-white/35" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom: platform + voting window */}
                <div className="mt-12 grid gap-10 border-t border-white/10 pt-10 lg:grid-cols-[1fr_280px] lg:gap-12">
                  <div className="min-w-0 space-y-6">
                    {(candidate.platform || candidate.description) && (
                      <div>
                        <h2 className="text-xs font-bold uppercase tracking-[0.35em] text-[#fbbf24]">
                          Platform &amp; services
                        </h2>
                        {candidate.platform ? (
                          <p className="mt-4 whitespace-pre-wrap text-base font-medium leading-relaxed text-white/95">
                            {candidate.platform}
                          </p>
                        ) : (
                          <p className="mt-4 text-sm italic text-white/50">
                            No platform statement provided — see the summary below.
                          </p>
                        )}
                      </div>
                    )}
                    {candidate.description && (
                      <div className="rounded-2xl border border-white/10 bg-black/25 p-5 sm:p-6">
                        <h3 className="text-[11px] font-bold uppercase tracking-[0.28em] text-white/50">
                          About
                        </h3>
                        <p className="mt-3 text-sm leading-7 text-white/80">{candidate.description}</p>
                      </div>
                    )}
                    {!candidate.platform && !candidate.description && (
                      <p className="text-sm text-white/55">
                        Campaign details will appear here when administrators add a platform statement or
                        description for this candidate.
                      </p>
                    )}
                  </div>

                  <div className="relative lg:border-l lg:border-white/15 lg:pl-10">
                    <div className="rounded-2xl border border-white/10 bg-black/30 p-6">
                      <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-[#fbbf24]">
                        Voting window
                      </p>
                      <p className="mt-3 font-sans text-lg font-bold leading-snug text-white">
                        {formatLongDate(election.startDate)}
                      </p>
                      <p className="mt-1 text-sm text-white/55">through</p>
                      <p className="mt-1 font-sans text-lg font-bold leading-snug text-white">
                        {formatLongDate(election.endDate)}
                      </p>
                      <div className="mt-5 flex flex-wrap gap-2 text-xs text-white/55">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5">
                          <Calendar size={13} className="text-[#fbbf24]" />
                          {formatDate(election.startDate)} – {formatDate(election.endDate)}
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5">
                          <Vote size={13} className="text-[#fbbf24]" />
                          {election.title}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <div className="mt-8 flex flex-wrap gap-3">
              {token && user ? (
                <Link
                  to={electionLink}
                  className="inline-flex items-center justify-center rounded-xl bg-bv-accent px-5 py-3 text-sm font-semibold text-bv-bg transition-colors hover:bg-bv-accent-hover"
                >
                  Open Election
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-bv-accent px-5 py-3 text-sm font-semibold text-bv-bg transition-colors hover:bg-bv-accent-hover"
                >
                  <LogIn size={15} />
                  Log In To Vote
                </Link>
              )}
              <Link
                to={allElectionsLink}
                className="inline-flex items-center justify-center rounded-xl border border-bv-border bg-bv-bg px-5 py-3 text-sm font-semibold text-bv-ink-secondary transition-colors hover:border-bv-accent/35 hover:text-bv-ink"
              >
                View All Elections
              </Link>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default CandidateProfilePage;
