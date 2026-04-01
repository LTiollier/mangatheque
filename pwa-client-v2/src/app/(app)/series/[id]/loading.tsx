'use client';

import { useDeferredValue } from 'react';
import { useViewMode } from '@/contexts/ViewModeContext';

// ─── Skeletons hoisted at module level (rendering-hoist-jsx) ──────────────────

const backButtonSkeleton = (
  <div className="skeleton h-4 w-20 rounded" aria-hidden />
);

const headerSkeleton = (
  <div className="flex gap-4" aria-busy aria-hidden>
    <div
      className="skeleton shrink-0 w-20 rounded-[calc(var(--radius)*2)]"
      style={{ aspectRatio: '2/3' }}
    />
    <div className="flex flex-col gap-2 pt-1 flex-1">
      <div className="skeleton h-6 w-3/4 rounded" />
      <div className="skeleton h-4 w-1/2 rounded" />
      <div className="skeleton h-3 w-1/3 rounded mt-1" />
    </div>
  </div>
);

const sectionTitleSkeleton = (
  <div className="skeleton h-4 w-24 rounded" aria-hidden />
);

const editionGridSkeleton = (
  <div
    className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4"
    aria-busy
    aria-hidden
  >
    {Array.from({ length: 3 }, (_, i) => (
      <div key={i} className="flex flex-col gap-2">
        <div
          className="skeleton rounded-[calc(var(--radius)*2)] w-full"
          style={{ aspectRatio: '2/3' }}
        />
        <div className="flex flex-col gap-1.5 px-0.5">
          <div className="skeleton h-3.5 w-4/5 rounded" />
          <div className="skeleton h-3 w-2/5 rounded" />
          <div className="skeleton h-[3px] w-full rounded-full" />
        </div>
      </div>
    ))}
  </div>
);

const editionListSkeleton = (
  <div aria-busy aria-hidden>
    {Array.from({ length: 3 }, (_, i) => (
      <div
        key={i}
        className="flex items-center gap-3 py-3 border-b last:border-b-0"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="skeleton shrink-0 w-12 rounded" style={{ aspectRatio: '2/3' }} />
        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
          <div className="skeleton h-3.5 w-3/5 rounded" />
          <div className="skeleton h-3 w-2/5 rounded" />
          <div className="skeleton h-3 w-1/4 rounded" />
          <div className="skeleton h-[3px] w-full rounded-full" />
        </div>
      </div>
    ))}
  </div>
);

export default function SeriesLoading() {
  const viewMode         = useViewMode();
  const deferredViewMode = useDeferredValue(viewMode);

  return (
    <div className="w-full max-w-2xl mx-auto px-4 pt-4 pb-6 lg:max-w-4xl">
      <div className="flex flex-col gap-8">
        {backButtonSkeleton}
        {headerSkeleton}
        <div className="flex flex-col gap-4">
          {sectionTitleSkeleton}
          {deferredViewMode === 'cover' ? editionGridSkeleton : editionListSkeleton}
        </div>
      </div>
    </div>
  );
}
