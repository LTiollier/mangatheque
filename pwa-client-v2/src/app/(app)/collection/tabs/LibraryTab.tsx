'use client';

import { useMemo, useState, useDeferredValue } from 'react';

import { useVolumes, useReadingProgressQuery, useLoansQuery } from '@/hooks/queries';
import { useGroupedCollection } from '@/hooks/useGroupedCollection';
import { SeriesCard } from '@/components/cards/SeriesCard';
import { SearchBar } from '@/components/forms/SearchBar';
import { SkeletonCard } from '@/components/feedback/SkeletonCard';
import { EmptyState } from '@/components/feedback/EmptyState';
import { CollectionStatBar, collectionStatBarSkeleton } from '@/components/collection/CollectionStatBar';

export function LibraryTab() {
  const { data: volumes = [], isLoading } = useVolumes();
  const { data: readingProgress = [] } = useReadingProgressQuery();
  const { data: loans = [] } = useLoansQuery();
  const [search, setSearch] = useState('');

  // Memoized owned filter — avoids recreating the array on every keystroke (rerender-memo)
  const ownedVolumes = useMemo(() => volumes.filter(m => m.is_owned), [volumes]);

  // Series count — Set for O(1) dedup (js-set-map-lookups)
  const seriesCount = useMemo(
    () => new Set(ownedVolumes.map(m => m.series?.id).filter((id): id is number => id != null)).size,
    [ownedVolumes],
  );

  // O(1) lookups for read and loaned volume IDs (js-set-map-lookups)
  const readVolumeIds = useMemo(
    () => new Set(readingProgress.map(rp => rp.volume_id)),
    [readingProgress],
  );
  const loanedVolumeIds = useMemo(() => {
    const set = new Set<number>();
    for (const loan of loans) {
      if (!loan.is_returned) {
        for (const item of loan.items) {
          if (item.loanable_type === 'volume') set.add(item.loanable_id);
        }
      }
    }
    return set;
  }, [loans]);

  // Deferred value — filtering does not block keystrokes on large collections
  // (rerender-use-deferred-value)
  const deferredSearch = useDeferredValue(search);
  const grouped = useGroupedCollection(ownedVolumes, deferredSearch);

  return (
    <div className="flex flex-col gap-4">
      {isLoading ? collectionStatBarSkeleton : (
        <CollectionStatBar items={[
          { value: ownedVolumes.length, label: 'Volumes' },
          { value: seriesCount, label: 'Séries' },
        ]} />
      )}
      <SearchBar
        placeholder="Rechercher une série…"
        onChange={setSearch}
        onClear={() => setSearch('')}
      />

      {isLoading ? (
        <div className="volume-grid">
          <SkeletonCard variant="series" count={8} />
        </div>
      ) : grouped.filter(gs => gs.series.id > 0).length === 0 ? (
        <EmptyState
          context={search ? 'search' : 'collection'}
          action={!search ? { label: 'Scanner', href: '/scan' } : undefined}
        />
      ) : (
        <div className="volume-grid">
          {grouped
            // Series id=0 = orphan volumes with no dedicated page
            .filter(gs => gs.series.id > 0)
            .map(({ series, volumes }) => {
              const href = `/series/${series.id}`;

              // Cover: first volume with a cover URL, fallback to series cover
              const coverUrl =
                volumes.find(v => v.cover_url)?.cover_url ?? series.cover_url;

              // Total volumes: first tome with a known edition total
              // null = unknown total → SeriesCard hides the progress bar
              const totalVolumes =
                volumes.find(v => v.edition?.total_volumes != null)
                  ?.edition?.total_volumes ?? null;

              const readCount = volumes.filter(v => readVolumeIds.has(v.id)).length;
              const loanedCount = volumes.filter(v => loanedVolumeIds.has(v.id)).length;

              return (
                <SeriesCard
                  key={series.id}
                  series={series}
                  possessedCount={volumes.length}
                  totalVolumes={totalVolumes}
                  href={href}
                  coverUrl={coverUrl}
                  readCount={readCount}
                  loanedCount={loanedCount}
                />
              );
            })}
        </div>
      )}
    </div>
  );
}
