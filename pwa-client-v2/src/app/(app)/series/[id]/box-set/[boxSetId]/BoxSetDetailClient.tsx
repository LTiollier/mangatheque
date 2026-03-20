'use client';

import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ChevronLeft, Heart, Package2, BookUp, CheckCircle } from 'lucide-react';

import {
  useBoxSetQuery,
  useToggleWishlist,
  useLoansQuery,
  useBulkCreateBoxLoan,
} from '@/hooks/queries';
import { MangaGrid } from '@/components/cards/MangaGrid';
import { BottomSheet } from '@/components/feedback/BottomSheet';
import { EmptyState } from '@/components/feedback/EmptyState';
import { sectionVariants } from '@/lib/motion';
import type { Box, Loan } from '@/types/manga';

// ─── Skeletons hoisted at module level (rendering-hoist-jsx) ─────────────────

const headerSkeleton = (
  <div className="flex gap-4" aria-busy aria-hidden>
    <div
      className="skeleton shrink-0 w-20 rounded-[calc(var(--radius)*2)]"
      style={{ aspectRatio: '2/3' }}
    />
    <div className="flex flex-col gap-2 pt-1 flex-1">
      <div className="skeleton h-5 w-2/3 rounded" />
      <div className="skeleton h-4 w-1/3 rounded" />
      <div className="skeleton h-3 w-1/4 rounded mt-1" />
    </div>
  </div>
);

const gridSkeleton = (
  <div
    className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4"
    aria-busy
    aria-hidden
  >
    {Array.from({ length: 4 }, (_, i) => (
      <div key={i} className="flex flex-col gap-2">
        <div
          className="skeleton rounded-[calc(var(--radius)*2)] w-full"
          style={{ aspectRatio: '2/3' }}
        />
        <div className="skeleton h-4 w-3/4 rounded" />
        <div className="skeleton h-3 w-1/2 rounded" />
      </div>
    ))}
  </div>
);

// Hoisted static badge — same on every box card (rendering-hoist-jsx)
const boxBadge = (
  <div
    className="absolute top-1.5 left-1.5 flex items-center justify-center w-[22px] h-[22px] rounded"
    style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
    aria-label="Coffret"
  >
    <Package2 size={12} style={{ color: 'var(--muted-foreground)' }} aria-hidden />
  </div>
);

// ─── LoanSelectBar — portal, prêt uniquement (rerender-no-inline-components) ─

interface LoanSelectBarProps {
  count: number;
  onLoan: () => void;
}

function LoanSelectBar({ count, onLoan }: LoanSelectBarProps) {
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
          {count} sélectionné{count > 1 ? 'es' : 'e'}
        </p>
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

// ─── WishlistButton — defined outside parent (rerender-no-inline-components) ─

interface WishlistButtonProps {
  isWishlisted: boolean;
  onToggle: () => void;
  isPending: boolean;
}

function WishlistButton({ isWishlisted, onToggle, isPending }: WishlistButtonProps) {
  return (
    <button
      type="button"
      onClick={e => { e.preventDefault(); onToggle(); }}
      disabled={isPending}
      className="absolute top-2 right-2 z-10 flex items-center justify-center w-8 h-8 rounded-full transition-opacity disabled:opacity-50 hover:opacity-80"
      style={{
        background: 'color-mix(in oklch, var(--background) 60%, transparent)',
        backdropFilter: 'blur(4px)',
      }}
      aria-label={isWishlisted ? 'Retirer de la wishlist' : 'Ajouter à la wishlist'}
    >
      <Heart
        size={14}
        fill={isWishlisted ? 'var(--color-wishlist)' : 'none'}
        style={{ color: isWishlisted ? 'var(--color-wishlist)' : 'var(--muted-foreground)' }}
        aria-hidden
      />
    </button>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getBoxMetaLine(box: Box): string | null {
  const volumeCount = box.total_volumes ?? box.volumes?.length;
  return [
    box.number ? `Boîte ${box.number}` : null,
    volumeCount ? `${volumeCount} vol.` : null,
  ].filter(Boolean).join(' · ') || null;
}

// ─── BoxActionCard — button-based, selectable for owned boxes ─────────────────

interface BoxActionCardProps {
  box: Box;
  isLoaned: boolean;
  isSelected: boolean;
  onToggle: (box: Box) => void;
}

function BoxActionCard({ box, isLoaned, isSelected, onToggle }: BoxActionCardProps) {
  const isOwned = box.is_owned ?? false;
  const metaLine = getBoxMetaLine(box);

  return (
    <button
      type="button"
      className="group flex flex-col gap-2 text-left"
      onClick={() => { if (isOwned) onToggle(box); }}
      style={{ cursor: isOwned ? 'pointer' : 'default' }}
      aria-label={`${box.title}${isLoaned ? ' — prêté' : ''}`}
      aria-pressed={isOwned ? isSelected : undefined}
    >
      <div
        className="relative overflow-hidden rounded-[calc(var(--radius)*2)] aspect-[2/3] w-full"
        style={{ background: 'var(--muted)' }}
      >
        {box.cover_url ? (
          <Image
            src={box.cover_url}
            alt={box.title}
            fill
            sizes="(max-width: 480px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
            className="object-cover transition-transform duration-200 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Package2 size={32} aria-hidden style={{ color: 'var(--muted-foreground)' }} />
          </div>
        )}

        {boxBadge}

        {/* Non-owned overlay */}
        {!isOwned && (
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'oklch(0% 0 0 / 0.45)' }}
          />
        )}

        {/* Loaned overlay — masqué si sélectionné */}
        {isLoaned && !isSelected && (
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'color-mix(in oklch, var(--color-loaned) 15%, transparent)' }}
          />
        )}

        {/* Selected overlay */}
        {isSelected && (
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none flex items-center justify-center"
            style={{ background: 'color-mix(in oklch, var(--primary) 35%, transparent)' }}
          >
            <CheckCircle size={20} style={{ color: 'white' }} />
          </div>
        )}

        {/* Loaned dot — top right, masqué si sélectionné */}
        {isLoaned && !isSelected && (
          <span
            className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full shrink-0"
            style={{
              background: 'var(--color-loaned)',
              boxShadow: '0 0 0 1px color-mix(in oklch, var(--background) 80%, transparent)',
            }}
            aria-label="Prêté"
          />
        )}
      </div>

      <div className="flex flex-col gap-1 px-0.5">
        <p
          className="text-sm font-semibold leading-tight line-clamp-2"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}
        >
          {box.title}
        </p>
        {metaLine && (
          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            {metaLine}
          </p>
        )}
      </div>
    </button>
  );
}

// ─── BoxSetDetailClient ───────────────────────────────────────────────────────

interface BoxSetDetailClientProps {
  seriesId: number;
  boxSetId: number;
}

export function BoxSetDetailClient({ seriesId: _seriesId, boxSetId }: BoxSetDetailClientProps) {
  const router = useRouter();

  const { data: boxSet, isLoading, isError } = useBoxSetQuery(boxSetId);
  const { data: loans = [] } = useLoansQuery();
  const toggleWishlist = useToggleWishlist();
  const bulkCreateBoxLoan = useBulkCreateBoxLoan();

  // Multiselect state
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<number>>(() => new Set());

  // Loan sheet state
  const [isLoanOpen, setIsLoanOpen] = useState(false);
  const [borrowerName, setBorrowerName] = useState('');

  // Derived during render — no useEffect (rerender-derived-state-no-effect)
  const boxes: Box[] = boxSet?.boxes ?? [];
  const ownedBoxes = useMemo(() => boxes.filter(b => b.is_owned), [boxes]);
  const ownedCount = ownedBoxes.length;
  const progress = boxes.length > 0 ? Math.round((ownedCount / boxes.length) * 100) : null;

  // O(1) loaned lookup (js-set-map-lookups)
  const loanedSet = useMemo(
    () => new Set(
      loans
        .filter((l): l is Loan & { loanable_type: 'box' } => !l.is_returned && l.loanable_type === 'box')
        .map(l => l.loanable_id)
    ),
    [loans],
  );

  function handleToggle(box: Box) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(box.id)) next.delete(box.id); else next.add(box.id);
      return next;
    });
  }

  function handleSelectAll() {
    setSelectedIds(new Set(ownedBoxes.map(b => b.id)));
  }

  function handleBulkLoanAll() {
    setSelectedIds(new Set(ownedBoxes.filter(b => !loanedSet.has(b.id)).map(b => b.id)));
    setIsLoanOpen(true);
  }

  function handleCloseLoanSheet() {
    setIsLoanOpen(false);
    setBorrowerName('');
  }

  function handleConfirmLoan() {
    if (!borrowerName.trim() || selectedIds.size === 0) return;
    bulkCreateBoxLoan.mutate(
      { boxIds: [...selectedIds], borrowerName: borrowerName.trim() },
      {
        onSuccess: () => {
          handleCloseLoanSheet();
          setSelectedIds(new Set());
        },
      },
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Back nav */}
      <button
        type="button"
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm transition-opacity hover:opacity-70 w-fit -ml-0.5"
        style={{ color: 'var(--muted-foreground)' }}
        aria-label="Retour à la série"
      >
        <ChevronLeft size={16} aria-hidden />
        Série
      </button>

      {/* Box-set header */}
      {isLoading ? (
        headerSkeleton
      ) : isError ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm" style={{ color: 'var(--destructive)' }}>
            Impossible de charger ce coffret.
          </p>
          <button
            type="button"
            onClick={() => router.back()}
            className="text-sm font-medium transition-opacity hover:opacity-80 text-left"
            style={{ color: 'var(--primary)' }}
          >
            ← Retour
          </button>
        </div>
      ) : boxSet ? (
        <motion.div
          className="flex gap-4"
          variants={sectionVariants}
          initial="initial"
          animate="animate"
        >
          {/* Cover */}
          <div
            className="shrink-0 w-20 relative overflow-hidden rounded-[calc(var(--radius)*2)]"
            style={{ aspectRatio: '2/3', background: 'var(--muted)' }}
          >
            {boxSet.cover_url ? (
              <Image
                src={boxSet.cover_url}
                alt={boxSet.title}
                fill
                sizes="80px"
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <Package2 size={24} aria-hidden style={{ color: 'var(--muted-foreground)' }} />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col justify-center gap-1.5 min-w-0 flex-1">
            <h1
              className="text-xl font-bold leading-tight"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}
            >
              {boxSet.title}
            </h1>
            {boxSet.publisher && (
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                {boxSet.publisher}
              </p>
            )}
            {progress !== null && (
              <>
                <div
                  className="manga-progress"
                  role="progressbar"
                  aria-valuenow={progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${ownedCount} boîtes sur ${boxes.length} possédées`}
                >
                  <div className="manga-progress__fill" style={{ width: `${progress}%` }} />
                </div>
                <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  {ownedCount} / {boxes.length} boîte{boxes.length > 1 ? 's' : ''} possédée{ownedCount > 1 ? 's' : ''}
                </p>
              </>
            )}
          </div>
        </motion.div>
      ) : null}

      {/* Boxes grid */}
      {isLoading ? (
        gridSkeleton
      ) : boxes.length === 0 && !isError ? (
        <EmptyState context="collection" />
      ) : (
        <motion.section
          variants={sectionVariants}
          initial="initial"
          animate="animate"
          aria-label="Boîtes du coffret"
        >
          {/* Section header */}
          <div className="flex items-center justify-between mb-4">
            <h2
              className="text-xs font-semibold uppercase"
              style={{ color: 'var(--muted-foreground)', letterSpacing: '0.08em' }}
            >
              {selectedIds.size > 0
                ? `${selectedIds.size} sélectionné${selectedIds.size > 1 ? 'es' : 'e'}`
                : `Boîtes (${boxes.length})`}
            </h2>
            {ownedBoxes.length > 0 && (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-xs font-medium transition-opacity hover:opacity-70"
                  style={{ color: 'var(--muted-foreground)' }}
                >
                  Tout sélectionner
                </button>
                <button
                  type="button"
                  onClick={handleBulkLoanAll}
                  className="flex items-center gap-1 text-xs font-medium transition-opacity hover:opacity-80"
                  style={{ color: 'var(--primary)' }}
                >
                  <BookUp size={11} aria-hidden />
                  Tout prêter
                </button>
              </div>
            )}
          </div>

          <MangaGrid variant="series" className={selectedIds.size > 0 ? 'pb-28' : undefined}>
            {boxes.map(box => (
              <div key={box.id} className="relative">
                <BoxActionCard
                  box={box}
                  isLoaned={loanedSet.has(box.id)}
                  isSelected={selectedIds.has(box.id)}
                  onToggle={handleToggle}
                />
                {!(box.is_owned ?? false) && (
                  <WishlistButton
                    isWishlisted={box.is_wishlisted ?? false}
                    onToggle={() => toggleWishlist.mutate({
                      id: box.id,
                      type: 'box',
                      isCurrentlyWishlisted: box.is_wishlisted ?? false,
                      boxSetId,
                    })}
                    isPending={toggleWishlist.isPending}
                  />
                )}
              </div>
            ))}
          </MangaGrid>
        </motion.section>
      )}

      {/* Barre de sélection (portal) — visible quand sélection > 0 */}
      <LoanSelectBar
        count={selectedIds.size}
        onLoan={() => setIsLoanOpen(true)}
      />

      {/* Loan bottom sheet */}
      <BottomSheet
        open={isLoanOpen}
        onClose={handleCloseLoanSheet}
        title={`Prêter ${selectedIds.size} boîte${selectedIds.size > 1 ? 's' : ''}`}
      >
        <div className="flex flex-col gap-4 pt-2">
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            À qui prêtez-vous {selectedIds.size > 1 ? 'ces boîtes' : 'cette boîte'} ?
          </p>
          <input
            type="text"
            value={borrowerName}
            onChange={e => setBorrowerName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleConfirmLoan(); }}
            placeholder="Nom de l'emprunteur"
            autoFocus
            className="w-full h-11 px-3 text-sm outline-none"
            style={{
              background: 'var(--input)',
              border: '1px solid var(--border)',
              color: 'var(--foreground)',
              borderRadius: 'var(--radius)',
            }}
          />
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleCloseLoanSheet}
              className="flex-1 h-10 text-sm font-medium transition-opacity hover:opacity-80"
              style={{
                background: 'var(--secondary)',
                color: 'var(--foreground)',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--border)',
              }}
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleConfirmLoan}
              disabled={!borrowerName.trim() || bulkCreateBoxLoan.isPending}
              className="flex-1 h-10 text-sm font-semibold transition-opacity disabled:opacity-50 hover:opacity-80"
              style={{
                background: 'var(--primary)',
                color: 'var(--primary-foreground)',
                borderRadius: 'var(--radius)',
              }}
            >
              {bulkCreateBoxLoan.isPending ? 'Enregistrement…' : 'Confirmer'}
            </button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
