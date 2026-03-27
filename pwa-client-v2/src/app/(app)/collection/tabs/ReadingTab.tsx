'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import { Package } from 'lucide-react';

import { useVolumes, useReadingProgressQuery, useBulkToggleReadingProgress } from '@/hooks/queries';
import { useGroupedCollection } from '@/hooks/useGroupedCollection';
import { useOffline } from '@/contexts/OfflineContext';
import { EmptyState } from '@/components/feedback/EmptyState';
import { CollectionStatBar } from '@/components/collection/CollectionStatBar';
import type { Volume, Series } from '@/types/volume';

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
  volumes: Volume[];
  /** Stable Set reference via useMemo in parent */
  readSet: Set<number>;
}

function SeriesProgressRow({ series, volumes, readSet }: SeriesProgressRowProps) {
  // Per-row mutation — isPending is isolated per series
  const { mutate, isPending } = useBulkToggleReadingProgress();
  const { isOffline } = useOffline();

  const readCount = useMemo(
    () => volumes.filter(v => readSet.has(v.id)).length,
    [volumes, readSet],
  );

  // Total = sum of released count across unique editions; fallback to owned count
  const total = useMemo(() => {
    const now = new Date().toISOString();
    const seen = new Set<number>();
    let sum = 0;
    for (const v of volumes) {
      if (v.edition?.id != null && !seen.has(v.edition.id)) {
        seen.add(v.edition.id);
        const ownedOfThisEdition = volumes.filter(vol => vol.edition?.id === v.edition?.id);
        const futureOwnedOfThisEdition = ownedOfThisEdition.filter(vol => !!(vol.published_date && vol.published_date > now)).length;
        const totalOfEdition = v.edition.released_volumes
          ?? Math.max(0, (v.edition.total_volumes || ownedOfThisEdition.length) - futureOwnedOfThisEdition);
        sum += totalOfEdition;
      }
    }
    return sum || volumes.length;
  }, [volumes]);

  const allRead = readCount === total && total > 0;
  const progress = total > 0 ? Math.round((readCount / total) * 100) : 0;
  const coverUrl = volumes.find(v => v.cover_url)?.cover_url ?? series.cover_url;

  function handleToggle() {
    if (isOffline) return;
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
          className="volume-progress mt-1.5"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${progress}% lus`}
        >
          <div className="volume-progress__fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Toggle button */}
      <button
        type="button"
        onClick={handleToggle}
        disabled={isPending || isOffline}
        className="shrink-0 text-xs font-medium px-3 h-7 transition-opacity disabled:opacity-50"
        style={{
          color: allRead ? 'var(--muted-foreground)' : 'var(--primary)',
          background: allRead
            ? 'var(--secondary)'
            : 'color-mix(in oklch, var(--primary) 15%, transparent)',
          borderRadius: 'var(--radius)',
          border: `1px solid ${allRead
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
  const { data: volumes = [], isLoading: volumesLoading } = useVolumes();
  const { data: readingProgress = [], isLoading: progressLoading } = useReadingProgressQuery();

  const isLoading = volumesLoading || progressLoading;

  // Memoized owned filter (rerender-memo)
  const ownedVolumes = useMemo(() => volumes.filter(m => m.is_owned), [volumes]);

  // Set for O(1) volume_id lookup (js-set-map-lookups) — stable reference between renders
  const readSet = useMemo(
    () => new Set(readingProgress.map(p => p.volume_id)),
    [readingProgress],
  );

  const grouped = useGroupedCollection(ownedVolumes);

  // Volumes count across all acquired editions (at least 1 owned volume)
  // (rerender-derived-state-no-effect)
  const unreadVolumesCount = useMemo(() => {
    const now = new Date().toISOString();
    const acquiredEditions = new Map<number, { total: number, owned: number, futureOwned: number }>();
    
    for (const m of ownedVolumes) {
      if (m.edition?.id != null) {
        const eid = m.edition.id;
        const isFuture = !!(m.published_date && m.published_date > now);
        
        const entry = acquiredEditions.get(eid);
        if (!entry) {
          acquiredEditions.set(eid, {
            total: m.edition.total_volumes ?? 0,
            owned: 1,
            futureOwned: isFuture ? 1 : 0
          });
        } else {
          entry.owned++;
          if (isFuture) entry.futureOwned++;
        }
      }
    }

    let totalVolumesAcrossEditions = 0;
    acquiredEditions.forEach((data) => {
      // Exclude future owned volumes from the total count
      const effectiveTotal = Math.max(0, (data.total || data.owned) - data.futureOwned);
      totalVolumesAcrossEditions += effectiveTotal;
    });

    return Math.max(0, totalVolumesAcrossEditions - readingProgress.length);
  }, [ownedVolumes, readingProgress.length]);

  const completedSeriesCount = useMemo(
    () =>
      grouped
        .filter(gs => gs.series.id > 0)
        .filter(({ volumes }) => {
          if (volumes.length === 0) return false;
          // Sum total_volumes (minus future ones) across unique editions (same as SeriesProgressRow)
          const now = new Date().toISOString();
          const seen = new Set<number>();
          let total = 0;
          for (const v of volumes) {
            if (v.edition?.id != null && !seen.has(v.edition.id)) {
              seen.add(v.edition.id);
              const ownedOfThisEdition = volumes.filter(vol => vol.edition?.id === v.edition?.id);
              const futureOwnedOfThisEdition = ownedOfThisEdition.filter(vol => !!(vol.published_date && vol.published_date > now)).length;
              const totalOfEdition = v.edition.released_volumes
                ?? Math.max(0, (v.edition.total_volumes || ownedOfThisEdition.length) - futureOwnedOfThisEdition);
              total += totalOfEdition;
            }
          }
          if (total === 0) total = volumes.length;
          const readCount = volumes.filter(v => readSet.has(v.id)).length;
          return total > 0 && readCount === total;
        })
        .length,
    [grouped, readSet],
  );

  if (isLoading) return progressSkeletons;

  return (
    <div className="flex flex-col">
      <CollectionStatBar items={[
        { value: readingProgress.length, label: 'Volumes lus' },
        { value: unreadVolumesCount, label: 'Tomes non lus' },
        { value: completedSeriesCount, label: 'Séries finies' },
      ]} />
      {grouped.filter(gs => gs.series.id > 0).length === 0 ? (
        <EmptyState
          context="reading"
          action={{ label: 'Voir la collection', href: '/collection?tab=library' }}
        />
      ) : (
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
      )}
    </div>
  );
}
