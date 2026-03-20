'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import { Package } from 'lucide-react';

import { useMangas, useReadingProgressQuery, useBulkToggleReadingProgress } from '@/hooks/queries';
import { useGroupedCollection } from '@/hooks/useGroupedCollection';
import { EmptyState } from '@/components/feedback/EmptyState';
import type { Manga, Series } from '@/types/manga';

// ─── Skeletons hoisted at module level (rendering-hoist-jsx) ─────────────────

const progressSkeletons = (
  <div className="flex flex-col" aria-busy>
    {Array.from({ length: 5 }, (_, i) => (
      <div
        key={i}
        className="flex items-center gap-3 py-3 border-b last:border-b-0"
        style={{ borderColor: 'var(--border)' }}
        aria-hidden
      >
        <div className="skeleton shrink-0 w-12 rounded" style={{ aspectRatio: '2/3' }} />
        <div className="flex-1 flex flex-col gap-2">
          <div className="skeleton h-4 w-1/2 rounded" />
          <div className="skeleton h-3 w-1/4 rounded" />
          <div className="skeleton h-[3px] w-full rounded-full" />
        </div>
        <div className="skeleton h-7 w-20 rounded" />
      </div>
    ))}
  </div>
);

// ─── SeriesProgressRow — defined outside parent component (rerender-no-inline-components) ─

interface SeriesProgressRowProps {
  series: Series;
  volumes: Manga[];
  /** Stable Set reference via useMemo in parent */
  readSet: Set<number>;
}

function SeriesProgressRow({ series, volumes, readSet }: SeriesProgressRowProps) {
  // Per-row mutation — isPending is isolated per series
  const { mutate, isPending } = useBulkToggleReadingProgress();

  const readCount = useMemo(
    () => volumes.filter(v => readSet.has(v.id)).length,
    [volumes, readSet],
  );

  // Total = sum of total_volumes across unique editions; fallback to owned count
  const total = useMemo(() => {
    const seen = new Set<number>();
    let sum = 0;
    for (const v of volumes) {
      if (v.edition?.id != null && !seen.has(v.edition.id)) {
        seen.add(v.edition.id);
        if (v.edition.total_volumes != null) sum += v.edition.total_volumes;
      }
    }
    return sum || volumes.length;
  }, [volumes]);

  const allRead = readCount === total && total > 0;
  const progress = total > 0 ? Math.round((readCount / total) * 100) : 0;
  const coverUrl = volumes.find(v => v.cover_url)?.cover_url ?? series.cover_url;

  function handleToggle() {
    // All read → unmark all; otherwise → mark only unread volumes
    const targetIds = allRead
      ? volumes.map(v => v.id)
      : volumes.filter(v => !readSet.has(v.id)).map(v => v.id);
    if (targetIds.length > 0) mutate(targetIds);
  }

  return (
    <div
      className="flex items-center gap-3 py-3 border-b last:border-b-0"
      style={{ borderColor: 'var(--border)' }}
    >
      {/* Series cover thumbnail */}
      <div
        className="shrink-0 w-12 relative overflow-hidden"
        style={{
          aspectRatio: '2/3',
          background: 'var(--muted)',
          borderRadius: 'var(--radius)',
        }}
      >
        {coverUrl ? (
          <Image src={coverUrl} alt={series.title} fill sizes="48px" className="object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Package size={16} aria-hidden style={{ color: 'var(--muted-foreground)' }} />
          </div>
        )}
      </div>

      {/* Series info + progress bar */}
      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-semibold truncate leading-tight"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}
        >
          {series.title}
        </p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
          {readCount} / {total} lu{readCount > 1 ? 's' : ''}
        </p>
        <div
          className="manga-progress mt-1.5"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${progress}% lus`}
        >
          <div className="manga-progress__fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Toggle button */}
      <button
        type="button"
        onClick={handleToggle}
        disabled={isPending}
        className="shrink-0 text-xs font-medium px-3 h-7 transition-opacity disabled:opacity-50"
        style={{
          color: allRead ? 'var(--muted-foreground)' : 'var(--primary)',
          background: allRead
            ? 'var(--secondary)'
            : 'color-mix(in oklch, var(--primary) 15%, transparent)',
          borderRadius: 'var(--radius)',
          border: `1px solid ${
            allRead
              ? 'var(--border)'
              : 'color-mix(in oklch, var(--primary) 30%, transparent)'
          }`,
        }}
        aria-label={
          allRead
            ? `Démarquer toute la série ${series.title}`
            : `Marquer toute la série ${series.title} comme lue`
        }
      >
        {allRead ? 'Démarquer' : 'Tout lire'}
      </button>
    </div>
  );
}

// ─── ReadingTab ───────────────────────────────────────────────────────────────

export function ReadingTab() {
  const { data: mangas = [], isLoading: mangasLoading } = useMangas();
  const { data: readingProgress = [], isLoading: progressLoading } = useReadingProgressQuery();

  const isLoading = mangasLoading || progressLoading;

  // Memoized owned filter (rerender-memo)
  const ownedMangas = useMemo(() => mangas.filter(m => m.is_owned), [mangas]);

  // Set for O(1) volume_id lookup (js-set-map-lookups) — stable reference between renders
  const readSet = useMemo(
    () => new Set(readingProgress.map(p => p.volume_id)),
    [readingProgress],
  );

  const grouped = useGroupedCollection(ownedMangas);

  if (isLoading) return progressSkeletons;

  if (grouped.filter(gs => gs.series.id > 0).length === 0) {
    return (
      <EmptyState
        context="reading"
        action={{ label: 'Voir la collection', href: '/collection?tab=library' }}
      />
    );
  }

  return (
    <div>
      {grouped
        .filter(gs => gs.series.id > 0)
        .map(({ series, volumes }) => (
          <SeriesProgressRow
            key={series.id}
            series={series}
            volumes={volumes}
            readSet={readSet}
          />
        ))}
    </div>
  );
}
