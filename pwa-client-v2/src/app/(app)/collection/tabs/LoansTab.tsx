'use client';

import { useMemo } from 'react';

import { useLoansQuery, useBulkReturnLoans } from '@/hooks/queries';
import { useOffline } from '@/contexts/OfflineContext';
import { EmptyState } from '@/components/feedback/EmptyState';
import { CollectionStatBar } from '@/components/collection/CollectionStatBar';
import { LoanGroupCard } from '@/components/collection/LoanGroupCard';
import type { Loan } from '@/types/volume';

// ─── Skeletons hoisted at module level (rendering-hoist-jsx) ─────────────────

const loanSkeletons = (
  <div
    className="rounded-[calc(var(--radius)*2)] overflow-hidden"
    style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
    aria-busy
  >
    {Array.from({ length: 3 }, (_, i) => (
      <div
        key={i}
        className="flex items-center gap-3 p-4 border-b last:border-b-0"
        style={{ borderColor: 'var(--border)' }}
        aria-hidden
      >
        <div className="flex-1 flex flex-col gap-2">
          <div className="skeleton h-4 w-1/3 rounded" />
          <div className="skeleton h-3 w-2/3 rounded" />
        </div>
        <div className="skeleton h-8 w-16 rounded" />
      </div>
    ))}
  </div>
);

// ─── LoansTab ─────────────────────────────────────────────────────────────────

export function LoansTab() {
  const { data: loans = [], isLoading } = useLoansQuery();
  const { mutate: bulkReturn, isPending: bulkPending } = useBulkReturnLoans();
  const { isOffline } = useOffline();

  // Derived during render — no useEffect (rerender-derived-state-no-effect)
  const activeLoans = useMemo(() => loans.filter((l: Loan) => !l.is_returned), [loans]);
  const returnedLoans = useMemo(
    () => loans.filter((l: Loan) => l.is_returned).slice(0, 10),
    [loans],
  );

  // Unique series touched by active loans — iterate items (js-set-map-lookups)
  const loanedSeriesCount = useMemo(() => {
    const seriesIds = new Set<number>();
    for (const loan of activeLoans) {
      for (const item of loan.items) {
        const sid =
          item.loanable_type === 'volume'
            ? (item.loanable as { series?: { id?: number } } | null)?.series?.id
            : (item.loanable as { series_id?: number } | null)?.series_id;
        if (sid != null) seriesIds.add(sid);
      }
    }
    return seriesIds.size;
  }, [activeLoans]);

  if (isLoading) return loanSkeletons;

  return (
    <div className="flex flex-col gap-6">
      <CollectionStatBar items={[
        { value: activeLoans.length, label: 'Prêts en cours' },
        { value: loanedSeriesCount, label: 'Séries concernées' },
      ]} />

      {loans.length === 0 ? <EmptyState context="loans" /> : (
      <>
      {/* Active loans */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3
            className="text-xs font-semibold uppercase"
            style={{ color: 'var(--muted-foreground)', letterSpacing: '0.08em' }}
          >
            En cours ({activeLoans.length})
          </h3>

          {/* Bulk return — visible when 2+ active loans */}
          {activeLoans.length > 1 && (
            <button
              type="button"
              onClick={() => bulkReturn(activeLoans.map((l: Loan) => l.id))}
              disabled={bulkPending || isOffline}
              className="text-xs font-medium transition-opacity disabled:opacity-50 hover:opacity-80"
              style={{ color: 'var(--primary)' }}
            >
              {bulkPending ? '…' : 'Tout retourner'}
            </button>
          )}
        </div>

        {activeLoans.length === 0 ? (
          <EmptyState context="loans" />
        ) : (
          <div
            className="rounded-[calc(var(--radius)*2)] overflow-hidden"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          >
            {activeLoans.map((loan: Loan) => (
              <LoanGroupCard key={loan.id} loan={loan} />
            ))}
          </div>
        )}
      </section>

      {/* Loan history (last 10) */}
      {returnedLoans.length > 0 && (
        <section>
          <h3
            className="text-xs font-semibold uppercase mb-3"
            style={{ color: 'var(--muted-foreground)', letterSpacing: '0.08em' }}
          >
            Historique
          </h3>
          <div
            className="rounded-[calc(var(--radius)*2)] overflow-hidden"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          >
            {returnedLoans.map((loan: Loan) => (
              <LoanGroupCard key={loan.id} loan={loan} isHistory />
            ))}
          </div>
        </section>
      )}
      </>
      )}
    </div>
  );
}
