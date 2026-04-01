'use client';

import { useDeferredValue } from 'react';
import { useViewMode } from '@/contexts/ViewModeContext';
import { SkeletonCard } from '@/components/feedback/SkeletonCard';

// ─── Skeletons hoisted at module level (rendering-hoist-jsx) ──────────────────

const TABS = ['Bibliothèque', 'Prêts', 'Envies', 'Lu', 'Compléter'];

const tabBarSkeleton = (
  <div
    className="sticky top-0 z-10"
    style={{ background: 'var(--background)', borderBottom: '1px solid var(--border)' }}
    aria-hidden
  >
    <div className="flex overflow-x-hidden px-2 gap-1">
      {TABS.map((label, i) => (
        <div
          key={label}
          className="shrink-0 px-3 py-3"
        >
          <div
            className="skeleton h-3.5 rounded-full"
            style={{ width: i === 0 ? 88 : i === 4 ? 72 : 44 }}
          />
        </div>
      ))}
    </div>
  </div>
);

const statBarSkeleton = (
  <div
    className="flex rounded-[calc(var(--radius)*2)] overflow-hidden mb-4"
    style={{ background: 'var(--muted)' }}
    aria-hidden
  >
    {[0, 1].map(i => (
      <div
        key={i}
        className="flex-1 flex flex-col gap-1.5 py-3 px-4"
        style={{ borderLeft: i > 0 ? '1px solid var(--border)' : undefined }}
      >
        <div className="skeleton h-7 w-10 rounded" />
        <div className="skeleton h-2.5 w-16 rounded" />
      </div>
    ))}
  </div>
);

const searchBarSkeleton = (
  <div
    className="skeleton h-10 w-full rounded-[calc(var(--radius)*1.5)]"
    aria-hidden
  />
);

export default function CollectionLoading() {
  const viewMode         = useViewMode();
  const deferredViewMode = useDeferredValue(viewMode);

  return (
    <div className="flex flex-col">
      {tabBarSkeleton}
      <div className="w-full max-w-2xl mx-auto px-4 pt-4 pb-6 lg:max-w-4xl">
        {statBarSkeleton}
        {searchBarSkeleton}
        {deferredViewMode === 'cover' ? (
          <div className="volume-grid mt-4" aria-busy aria-label="Chargement">
            <SkeletonCard variant="series" count={8} />
          </div>
        ) : (
          <div className="mt-4" aria-busy aria-label="Chargement">
            <SkeletonCard variant="series-list-row" count={8} />
          </div>
        )}
      </div>
    </div>
  );
}
