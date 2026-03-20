'use client';

import { createPortal } from 'react-dom';
import { BookMarked, BookUp, Loader2 } from 'lucide-react';

interface CollectionActionBarProps {
  count: number;
  onLoan: () => void;
  /**
   * Base singular form used for the counter label.
   * "sélectionné" → "1 sélectionné / 2 sélectionnés"
   * "sélectionnée" → "1 sélectionnée / 2 sélectionnées"
   */
  itemLabel?: string;
  /** When omitted the "Marquer" button is hidden (BoxSet has no bulk-read action) */
  onMarkRead?: () => void;
  markPending?: boolean;
}

// Portal fixed to the bottom — defined outside parent (rerender-no-inline-components)
export function CollectionActionBar({
  count,
  onLoan,
  itemLabel = 'sélectionné',
  onMarkRead,
  markPending = false,
}: CollectionActionBarProps) {
  if (typeof document === 'undefined' || count === 0) return null;

  return createPortal(
    <div
      className="fixed bottom-0 left-0 right-0 z-40 lg:left-64 px-4 pt-3"
      style={{
        paddingBottom: 'calc(64px + env(safe-area-inset-bottom) + 12px)',
        background: 'var(--background)',
        borderTop: '1px solid var(--border)',
      }}
    >
      <div className="flex items-center gap-3">
        <p className="flex-1 text-xs font-semibold" style={{ color: 'var(--muted-foreground)' }}>
          {count} {itemLabel}{count > 1 ? 's' : ''}
        </p>
        {onMarkRead && (
          <button
            type="button"
            onClick={onMarkRead}
            disabled={markPending}
            className="flex items-center gap-1.5 h-10 px-4 text-sm font-semibold transition-opacity disabled:opacity-40 hover:opacity-90"
            style={{
              background: 'color-mix(in oklch, var(--primary) 12%, var(--card))',
              color: 'var(--primary)',
              border: '1px solid color-mix(in oklch, var(--primary) 30%, transparent)',
              borderRadius: 'var(--radius)',
            }}
          >
            {markPending
              ? <Loader2 size={13} className="animate-spin" aria-hidden />
              : <BookMarked size={13} aria-hidden />}
            Marquer
          </button>
        )}
        <button
          type="button"
          onClick={onLoan}
          className="flex items-center gap-1.5 h-10 px-4 text-sm font-semibold transition-opacity hover:opacity-90"
          style={{
            background: 'var(--primary)',
            color: 'var(--primary-foreground)',
            borderRadius: 'var(--radius)',
          }}
        >
          <BookUp size={13} aria-hidden />
          Prêter
        </button>
      </div>
    </div>,
    document.body,
  );
}
