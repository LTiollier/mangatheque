'use client';

import { useMemo } from 'react';
import { differenceInDays, format } from 'date-fns';

import { useLoansQuery, useReturnLoan, useBulkReturnLoans } from '@/hooks/queries';
import { useOffline } from '@/contexts/OfflineContext';
import { EmptyState } from '@/components/feedback/EmptyState';
import { CollectionStatBar } from '@/components/collection/CollectionStatBar';
import type { Loan, Volume, Box } from '@/types/volume';

const OVERDUE_DAYS = 30;

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

// ─── LoanRow — defined outside parent component (rerender-no-inline-components) ─

interface LoanRowProps {
  loan: Loan;
  isHistory?: boolean;
}

function LoanRow({ loan, isHistory = false }: LoanRowProps) {
  // Per-row mutation — isPending is isolated, rollback is independent
  const { mutate, isPending } = useReturnLoan();
  const { isOffline } = useOffline();

  const daysActive = differenceInDays(new Date(), new Date(loan.loaned_at));
  const isOverdue = !isHistory && !loan.is_returned && daysActive >= OVERDUE_DAYS;
  const itemTitle = loan.loanable?.title ?? 'Volume inconnu';

  return (
    <div
      className="flex items-start gap-3 p-4 border-b last:border-b-0"
      style={{ borderColor: 'var(--border)', opacity: isHistory ? 0.65 : 1 }}
    >
      <div className="flex-1 min-w-0">
        {/* Borrower name */}
        <p
          className="text-sm font-semibold truncate"
          style={{ color: 'var(--foreground)', fontFamily: 'var(--font-display)' }}
        >
          {loan.borrower_name}
        </p>

        {/* Loaned item title */}
        <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--muted-foreground)' }}>
          {itemTitle}
        </p>

        {/* Duration + overdue badge */}
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <span
            className="text-xs"
            style={{ color: isOverdue ? 'var(--destructive)' : 'var(--muted-foreground)' }}
          >
            {isHistory && loan.returned_at
              ? `Rendu le ${format(new Date(loan.returned_at), 'dd/MM/yy')}`
              : `${daysActive} jour${daysActive > 1 ? 's' : ''}`}
          </span>

          {isOverdue && (
            <span
              className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full leading-none"
              style={{
                background: 'color-mix(in oklch, var(--destructive) 15%, transparent)',
                color: 'var(--destructive)',
                border: '1px solid color-mix(in oklch, var(--destructive) 30%, transparent)',
              }}
            >
              En retard
            </span>
          )}
        </div>
      </div>

      {/* Return button (active loans only) */}
      {!isHistory && (
        <button
          type="button"
          onClick={() => mutate({ id: loan.loanable_id, type: loan.loanable_type })}
          disabled={isPending || loan.is_returned || isOffline}
          className="shrink-0 text-xs font-medium h-8 px-3 transition-opacity disabled:opacity-50 hover:opacity-80"
          style={{
            background: 'var(--secondary)',
            color: 'var(--foreground)',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border)',
          }}
        >
          {isPending ? '…' : 'Rendu'}
        </button>
      )}
    </div>
  );
}

// ─── LoansTab ─────────────────────────────────────────────────────────────────

export function LoansTab() {
  const { data: loans = [], isLoading } = useLoansQuery();
  const { mutate: bulkReturn, isPending: bulkPending } = useBulkReturnLoans();
  const { isOffline } = useOffline();

  // Derived during render — no useEffect (rerender-derived-state-no-effect)
  const activeLoans = useMemo(() => loans.filter(l => !l.is_returned), [loans]);
  const returnedLoans = useMemo(
    () => loans.filter(l => l.is_returned).slice(0, 10),
    [loans],
  );

  // Unique series touched by active loans — Set for O(1) dedup (js-set-map-lookups)
  const loanedSeriesCount = useMemo(() => {
    const seriesIds = new Set<number>();
    for (const loan of activeLoans) {
      if (loan.loanable_type === 'volume') {
        const sid = (loan.loanable as Volume | null)?.series?.id;
        if (sid != null) seriesIds.add(sid);
      } else {
        const sid = (loan.loanable as Box | null)?.series_id;
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
              onClick={() =>
                bulkReturn(
                  activeLoans.map(l => ({ id: l.loanable_id, type: l.loanable_type })),
                )
              }
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
            {activeLoans.map(loan => (
              <LoanRow key={loan.id} loan={loan} />
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
            {returnedLoans.map(loan => (
              <LoanRow key={loan.id} loan={loan} isHistory />
            ))}
          </div>
        </section>
      )}
      </>
      )}
    </div>
  );
}
