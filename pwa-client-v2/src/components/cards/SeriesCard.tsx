import Image from 'next/image';
import Link from 'next/link';
import { Package } from 'lucide-react';

import type { Series } from '@/types/volume';

// Hoisted fallback — identique sur chaque render (rendering-hoist-jsx)
const coverFallback = (
  <div className="absolute inset-0 flex items-center justify-center">
    <Package size={32} aria-hidden style={{ color: 'var(--muted-foreground)' }} />
  </div>
);

interface SeriesCardProps {
  series: Series;
  possessedCount: number;
  /** null = total inconnu → on affiche seulement possessedCount */
  totalVolumes: number | null;
  href: string;
  /**
   * Override de cover — utile quand on veut afficher la cover d'une édition
   * plutôt que celle de la série.
   */
  coverUrl?: string | null;
  /** Tomes lus — pour la barre segmentée */
  readCount?: number;
  /** Tomes prêtés — pour la barre segmentée */
  loanedCount?: number;
  /** Précharger l'image — à activer sur les cards du premier fold (LCP) */
  priority?: boolean;
}

export function SeriesCard({
  series,
  possessedCount,
  totalVolumes,
  href,
  coverUrl,
  readCount = 0,
  loanedCount = 0,
  priority = false,
}: SeriesCardProps) {
  const cover = coverUrl ?? series.cover_url;

  const countLabel =
    totalVolumes !== null
      ? `${possessedCount} / ${totalVolumes} vol.`
      : `${possessedCount} vol.`;

  // Segmented bar percentages
  const hasTotal = totalVolumes != null && totalVolumes > 0;
  const readPct    = hasTotal ? Math.min((readCount / totalVolumes!) * 100, 100) : 0;
  const loanedPct  = hasTotal ? Math.min((loanedCount / totalVolumes!) * 100, 100 - readPct) : 0;
  const ownedPct   = hasTotal
    ? Math.min(((possessedCount - readCount - loanedCount) / totalVolumes!) * 100, 100 - readPct - loanedPct)
    : 0;
  const showCaption = (readCount > 0 || loanedCount > 0) && hasTotal;

  return (
    <Link href={href} className="group flex flex-col gap-2">
      {/* Cover — ratio 2:3 */}
      <div
        className="relative overflow-hidden rounded-[calc(var(--radius)*2)] aspect-[2/3] w-full"
        style={{ background: 'var(--muted)' }}
      >
        {cover ? (
          <Image
            src={cover}
            alt={series.title}
            fill
            sizes="(max-width: 480px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
            className="object-cover transition-transform duration-200 group-hover:scale-[1.02]"
            priority={priority}
          />
        ) : (
          coverFallback
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col gap-1.5 px-0.5">
        <p
          className="text-sm font-semibold leading-tight line-clamp-2"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}
        >
          {series.title}
        </p>
        <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
          {countLabel}
        </p>

        {/* Barre segmentée — masquée si total inconnu */}
        {hasTotal && (
          <div
            className="volume-progress overflow-hidden"
            role="progressbar"
            aria-valuenow={Math.min(Math.round((possessedCount / totalVolumes!) * 100), 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${possessedCount} / ${totalVolumes} tomes possédés`}
          >
            {readPct > 0 && (
              <div className="h-full" style={{ width: `${readPct}%`, background: 'var(--color-read)', float: 'left' }} />
            )}
            {loanedPct > 0 && (
              <div className="h-full" style={{ width: `${loanedPct}%`, background: 'var(--color-loaned)', float: 'left' }} />
            )}
            {ownedPct > 0 && (
              <div className="h-full" style={{ width: `${ownedPct}%`, background: 'color-mix(in oklch, var(--primary) 25%, transparent)', float: 'left' }} />
            )}
          </div>
        )}

        {/* Caption lu/prêté — affiché uniquement si données disponibles */}
        {showCaption && (
          <p className="text-[10px] leading-none" style={{ color: 'var(--muted-foreground)' }}>
            {readCount > 0 && <span style={{ color: 'var(--color-read)' }}>{readCount} lu{readCount > 1 ? 's' : ''}</span>}
            {readCount > 0 && loanedCount > 0 && ' · '}
            {loanedCount > 0 && <span style={{ color: 'var(--color-loaned)' }}>{loanedCount} prêté{loanedCount > 1 ? 's' : ''}</span>}
          </p>
        )}
      </div>
    </Link>
  );
}
