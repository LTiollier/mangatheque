import { memo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Package, ChevronRight } from 'lucide-react';

import type { Series } from '@/types/volume';

// ─── Fallback hoisted — jamais recréé au render (rendering-hoist-jsx) ─────────
const listRowFallback = (
  <div className="absolute inset-0 flex items-center justify-center">
    <Package size={16} aria-hidden style={{ color: 'var(--muted-foreground)' }} />
  </div>
);

interface SeriesListRowProps {
  series:         Series;
  possessedCount: number;
  totalVolumes:   number | null;
  href:           string;
  coverUrl?:      string | null;
  readCount?:     number;
  loanedCount?:   number;
}

// ─── Défini au module level, jamais inline dans le parent (rerender-no-inline-components)
// ─── memo() : évite les re-renders si les props n'ont pas changé (rerender-memo)
export const SeriesListRow = memo(function SeriesListRow({
  series,
  possessedCount,
  totalVolumes,
  href,
  coverUrl,
  readCount   = 0,
  loanedCount = 0,
}: SeriesListRowProps) {
  const cover = coverUrl ?? series.cover_url;

  const countLabel = totalVolumes !== null
    ? `${possessedCount} / ${totalVolumes} vol.`
    : `${possessedCount} vol.`;

  const hasTotal   = totalVolumes != null && totalVolumes > 0;
  const readPct    = hasTotal ? Math.min((readCount / totalVolumes!) * 100, 100) : 0;
  const loanedPct  = hasTotal ? Math.min((loanedCount / totalVolumes!) * 100, 100 - readPct) : 0;
  const ownedPct   = hasTotal
    ? Math.min(((possessedCount - readCount - loanedCount) / totalVolumes!) * 100, 100 - readPct - loanedPct)
    : 0;

  return (
    <Link
      href={href}
      className="flex items-center gap-3 py-3 border-b last:border-b-0 group"
      style={{ borderColor: 'var(--border)' }}
      aria-label={`Voir la série ${series.title} — ${countLabel}`}
    >
      {/* Thumbnail */}
      <div
        className="shrink-0 w-12 relative overflow-hidden"
        style={{ aspectRatio: '2/3', background: 'var(--muted)', borderRadius: 'var(--radius)' }}
      >
        {cover ? (
          <Image src={cover} alt={series.title} fill sizes="48px" className="object-cover" />
        ) : (
          listRowFallback
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-semibold truncate leading-tight"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}
        >
          {series.title}
        </p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
          {countLabel}
        </p>

        {/* Barre segmentée — rendering-conditional-render : ternaire, pas && */}
        {hasTotal ? (
          <div
            className="volume-progress mt-1.5 overflow-hidden"
            role="progressbar"
            aria-valuenow={Math.min(Math.round((possessedCount / totalVolumes!) * 100), 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${possessedCount} / ${totalVolumes} tomes possédés`}
          >
            {readPct   > 0 ? <div className="h-full" style={{ width: `${readPct}%`,   background: 'var(--color-read)',   float: 'left' }} /> : null}
            {loanedPct > 0 ? <div className="h-full" style={{ width: `${loanedPct}%`, background: 'var(--color-loaned)', float: 'left' }} /> : null}
            {ownedPct  > 0 ? <div className="h-full" style={{ width: `${ownedPct}%`,  background: 'color-mix(in oklch, var(--primary) 25%, transparent)', float: 'left' }} /> : null}
          </div>
        ) : null}
      </div>

      {/* Chevron */}
      <ChevronRight
        size={14}
        aria-hidden
        className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ color: 'var(--muted-foreground)' }}
      />
    </Link>
  );
});
