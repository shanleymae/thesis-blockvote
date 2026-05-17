import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BadgeCheck, Trophy, User } from 'lucide-react';
import { getCandidatePhotoSrc } from '../../api/client';

interface CandidateCardProps {
  id: string;
  electionId: string;
  name: string;
  description?: string | null;
  credentials?: string | null;
  photoUrl?: string | null;
  selected?: boolean;
  onSelect?: (id: string) => void;
  profileHref?: string;
  highlightLabel?: string | null;
  voteLabel?: string;
  disabled?: boolean;
  hideVoteButton?: boolean;
  size?: 'default' | 'compact';
}

const CandidateCard: React.FC<CandidateCardProps> = ({
  id,
  electionId,
  name,
  description,
  credentials,
  photoUrl,
  selected = false,
  onSelect,
  profileHref,
  highlightLabel,
  voteLabel = 'I Vote For This',
  disabled = false,
  hideVoteButton = false,
  size = 'default',
}) => {
  const [showImage, setShowImage] = useState(Boolean(photoUrl));
  const photoSrc = photoUrl ? getCandidatePhotoSrc({ id, electionId, photoUrl }) : null;
  const isCompact = size === 'compact';

  useEffect(() => {
    setShowImage(Boolean(photoUrl));
  }, [photoUrl]);

  const imageBlock = showImage && photoSrc ? (
    <img
      src={photoSrc}
      alt={name}
      className={`w-full object-cover object-top ${isCompact ? 'h-full' : 'aspect-[4/3]'}`}
      onError={() => setShowImage(false)}
    />
  ) : (
    <div className={`flex w-full items-center justify-center bg-bv-bg-deep ${isCompact ? 'h-full' : 'aspect-[4/3]'}`}>
      <div className={`flex items-center justify-center rounded-2xl border border-bv-border bg-bv-surface ${isCompact ? 'h-12 w-12' : 'h-16 w-16'}`}>
        <User size={isCompact ? 22 : 30} className="text-bv-ink-muted" />
      </div>
    </div>
  );

  if (isCompact) {
    return (
      <article
        className={`relative overflow-hidden rounded-[22px] border p-3 transition-all duration-200 ${
          selected
            ? 'border-bv-accent bg-bv-surface-hover shadow-[0_0_0_1px_rgba(0,212,200,0.14)]'
            : 'border-bv-border bg-bv-surface hover:border-bv-accent/35'
        }`}
      >
        <div className={`absolute inset-x-0 top-0 h-px ${selected ? 'bg-bv-accent' : 'bg-transparent'}`} />
        {highlightLabel && (
          <div className="absolute right-3 top-3 rounded-full border border-bv-accent/25 bg-bv-accent-muted px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-bv-accent">
            {highlightLabel}
          </div>
        )}

        <div className="flex gap-3">
          <div className="h-28 w-24 overflow-hidden rounded-[16px] border border-bv-border bg-bv-bg flex-shrink-0">
            {imageBlock}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-bv-ink-muted">
                  Candidate
                </p>
                <h4 className="mt-1 text-base font-bold leading-tight text-bv-ink">
                  {name}
                </h4>
              </div>
              <div
                className={`mt-0.5 flex h-6 w-6 items-center justify-center rounded-full border transition-colors ${
                  selected
                    ? 'border-bv-accent bg-bv-accent-muted text-bv-accent'
                    : 'border-bv-border text-transparent'
                }`}
              >
                <BadgeCheck size={14} />
              </div>
            </div>

            {credentials && (
              <p className="mt-2 inline-flex max-w-full rounded-full border border-bv-accent/20 bg-bv-accent-muted px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-bv-accent">
                <span className="truncate">{credentials}</span>
              </p>
            )}

            <p className="mt-2 line-clamp-3 text-[13px] leading-5 text-bv-ink-secondary">
              {description || 'Candidate profile coming soon.'}
            </p>

            <div className="mt-3 grid grid-cols-2 gap-2">
              {profileHref ? (
                <Link
                  to={profileHref}
                  className="flex h-9 items-center justify-center rounded-xl border border-bv-border bg-bv-bg px-3 text-[12px] font-semibold text-bv-ink-secondary transition-colors hover:border-bv-accent/35 hover:text-bv-ink"
                >
                  View Profile
                </Link>
              ) : (
                <div className="flex h-9 items-center justify-center rounded-xl border border-bv-border bg-bv-bg px-3 text-[12px] font-semibold text-bv-ink-muted">
                  View Profile
                </div>
              )}

              {!hideVoteButton && (
                <button
                  type="button"
                  onClick={() => onSelect?.(id)}
                  disabled={disabled}
                  className={`flex h-9 items-center justify-center rounded-xl px-3 text-[12px] font-semibold transition-colors ${
                    selected
                      ? 'border border-bv-accent/20 bg-bv-accent-muted text-bv-accent'
                      : 'bg-bv-accent text-bv-bg hover:bg-bv-accent-hover'
                  } ${disabled ? 'cursor-not-allowed opacity-55' : ''}`}
                >
                  {selected ? 'Selected' : voteLabel}
                </button>
              )}
            </div>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article
      className={`relative overflow-hidden rounded-[24px] border transition-all duration-200 ${
        selected
          ? 'border-bv-accent bg-bv-surface-hover shadow-[0_0_0_1px_rgba(0,212,200,0.14)]'
          : 'border-bv-border bg-bv-surface hover:border-bv-accent/35'
      } ${isCompact ? 'p-3' : 'p-4'}`}
    >
      <div className={`absolute inset-x-0 top-0 h-px ${selected ? 'bg-bv-accent' : 'bg-transparent'}`} />
      {highlightLabel && (
        <div className="absolute left-4 top-0 -translate-y-1/2 rounded-full border border-bv-accent/30 bg-bv-accent-muted px-3 py-1 text-[11px] font-semibold text-bv-accent shadow-sm">
          <span className="inline-flex items-center gap-1">
            <Trophy size={12} />
            {highlightLabel}
          </span>
        </div>
      )}

      <div className="overflow-hidden rounded-[18px] border border-bv-border bg-bv-bg">{imageBlock}</div>

      <div className={`px-1 ${isCompact ? 'pt-3' : 'pt-4'}`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-bv-ink-muted">
              Candidate
            </p>
            <h4 className={`mt-2 font-bold leading-tight text-bv-ink ${isCompact ? 'text-lg' : 'text-xl'}`}>
              {name}
            </h4>
          </div>
          <div
            className={`mt-0.5 flex h-6 w-6 items-center justify-center rounded-full border transition-colors ${
              selected
                ? 'border-bv-accent bg-bv-accent-muted text-bv-accent'
                : 'border-bv-border text-transparent'
            }`}
          >
            <BadgeCheck size={14} />
          </div>
        </div>
        {credentials && (
          <p className={`font-semibold uppercase tracking-[0.18em] text-bv-accent ${isCompact ? 'mt-2 text-[11px]' : 'mt-3 text-[12px]'}`}>
            {credentials}
          </p>
        )}
        <p className={`text-bv-ink-secondary ${isCompact ? 'mt-2 min-h-[44px] text-[13px] leading-5 line-clamp-2' : 'mt-3 min-h-[60px] text-sm leading-6'}`}>
          {description || 'Candidate profile coming soon.'}
        </p>
      </div>

      <div className={`${isCompact ? 'mt-4 space-y-2' : 'mt-5 space-y-3'}`}>
        {profileHref ? (
          <Link
            to={profileHref}
            className={`flex items-center justify-center rounded-xl border border-bv-border bg-bv-bg px-4 font-semibold text-bv-ink-secondary transition-colors hover:border-bv-accent/35 hover:text-bv-ink ${isCompact ? 'h-10 text-[13px]' : 'h-11 text-sm'}`}
          >
            View Candidate
          </Link>
        ) : (
          <div className={`flex items-center justify-center rounded-xl border border-bv-border bg-bv-bg px-4 font-semibold text-bv-ink-muted ${isCompact ? 'h-10 text-[13px]' : 'h-11 text-sm'}`}>
            View Candidate
          </div>
        )}
        {!hideVoteButton && (
          <button
            type="button"
            onClick={() => onSelect?.(id)}
            disabled={disabled}
            className={`flex w-full items-center justify-center rounded-xl px-4 font-semibold transition-colors ${
              selected
                ? 'bg-bv-accent-muted text-bv-accent border border-bv-accent/20'
                : 'bg-bv-accent text-bv-bg hover:bg-bv-accent-hover'
            } ${isCompact ? 'h-10 text-[13px]' : 'h-11 text-sm'} ${disabled ? 'cursor-not-allowed opacity-55' : ''}`}
          >
            {selected ? 'Selected' : voteLabel}
          </button>
        )}
      </div>
    </article>
  );
};

export default CandidateCard;
