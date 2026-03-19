'use client';

import { useMemo, useState, useDeferredValue } from 'react';

import { useMangas, useReadingProgressQuery, useLoansQuery } from '@/hooks/queries';
import { useGroupedCollection } from '@/hooks/useGroupedCollection';
import { SeriesCard } from '@/components/cards/SeriesCard';
import { SearchBar } from '@/components/forms/SearchBar';
import { SkeletonCard } from '@/components/feedback/SkeletonCard';
import { EmptyState } from '@/components/feedback/EmptyState';

export function LibraryTab() {
  const { data: mangas = [], isLoading } = useMangas();
  const { data: readingProgress = [] } = useReadingProgressQuery();
  const { data: loans = [] } = useLoansQuery();
  const [search, setSearch] = useState('');

  // Memoized owned filter — avoids recreating the array on every keystroke (rerender-memo)
  const ownedMangas = useMemo(() => mangas.filter(m => m.is_owned), [mangas]);

  // O(1) lookups for read and loaned volume IDs (js-set-map-lookups)
  const readVolumeIds = useMemo(
    () => new Set(readingProgress.map(rp => rp.volume_id)),
    [readingProgress],
  );
  const loanedVolumeIds = useMemo(
    () => new Set(
      loans
        .filter(l => !l.is_returned && l.loanable_type === 'volume')
        .map(l => l.loanable_id),
    ),
    [loans],
  );

  // Deferred value — filtering does not block keystrokes on large collections
  // (rerender-use-deferred-value)
  const deferredSearch = useDeferredValue(search);
  const grouped = useGroupedCollection(ownedMangas, deferredSearch);

  return (
    <div className="flex flex-col gap-4">
      <SearchBar
        placeholder="Rechercher une série…"
        onChange={setSearch}
        onClear={() => setSearch('')}
      />

      {isLoading ? (
        <div className="manga-grid">
          <SkeletonCard variant="series" count={8} />
        </div>
      ) : grouped.filter(gs => gs.series.id > 0).length === 0 ? (
        <EmptyState
          context={search ? 'search' : 'collection'}
          action={!search ? { label: 'Scanner', href: '/scan' } : undefined}
        />
      ) : (
        <div className="manga-grid">
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
