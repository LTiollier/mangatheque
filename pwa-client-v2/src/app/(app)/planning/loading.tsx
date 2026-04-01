'use client';

import { useDeferredValue } from 'react';
import { useViewMode } from '@/contexts/ViewModeContext';
import { PlanningCardSkeleton, PlanningListRowSkeleton } from '@/components/cards/PlanningCard';

// ─── Skeletons hoisted at module level (rendering-hoist-jsx) ──────────────────

const monthDividerSkeleton = (
  <div className="flex items-center gap-3 py-4" aria-hidden>
    <div className="skeleton h-3 w-24 rounded-full shrink-0" />
    <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
  </div>
);

export default function PlanningLoading() {
  const viewMode         = useViewMode();
  const deferredViewMode = useDeferredValue(viewMode);

  return (
    <div className="w-full max-w-2xl mx-auto px-4 pt-4 pb-6 lg:max-w-4xl">
      {monthDividerSkeleton}
      {deferredViewMode === 'cover' ? (
        <div
          className="grid grid-cols-3 gap-3 lg:grid-cols-5 lg:gap-4"
          aria-busy
          aria-label="Chargement"
        >
          {Array.from({ length: 9 }, (_, i) => (
            <PlanningCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div aria-busy aria-label="Chargement">
          {Array.from({ length: 9 }, (_, i) => (
            <PlanningListRowSkeleton key={i} />
          ))}
        </div>
      )}
    </div>
  );
}
