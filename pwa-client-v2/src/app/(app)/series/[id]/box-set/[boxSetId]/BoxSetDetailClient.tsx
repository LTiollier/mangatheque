'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { BookUp, Package2 } from 'lucide-react';

import {
  useBoxSetQuery,
  useToggleWishlist,
  useLoansQuery,
  useBulkCreateBoxLoan,
} from '@/hooks/queries';
import { useMultiselect } from '@/hooks/useMultiselect';
import { useLoanSheet } from '@/hooks/useLoanSheet';
import { BackNav } from '@/components/collection/BackNav';
import { DetailHeader, gridSkeleton } from '@/components/collection/DetailHeader';
import { CollectionActionBar } from '@/components/collection/CollectionActionBar';
import { LoanSheet } from '@/components/collection/LoanSheet';
import { BoxItemCard } from '@/components/collection/BoxItemCard';
import { MangaGrid } from '@/components/cards/MangaGrid';
import { EmptyState } from '@/components/feedback/EmptyState';
import { sectionVariants } from '@/lib/motion';
import type { Box, Loan } from '@/types/manga';

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

  // Derived during render — no useEffect (rerender-derived-state-no-effect)
  const boxes: Box[] = boxSet?.boxes ?? [];
  const ownedBoxes = useMemo(() => boxes.filter(b => b.is_owned), [boxes]);
  const ownedCount = ownedBoxes.length;
  const progressValue = boxes.length > 0 ? Math.round((ownedCount / boxes.length) * 100) : null;

  // O(1) loaned lookup (js-set-map-lookups)
  const loanedSet = useMemo(
    () => new Set(
      loans
        .filter((l): l is Loan & { loanable_type: 'box' } => !l.is_returned && l.loanable_type === 'box')
        .map(l => l.loanable_id)
    ),
    [loans],
  );

  const { selectedIds, handleToggle, handleSelectAll, selectMany, clearSelection } = useMultiselect(ownedBoxes);
  const { isLoanOpen, borrowerName, setBorrowerName, openLoanSheet, closeLoanSheet } = useLoanSheet();

  // Tout prêter — pre-selects non-loaned owned boxes then opens sheet
  function handleBulkLoanAll() {
    selectMany(ownedBoxes.filter(b => !loanedSet.has(b.id)));
    openLoanSheet();
  }

  function handleConfirmLoan() {
    if (!borrowerName.trim() || selectedIds.size === 0) return;
    bulkCreateBoxLoan.mutate(
      { boxIds: [...selectedIds], borrowerName: borrowerName.trim() },
      {
        onSuccess: () => {
          closeLoanSheet();
          clearSelection();
        },
      },
    );
  }

  // Pluriel accord boîtes pour le progress label
  const boxCountLabel = `${ownedCount} / ${boxes.length} boîte${boxes.length > 1 ? 's' : ''} possédée${ownedCount > 1 ? 's' : ''}`;

  return (
    <div className="flex flex-col gap-8">
      <BackNav onClick={() => router.back()} label="Série" />

      {/* BoxSet header */}
      {isError ? (
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
        <DetailHeader
          isLoading={false}
          coverUrl={boxSet.cover_url}
          title={boxSet.title}
          subtitle={boxSet.publisher}
          progress={progressValue !== null ? {
            value: progressValue,
            label: boxCountLabel,
            ariaLabel: `${ownedCount} boîtes sur ${boxes.length} possédées`,
          } : null}
          fallbackIcon={<Package2 size={24} aria-hidden style={{ color: 'var(--muted-foreground)' }} />}
        />
      ) : (
        <DetailHeader
          isLoading={isLoading}
          coverUrl={null}
          title=""
          fallbackIcon={<Package2 size={24} aria-hidden style={{ color: 'var(--muted-foreground)' }} />}
        />
      )}

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
              <BoxItemCard
                key={box.id}
                box={box}
                isLoaned={loanedSet.has(box.id)}
                isSelected={selectedIds.has(box.id)}
                onToggle={handleToggle}
                isWishlisted={box.is_wishlisted ?? false}
                onToggleWishlist={() => toggleWishlist.mutate({
                  id: box.id,
                  type: 'box',
                  isCurrentlyWishlisted: box.is_wishlisted ?? false,
                  boxSetId,
                })}
                wishlistPending={toggleWishlist.isPending}
              />
            ))}
          </MangaGrid>
        </motion.section>
      )}

      {/* CollectionActionBar — no onMarkRead (boxes have no read state) */}
      <CollectionActionBar
        count={selectedIds.size}
        onLoan={openLoanSheet}
        itemLabel="sélectionnée"
      />

      <LoanSheet
        open={isLoanOpen}
        onClose={closeLoanSheet}
        title={`Prêter ${selectedIds.size} boîte${selectedIds.size > 1 ? 's' : ''}`}
        question={`À qui prêtez-vous ${selectedIds.size > 1 ? 'ces boîtes' : 'cette boîte'} ?`}
        borrowerName={borrowerName}
        onBorrowerNameChange={setBorrowerName}
        onConfirm={handleConfirmLoan}
        isPending={bulkCreateBoxLoan.isPending}
      />
    </div>
  );
}
