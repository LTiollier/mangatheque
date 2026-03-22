'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { BookUp, Loader2, Package2, Plus } from 'lucide-react';
import { toast } from 'sonner';

import {
  useBoxSetQuery,
  useToggleWishlist,
  useLoansQuery,
  useBulkCreateBoxLoan,
  useAddBoxToCollection,
  queryKeys,
} from '@/hooks/queries';
import { getApiErrorMessage } from '@/lib/error';
import { useMultiselect } from '@/hooks/useMultiselect';
import { useLoanSheet } from '@/hooks/useLoanSheet';
import { BackNav } from '@/components/collection/BackNav';
import { DetailHeader, gridSkeleton } from '@/components/collection/DetailHeader';
import { CollectionActionBar } from '@/components/collection/CollectionActionBar';
import { AddToCollectionBar } from '@/components/collection/AddToCollectionBar';
import { LoanSheet } from '@/components/collection/LoanSheet';
import { BoxItemCard } from '@/components/collection/BoxItemCard';
import { MangaGrid } from '@/components/cards/MangaGrid';
import { ConfirmationDialog } from '@/components/feedback/ConfirmationDialog';
import { EmptyState } from '@/components/feedback/EmptyState';
import { useConfirmationDialog } from '@/hooks/useConfirmationDialog';
import { sectionVariants } from '@/lib/motion';
import type { Box, Loan } from '@/types/manga';

interface BoxSetDetailClientProps {
  seriesId: number;
  boxSetId: number;
}

export function BoxSetDetailClient({ seriesId: _seriesId, boxSetId }: BoxSetDetailClientProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: boxSet, isLoading, isError } = useBoxSetQuery(boxSetId);
  const { data: loans = [] } = useLoansQuery();
  const toggleWishlist = useToggleWishlist();
  const bulkCreateBoxLoan = useBulkCreateBoxLoan();
  const addBox = useAddBoxToCollection();

  // Derived during render — no useEffect (rerender-derived-state-no-effect)
  const boxes: Box[] = boxSet?.boxes ?? [];
  const ownedBoxes = useMemo(() => boxes.filter(b => b.is_owned), [boxes]);
  const nonOwnedBoxes = useMemo(() => boxes.filter(b => !b.is_owned), [boxes]);
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

  const { selectedIds, handleToggle, toggleSelectAll, selectMany, clearSelection, isAllSelected } = useMultiselect(ownedBoxes);
  const { isLoanOpen, borrowerName, setBorrowerName, openLoanSheet, closeLoanSheet } = useLoanSheet();

  // Non-owned selection — add to collection (rerender-lazy-state-init)
  const [selectedNonOwnedBoxIds, setSelectedNonOwnedBoxIds] = useState<ReadonlySet<number>>(() => new Set());

  // Derived mode booleans — prevent cross-mode clicks (rerender-derived-state)
  const isAddMode = selectedNonOwnedBoxIds.size > 0;
  const isOwnedSelectMode = selectedIds.size > 0;

  // Dialog management
  const { isOpen, setIsOpen, confirm, handleConfirm, config } = useConfirmationDialog();

  // ── Add non-owned boxes to collection ────────────────────────────────────────

  function handleNonOwnedBoxToggle(box: Box) {
    setSelectedNonOwnedBoxIds(prev => {
      const next = new Set(prev);
      if (next.has(box.id)) next.delete(box.id); else next.add(box.id);
      return next;
    });
  }

  async function handleAddAllBoxes() {
    if (nonOwnedBoxes.length === 0) return;
    try {
      await Promise.all(nonOwnedBoxes.map(b => addBox.mutateAsync(b.id)));
      toast.success(`${nonOwnedBoxes.length} coffret${nonOwnedBoxes.length > 1 ? 's' : ''} ajouté${nonOwnedBoxes.length > 1 ? 's' : ''}`);
      queryClient.invalidateQueries({ queryKey: queryKeys.boxSet(boxSetId) });
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Erreur lors de l'ajout"));
    }
  }

  async function handleAddSelectedBoxes() {
    const ids = [...selectedNonOwnedBoxIds];
    if (ids.length === 0) return;
    try {
      await Promise.all(ids.map(id => addBox.mutateAsync(id)));
      toast.success(`${ids.length} coffret${ids.length > 1 ? 's' : ''} ajouté${ids.length > 1 ? 's' : ''}`);
      setSelectedNonOwnedBoxIds(new Set());
      queryClient.invalidateQueries({ queryKey: queryKeys.boxSet(boxSetId) });
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Erreur lors de l'ajout"));
    }
  }

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
            <div className="flex items-center gap-3">
              {ownedBoxes.length > 0 && (
                <>
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="text-xs font-medium transition-opacity hover:opacity-70"
                    style={{ color: 'var(--muted-foreground)' }}
                  >
                    {isAllSelected ? 'Tout désélectionner' : 'Tout sélectionner'}
                  </button>
                  <button
                    type="button"
                    onClick={() => confirm({
                      title: 'Tout prêter ?',
                      description: `Voulez-vous prêter tous les coffrets disponibles (${ownedBoxes.filter(v => !loanedSet.has(v.id)).length}) de ce lot ?`,
                      onConfirm: handleBulkLoanAll,
                      confirmLabel: 'Prêter tout',
                    })}
                    className="flex items-center gap-1 text-xs font-medium transition-opacity hover:opacity-80"
                    style={{ color: 'var(--primary)' }}
                  >
                    <BookUp size={11} aria-hidden />
                    Tout prêter
                  </button>
                </>
              )}
              {nonOwnedBoxes.length > 0 && (
                <button
                  type="button"
                  onClick={() => confirm({
                    title: 'Ajouter tout ?',
                    description: `Voulez-vous ajouter les ${nonOwnedBoxes.length} coffrets manquants à votre collection ?`,
                    onConfirm: handleAddAllBoxes,
                    confirmLabel: 'Ajouter tout',
                  })}
                  disabled={addBox.isPending}
                  className="flex items-center gap-1 text-xs font-medium transition-opacity disabled:opacity-50 hover:opacity-80"
                  style={{ color: 'var(--primary)' }}
                >
                  {addBox.isPending
                    ? <Loader2 size={11} className="animate-spin" aria-hidden />
                    : <Plus size={11} aria-hidden />}
                  Ajouter tout
                </button>
              )}
            </div>
          </div>

          <MangaGrid variant="series" className={isOwnedSelectMode || isAddMode ? 'pb-28' : undefined}>
            {boxes.map(box => (
              <BoxItemCard
                key={box.id}
                box={box}
                isLoaned={loanedSet.has(box.id)}
                isSelected={selectedIds.has(box.id)}
                onToggle={handleToggle}
                disabled={isAddMode}
                isWishlisted={box.is_wishlisted ?? false}
                onToggleWishlist={() => toggleWishlist.mutate({
                  id: box.id,
                  type: 'box',
                  isCurrentlyWishlisted: box.is_wishlisted ?? false,
                  boxSetId,
                })}
                wishlistPending={toggleWishlist.isPending}
                isAddSelected={selectedNonOwnedBoxIds.has(box.id)}
                onAddToggle={isOwnedSelectMode ? undefined : handleNonOwnedBoxToggle}
              />
            ))}
          </MangaGrid>
        </motion.section>
      )}

      <AddToCollectionBar
        count={selectedNonOwnedBoxIds.size}
        isPending={addBox.isPending}
        label={`Ajouter ${selectedNonOwnedBoxIds.size} coffret${selectedNonOwnedBoxIds.size > 1 ? 's' : ''}`}
        onConfirm={handleAddSelectedBoxes}
      />

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

      <ConfirmationDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        {...config!}
        onConfirm={handleConfirm}
      />
    </div>
  );
}
