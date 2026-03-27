'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Package2 } from 'lucide-react';
import { toast } from 'sonner';

import {
  useBoxSetQuery,
  useToggleWishlist,
  useLoansQuery,
  useCreateLoan,
  useAddBoxToCollection,
  useBulkRemoveBoxesFromCollection,
  queryKeys,
} from '@/hooks/queries';
import { getApiErrorMessage } from '@/lib/error';
import { useMultiselect } from '@/hooks/useMultiselect';
import { useLoanSheet } from '@/hooks/useLoanSheet';
import { BackNav } from '@/components/collection/BackNav';
import { DetailHeader, gridSkeleton } from '@/components/collection/DetailHeader';
import { UnifiedActionBar } from '@/components/collection/UnifiedActionBar';
import { LoanSheet } from '@/components/collection/LoanSheet';
import { BoxItemCard } from '@/components/collection/BoxItemCard';
import { VolumeGrid } from '@/components/cards/VolumeGrid';
import { ConfirmationDialog } from '@/components/feedback/ConfirmationDialog';
import { EmptyState } from '@/components/feedback/EmptyState';
import { useConfirmationDialog } from '@/hooks/useConfirmationDialog';
import { sectionVariants } from '@/lib/motion';
import type { Box } from '@/types/volume';

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
  const createLoan = useCreateLoan();
  const addBox = useAddBoxToCollection();
  const bulkRemove = useBulkRemoveBoxesFromCollection();

  // Derived during render — no useEffect (rerender-derived-state-no-effect)
  // Wrapped in useMemo to stabilize the reference for dependent memos (rerender-memo)
  const boxes: Box[] = useMemo(() => boxSet?.boxes ?? [], [boxSet?.boxes]);
  const nonOwnedBoxes = useMemo(() => boxes.filter(b => !b.is_owned), [boxes]);
  const ownedSet = useMemo(() => new Set(boxes.filter(b => b.is_owned).map(b => b.id)), [boxes]);
  const ownedCount = ownedSet.size;
  const progressValue = boxes.length > 0 ? Math.round((ownedCount / boxes.length) * 100) : null;

  // O(1) loaned lookup — iterate items (js-set-map-lookups)
  const loanedSet = useMemo(() => {
    const set = new Set<number>();
    for (const loan of loans) {
      if (!loan.is_returned) {
        for (const item of loan.items) {
          if (item.loanable_type === 'box') set.add(item.loanable_id);
        }
      }
    }
    return set;
  }, [loans]);

  // Unified selection over all boxes (rerender-memo)
  const { selectedIds, handleToggle, selectMany, clearSelection } = useMultiselect(boxes);

  // Derived owned/non-owned from unified selection (rerender-derived-state)
  const selectedOwned = useMemo(
    () => [...selectedIds].filter(id => ownedSet.has(id)),
    [selectedIds, ownedSet],
  );
  const selectedNonOwned = useMemo(
    () => [...selectedIds].filter(id => !ownedSet.has(id)),
    [selectedIds, ownedSet],
  );

  const { isLoanOpen, loanItems, openLoanSheet, closeLoanSheet } = useLoanSheet();
  const { isOpen, setIsOpen, confirm, handleConfirm, config } = useConfirmationDialog();

  // ── 3-state select-all cycle ─────────────────────────────────────────────────

  function handleSelectAll() {
    if (selectedIds.size === 0) {
      selectMany(boxes);
    } else if (selectedIds.size === boxes.length) {
      selectMany(nonOwnedBoxes);
    } else {
      clearSelection();
    }
  }

  const selectAllLabel =
    selectedIds.size === 0 ? 'Tout sélectionner'
    : selectedIds.size === boxes.length ? 'Seulement les manquants'
    : 'Tout désélectionner';

  // ── Actions ──────────────────────────────────────────────────────────────────

  async function handleAddSelected(nonOwnedIds: number[]) {
    if (nonOwnedIds.length === 0) return;
    try {
      await Promise.all(nonOwnedIds.map(id => addBox.mutateAsync(id)));
      toast.success(`${nonOwnedIds.length} coffret${nonOwnedIds.length > 1 ? 's' : ''} ajouté${nonOwnedIds.length > 1 ? 's' : ''}`);
      clearSelection();
      queryClient.invalidateQueries({ queryKey: queryKeys.boxSet(boxSetId) });
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Erreur lors de l'ajout"));
    }
  }

  async function handleBulkWishlist(nonOwnedIds: number[]) {
    const toAdd = nonOwnedIds.filter(id => {
      const box = boxes.find(b => b.id === id);
      return box && !box.is_wishlisted;
    });
    if (toAdd.length === 0) return;
    try {
      await Promise.all(
        toAdd.map(id => toggleWishlist.mutateAsync({ id, type: 'box', isCurrentlyWishlisted: false, boxSetId })),
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.boxSet(boxSetId) });
    } catch {
      // error handled by mutation
    }
  }

  function handleRemoveSelected(ids: number[]) {
    if (ids.length === 0) return;
    confirm({
      title: 'Retirer de la collection ?',
      description: `Voulez-vous retirer les ${ids.length} coffret${ids.length > 1 ? 's' : ''} sélectionné${ids.length > 1 ? 's' : ''} de votre collection ?`,
      onConfirm: () => {
        bulkRemove.mutate(ids, {
          onSuccess: () => {
            clearSelection();
            queryClient.invalidateQueries({ queryKey: queryKeys.boxSet(boxSetId) });
          },
        });
      },
      confirmLabel: 'Retirer',
      variant: 'danger',
    });
  }

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
            {boxes.length > 0 && (
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-xs font-medium transition-opacity hover:opacity-70 cursor-pointer"
                style={{ color: 'var(--muted-foreground)' }}
              >
                {selectAllLabel}
              </button>
            )}
          </div>

          <VolumeGrid variant="series" className={selectedIds.size > 0 ? 'pb-28' : undefined}>
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
          </VolumeGrid>
        </motion.section>
      )}

      <UnifiedActionBar
        variant="boxset"
        ownedSelected={selectedOwned}
        ownedSelectedUnread={[]}
        nonOwnedSelected={selectedNonOwned}
        onAdd={handleAddSelected}
        onLoan={() => openLoanSheet(selectedOwned.map(id => ({ type: 'box' as const, id })))}
        onRemove={handleRemoveSelected}
        onWishlist={handleBulkWishlist}
        addPending={addBox.isPending}
        removePending={bulkRemove.isPending}
        loanPending={createLoan.isPending}
      />

      <LoanSheet
        items={loanItems}
        open={isLoanOpen}
        onClose={() => { closeLoanSheet(); clearSelection(); }}
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
