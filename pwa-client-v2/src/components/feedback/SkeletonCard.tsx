import { cn } from '@/lib/utils';

// Hoisted — le rendu d'un skeleton individuel ne change jamais (rendering-hoist-jsx)
const volumeSkeleton = (
  <div className="volume-card skeleton" aria-hidden />
);

const seriesSkeleton = (
  <div className="flex flex-col gap-2" aria-hidden>
    {/* Cover 2:3 */}
    <div
      className="skeleton w-full rounded-[calc(var(--radius)*2)]"
      style={{ aspectRatio: '2/3' }}
    />
    {/* Titre */}
    <div className="flex flex-col gap-1.5 px-0.5">
      <div className="skeleton h-3.5 w-4/5 rounded" />
      <div className="skeleton h-3 w-2/5 rounded" />
      {/* Progress bar */}
      <div className="skeleton h-[3px] w-full rounded-full" />
    </div>
  </div>
);

const seriesListRowSkeleton = (
  <div
    className="flex items-center gap-3 py-3 border-b last:border-b-0"
    aria-hidden
    style={{ borderColor: 'var(--border)' }}
  >
    <div className="skeleton shrink-0 w-12 rounded" style={{ aspectRatio: '2/3' }} />
    <div className="flex-1 min-w-0 flex flex-col gap-1.5">
      <div className="skeleton h-3.5 w-3/5 rounded" />
      <div className="skeleton h-3 w-1/4 rounded" />
      <div className="skeleton h-[3px] w-full rounded-full" />
    </div>
  </div>
);

interface SkeletonCardProps {
  /**
   * 'volume' (défaut) — même ratio que VolumeCard (2:3, volume-card class)
   * 'series' — cover 2:3 + placeholders titre/compteur/progressbar
   * 'series-list-row' — ligne liste avec thumbnail 48px + titre + compteur + progress
   */
  variant?: 'volume' | 'series' | 'series-list-row';
  /** Nombre de skeletons à afficher — utile dans VolumeGrid */
  count?: number;
  className?: string;
}

/**
 * SkeletonCard — placeholder shimmer pendant le chargement.
 * Server Component — l'animation est 100% CSS (@keyframes shimmer).
 *
 * Règle REDESIGN : PAS de transition skeleton→contenu animée.
 * Le shimmer s'arrête dès que le vrai composant prend sa place.
 */
export function SkeletonCard({ variant = 'volume', count = 1, className }: SkeletonCardProps) {
  const skeleton = variant === 'series' ? seriesSkeleton
    : variant === 'series-list-row' ? seriesListRowSkeleton
    : volumeSkeleton;

  if (count === 1) {
    return <div className={className}>{skeleton}</div>;
  }

  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={cn(className)} aria-hidden>
          {skeleton}
        </div>
      ))}
    </>
  );
}
