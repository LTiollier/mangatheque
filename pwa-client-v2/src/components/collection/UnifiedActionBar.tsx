'use client';

import { createPortal } from 'react-dom';
import { useEffect, useRef, useState } from 'react';
import { BookMarked, BookUp, Heart, Loader2, MoreHorizontal, Plus } from 'lucide-react';

import { useOffline } from '@/contexts/OfflineContext';

export interface UnifiedActionBarProps {
  ownedSelected: number[];
  /** Subset of ownedSelected that are not yet read — used to target mark-as-read */
  ownedSelectedUnread: number[];
  nonOwnedSelected: number[];
  variant: 'edition' | 'boxset';
  onAdd: (ids: number[]) => void;
  /** undefined for boxset (no read tracking) */
  onMarkRead?: (ids: number[]) => void;
  onLoan: (ids: number[]) => void;
  onRemove: (ids: number[]) => void;
  /** boxset only */
  onWishlist?: (ids: number[]) => void;
  addPending?: boolean;
  markPending?: boolean;
  removePending?: boolean;
  loanPending?: boolean;
}

// Portal fixed to the bottom — defined outside parent (rerender-no-inline-components)
export function UnifiedActionBar({
  ownedSelected,
  ownedSelectedUnread,
  nonOwnedSelected,
  variant,
  onAdd,
  onMarkRead,
  onLoan,
  onRemove,
  onWishlist,
  addPending = false,
  markPending = false,
  removePending = false,
  loanPending = false,
}: UnifiedActionBarProps) {
  const { isOffline } = useOffline();
  const [overflowOpen, setOverflowOpen] = useState(false);
  const overflowRef = useRef<HTMLDivElement>(null);

  const totalSelected = ownedSelected.length + nonOwnedSelected.length;

  useEffect(() => {
    if (!overflowOpen) return;
    function onMouseDown(e: MouseEvent) {
      if (overflowRef.current && !overflowRef.current.contains(e.target as Node)) {
        setOverflowOpen(false);
      }
    }
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [overflowOpen]);

  if (typeof document === 'undefined' || totalSelected === 0) return null;

  const barMode: 'owned' | 'non-owned' | 'mixed' =
    nonOwnedSelected.length === 0 ? 'owned'
    : ownedSelected.length === 0 ? 'non-owned'
    : 'mixed';

  // Dérivé ici pour ne pas polluer les props (rerender-derived-state)
  const allOwnedSelectedRead = ownedSelected.length > 0 && ownedSelectedUnread.length === 0;

  const anyPending = addPending || markPending || removePending || loanPending || isOffline;

  // ── Button builders ──────────────────────────────────────────────────────────

  function primaryBtn(label: string, icon: React.ReactNode, spinning: boolean, onClick: () => void) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={anyPending}
        className="flex items-center gap-1.5 h-11 px-3 text-sm font-semibold shrink-0 transition-opacity disabled:opacity-40 hover:opacity-90 cursor-pointer disabled:cursor-default"
        style={{ background: 'var(--primary)', color: 'var(--primary-foreground)', borderRadius: 'var(--radius)' }}
      >
        {spinning ? <Loader2 size={13} className="animate-spin" aria-hidden /> : icon}
        {label}
      </button>
    );
  }

  // ── Actions per mode & variant ───────────────────────────────────────────────

  let primary: React.ReactNode;
  let secondary: React.ReactNode = null;
  let showOverflow = false;

  if (barMode === 'non-owned') {
    primary = primaryBtn('Ajouter', <Plus size={13} aria-hidden />, addPending, () => onAdd(nonOwnedSelected));
    if (variant === 'boxset' && onWishlist) {
      secondary = (
        <button
          type="button"
          onClick={() => onWishlist(nonOwnedSelected)}
          disabled={anyPending}
          className="flex items-center justify-center w-11 h-11 shrink-0 transition-opacity disabled:opacity-40 hover:opacity-90 cursor-pointer disabled:cursor-default"
          style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--card)' }}
          aria-label="Ajouter à la wishlist"
        >
          <Heart size={15} aria-hidden style={{ color: 'var(--color-wishlist, var(--muted-foreground))' }} />
        </button>
      );
    }
  } else if (barMode === 'owned') {
    if (variant === 'edition') {
      // Cible : unread si dispo, sinon tout (tous lus → marquer non lu)
      const markTarget = allOwnedSelectedRead ? ownedSelected : ownedSelectedUnread;
      const markLabel = allOwnedSelectedRead ? 'Marquer non lu' : 'Marquer lu';
      primary = primaryBtn(markLabel, <BookMarked size={13} aria-hidden />, markPending, () => onMarkRead?.(markTarget));
      secondary = (
        <button
          type="button"
          onClick={() => onLoan(ownedSelected)}
          disabled={anyPending}
          className="flex items-center justify-center w-11 h-11 shrink-0 transition-opacity disabled:opacity-40 hover:opacity-90 cursor-pointer disabled:cursor-default"
          style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--card)' }}
          aria-label="Prêter"
        >
          <BookUp size={15} aria-hidden style={{ color: 'var(--muted-foreground)' }} />
        </button>
      );
    } else {
      primary = primaryBtn('Prêter', <BookUp size={13} aria-hidden />, loanPending, () => onLoan(ownedSelected));
    }
    showOverflow = true;
  } else {
    // mixed
    primary = primaryBtn(
      `Ajouter ${nonOwnedSelected.length}`,
      <Plus size={13} aria-hidden />,
      addPending,
      () => onAdd(nonOwnedSelected),
    );
    if (variant === 'edition' && onMarkRead) {
      // Cible les non-lus uniquement (idempotent) ; si tous déjà lus, bascule en "Marquer non lu"
      const markTarget = allOwnedSelectedRead ? ownedSelected : ownedSelectedUnread;
      const markAriaLabel = allOwnedSelectedRead
        ? `Marquer ${markTarget.length} tomes non lus`
        : `Marquer ${markTarget.length} tomes lus`;
      secondary = (
        <button
          type="button"
          onClick={() => onMarkRead(markTarget)}
          disabled={anyPending}
          className="flex items-center justify-center w-11 h-11 shrink-0 transition-opacity disabled:opacity-40 hover:opacity-90 cursor-pointer disabled:cursor-default"
          style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--card)' }}
          aria-label={markAriaLabel}
        >
          {markPending
            ? <Loader2 size={13} className="animate-spin" aria-hidden />
            : <BookMarked size={15} aria-hidden style={{ color: 'var(--muted-foreground)' }} />}
        </button>
      );
    } else if (variant === 'boxset' && onWishlist) {
      secondary = (
        <button
          type="button"
          onClick={() => onWishlist(nonOwnedSelected)}
          disabled={anyPending}
          className="flex items-center justify-center w-11 h-11 shrink-0 transition-opacity disabled:opacity-40 hover:opacity-90 cursor-pointer disabled:cursor-default"
          style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--card)' }}
          aria-label={`Ajouter ${nonOwnedSelected.length} à la wishlist`}
        >
          <Heart size={15} aria-hidden style={{ color: 'var(--color-wishlist, var(--muted-foreground))' }} />
        </button>
      );
    }
  }

  const counterText = `${totalSelected} sélectionné${totalSelected > 1 ? 's' : ''}`;
  const infoLine = barMode === 'mixed'
    ? `${ownedSelected.length} possédé${ownedSelected.length > 1 ? 's' : ''} · ${nonOwnedSelected.length} manquant${nonOwnedSelected.length > 1 ? 's' : ''}`
    : null;

  return createPortal(
    <div
      className="fixed bottom-0 left-0 right-0 z-40 lg:left-64 px-4 pt-3"
      style={{
        paddingBottom: 'calc(64px + env(safe-area-inset-bottom) + 12px)',
        background: 'var(--background)',
        borderTop: '1px solid var(--border)',
      }}
    >
      {infoLine && (
        <p className="text-xs mb-2" style={{ color: 'var(--muted-foreground)' }}>
          {infoLine}
        </p>
      )}
      <div className="flex items-center gap-2">
        <p className="flex-1 min-w-0 truncate text-xs font-semibold" style={{ color: 'var(--muted-foreground)' }}>
          {counterText}
        </p>

        {/* Overflow — destructive-emphasis: Retirer hidden behind "..." */}
        {showOverflow && (
          <div className="relative" ref={overflowRef}>
            <button
              type="button"
              onClick={() => setOverflowOpen(o => !o)}
              className="flex items-center justify-center w-10 h-11 shrink-0 transition-opacity hover:opacity-70 cursor-pointer"
              style={{ color: 'var(--muted-foreground)' }}
              aria-label="Plus d'actions"
            >
              <MoreHorizontal size={18} aria-hidden />
            </button>
            {overflowOpen && (
              <div
                className="absolute bottom-full right-0 mb-2 min-w-[200px] overflow-hidden"
                style={{
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'calc(var(--radius) * 1.5)',
                  boxShadow: '0 4px 16px oklch(0% 0 0 / 0.12)',
                }}
              >
                <button
                  type="button"
                  onClick={() => { setOverflowOpen(false); onRemove(ownedSelected); }}
                  disabled={removePending || isOffline}
                  className="flex items-center gap-2 w-full px-4 h-11 text-sm font-medium text-left transition-opacity disabled:opacity-40 hover:opacity-80 cursor-pointer disabled:cursor-default"
                  style={{ color: 'var(--destructive)' }}
                >
                  {removePending && <Loader2 size={13} className="animate-spin" aria-hidden />}
                  Retirer de la collection
                </button>
              </div>
            )}
          </div>
        )}

        {secondary}
        {primary}
      </div>
    </div>,
    document.body,
  );
}
