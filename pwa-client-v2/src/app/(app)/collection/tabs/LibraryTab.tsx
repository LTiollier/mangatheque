'use client';

import { useMemo, useState, useDeferredValue } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import { useVolumes, useReadingProgressQuery, useLoansQuery } from '@/hooks/queries';
import { useGroupedCollection } from '@/hooks/useGroupedCollection';
import { countReleasedOwned, sumReleasedTotal } from '@/lib/collection';
import { SeriesCard } from '@/components/cards/SeriesCard';
import { SeriesListRow } from '@/components/cards/SeriesListRow';
import { SearchBar } from '@/components/forms/SearchBar';
import { SkeletonCard } from '@/components/feedback/SkeletonCard';

// ─── Skeletons hoistés (rendering-hoist-jsx) ──────────────────────────────────
const coverLoadingSkeleton = (
  <div className="volume-grid" aria-busy>
    <SkeletonCard variant="series" count={8} />
  </div>
);

const listLoadingSkeleton = (
  <div aria-busy>
    <SkeletonCard variant="series-list-row" count={8} />
  </div>
);
import { EmptyState } from '@/components/feedback/EmptyState';
import { CollectionStatBar, collectionStatBarSkeleton } from '@/components/collection/CollectionStatBar';
import { useViewMode } from '@/contexts/ViewModeContext';
import { viewTransitionVariants } from '@/lib/motion';

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

  // rerender-use-deferred-value : le switch de vue peut déclencher un re-render
  // lourd (100+ cartes → 100+ lignes). useDeferredValue garde l'ancienne vue
  // visible pendant que React construit la nouvelle.
  const viewMode         = useViewMode();
  const deferredViewMode = useDeferredValue(viewMode);
  const isStale          = viewMode !== deferredViewMode;

  const filteredGroups = grouped.filter(gs => gs.series.id > 0);

  // js-combine-iterations : on précalcule une seule fois les données dérivées
  // de chaque groupe (readCount, loanedCount, coverUrl, totalVolumes).
  // Évite de répliquer les volumes.filter() dans les deux branches cover/list
  // et de les recalculer à chaque re-render indépendamment de la vue active.
  const enrichedGroups = useMemo(() =>
    filteredGroups.map(({ series, volumes }, index) => ({
      series,
      href:           `/series/${series.id}`,
      coverUrl:       volumes.find(v => v.cover_url)?.cover_url ?? series.cover_url,
      possessedCount: countReleasedOwned(volumes),
      totalVolumes:   sumReleasedTotal(volumes),
      readCount:      volumes.filter(v => readVolumeIds.has(v.id)).length,
      loanedCount:    volumes.filter(v => loanedVolumeIds.has(v.id)).length,
      priority:       index < 4,
    })),
    [filteredGroups, readVolumeIds, loanedVolumeIds],
  );

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
        deferredViewMode === 'cover' ? coverLoadingSkeleton : listLoadingSkeleton
      ) : filteredGroups.length === 0 ? (
        <EmptyState
          context={search ? 'search' : 'collection'}
          action={!search ? { label: 'Scanner', href: '/scan' } : undefined}
        />
      ) : (
        <div
          className="transition-opacity duration-150"
          style={{ opacity: isStale ? 0.6 : 1 }}
        >
          <AnimatePresence mode="wait" initial={false}>
            {deferredViewMode === 'cover' ? (
              <motion.div
                key="cover"
                variants={viewTransitionVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="volume-grid"
              >
                {enrichedGroups.map(({ series, href, coverUrl, possessedCount, totalVolumes, readCount, loanedCount, priority }) => (
                  <SeriesCard
                    key={series.id}
                    series={series}
                    possessedCount={possessedCount}
                    totalVolumes={totalVolumes}
                    href={href}
                    coverUrl={coverUrl}
                    readCount={readCount}
                    loanedCount={loanedCount}
                    priority={priority}
                  />
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="list"
                variants={viewTransitionVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                {enrichedGroups.map(({ series, href, coverUrl, possessedCount, totalVolumes, readCount, loanedCount }) => (
                  <SeriesListRow
                    key={series.id}
                    series={series}
                    possessedCount={possessedCount}
                    totalVolumes={totalVolumes}
                    href={href}
                    coverUrl={coverUrl}
                    readCount={readCount}
                    loanedCount={loanedCount}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
