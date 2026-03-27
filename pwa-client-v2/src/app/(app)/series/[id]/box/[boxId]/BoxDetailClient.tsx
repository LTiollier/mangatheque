'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Package2 } from 'lucide-react';
import { toast } from 'sonner';

import {
  useBoxQuery,
  useReadingProgressQuery,
  useLoansQuery,
  useBulkToggleReadingProgress,
  useCreateLoan,
  useAddBulkToCollection,
  useBulkRemoveVolumesFromCollection,
  queryKeys,
} from '@/hooks/queries';
import { getApiErrorMessage } from '@/lib/error';
import { useMultiselect } from '@/hooks/useMultiselect';
import { useLoanSheet } from '@/hooks/useLoanSheet';
import { BackNav } from '@/components/collection/BackNav';
import { DetailHeader, gridSkeleton } from '@/components/collection/DetailHeader';
import { UnifiedActionBar } from '@/components/collection/UnifiedActionBar';
import { LoanSheet } from '@/components/collection/LoanSheet';
import { VolumeActionCard } from '@/components/collection/VolumeActionCard';
import { ConfirmationDialog } from '@/components/feedback/ConfirmationDialog';
import { EmptyState } from '@/components/feedback/EmptyState';
import { useConfirmationDialog } from '@/hooks/useConfirmationDialog';
import { sectionVariants } from '@/lib/motion';
import type { Volume } from '@/types/volume';

interface BoxDetailClientProps {
  seriesId: number;
  boxId: number;
}

export function BoxDetailClient({ seriesId, boxId }: BoxDetailClientProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Parallel queries — fired simultaneously (async-parallel)
  const { data: box, isLoading: boxLoading, isError } = useBoxQuery(boxId);
  const { data: readingProgress = [] } = useReadingProgressQuery();
  const { data: loans = [] } = useLoansQuery();

  // Mutations
  const { mutate: bulkToggle, isPending: togglePending } = useBulkToggleReadingProgress();
  const createLoan = useCreateLoan();
  const addBulk = useAddBulkToCollection();
  const bulkRemove = useBulkRemoveVolumesFromCollection();

  // Derived during render (rerender-derived-state-no-effect)
  // Wrapped in useMemo to stabilize the reference for dependent memos (rerender-memo)
  const volumes: Volume[] = useMemo(() => box?.volumes ?? [], [box?.volumes]);

  // O(1) lookup sets (js-set-map-lookups)
  const readSet = useMemo(
    () => new Set(readingProgress.map(p => p.volume_id)),
    [readingProgress],
  );

  const loanedSet = useMemo(() => {
    const set = new Set<number>();
    for (const loan of loans) {
      if (!loan.is_returned) {
        for (const item of loan.items) {
          if (item.loanable_type === 'volume') set.add(item.loanable_id);
        }
      }
    }
    return set;
  }, [loans]);

  const ownedSet = useMemo(() => new Set(volumes.filter(v => v.is_owned).map(v => v.id)), [volumes]);
  const nonOwnedVolumes = useMemo(() => volumes.filter(v => !v.is_owned), [volumes]);

  // Unified selection over all volumes (rerender-memo)
  const { selectedIds, handleToggle, selectMany, clearSelection } = useMultiselect(volumes);

  // Derived owned/non-owned from unified selection (rerender-derived-state)
  const selectedOwned = useMemo(
    () => [...selectedIds].filter(id => ownedSet.has(id)),
    [selectedIds, ownedSet],
  );
  const selectedNonOwned = useMemo(
    () => [...selectedIds].filter(id => !ownedSet.has(id)),
    [selectedIds, ownedSet],
  );

  const ownedSelectedUnread = useMemo(
    () => selectedOwned.filter(id => !readSet.has(id)),
    [selectedOwned, readSet],
  );

  const { isLoanOpen, loanItems, openLoanSheet, closeLoanSheet } = useLoanSheet();
  const { isOpen, setIsOpen, confirm, handleConfirm, config } = useConfirmationDialog();

  // Progress for header
  const ownedCount = ownedSet.size;
  const totalVolumes = box?.total_volumes ?? (volumes.length > 0 ? volumes.length : null);
  const progressValue = totalVolumes && totalVolumes > 0
    ? Math.round((ownedCount / totalVolumes) * 100)
    : null;

  // Back nav — always navigate to parent box-set URL (no router.back() fallback)
  const boxSetId = box?.box_set_id ?? box?.box_set?.id;
  function handleBack() {
    if (boxSetId) {
      router.push(`/series/${seriesId}/box-set/${boxSetId}`);
    } else {
      router.back();
    }
  }

  // ── 3-state select-all cycle ─────────────────────────────────────────────────

  function handleSelectAll() {
    if (selectedIds.size === 0) {
      selectMany(volumes);
    } else if (selectedIds.size === volumes.length) {
      selectMany(nonOwnedVolumes);
    } else {
      clearSelection();
    }
  }

  const selectAllLabel =
    selectedIds.size === 0 ? 'Tout sélectionner'
    : selectedIds.size === volumes.length ? 'Seulement les manquants'
    : 'Tout désélectionner';

  // ── Actions ──────────────────────────────────────────────────────────────────

  function parseVolumeNumber(volume: Volume): number | null {
    const n = parseInt(volume.number ?? '');
    return isNaN(n) ? null : n;
  }

  function handleAddSelected(nonOwnedIds: number[]) {
    const byEdition = new Map<number, number[]>();
    for (const volume of nonOwnedVolumes) {
      const editionId = volume.edition?.id;
      const n = parseVolumeNumber(volume);
      if (editionId == null || n === null || !nonOwnedIds.includes(volume.id)) continue;
      const group = byEdition.get(editionId) ?? [];
      group.push(n);
      byEdition.set(editionId, group);
    }
    if (byEdition.size === 0) return;
    const count = nonOwnedIds.length;
    Promise.all([...byEdition.entries()].map(([editionId, numbers]) =>
      addBulk.mutateAsync({ editionId, numbers }),
    )).then(() => {
      toast.success(`${count} tome${count > 1 ? 's' : ''} ajouté${count > 1 ? 's' : ''}`);
      clearSelection();
      queryClient.invalidateQueries({ queryKey: queryKeys.box(boxId) });
    }).catch(err => toast.error(getApiErrorMessage(err, "Erreur lors de l'ajout")));
  }

  function handleMarkSelected(ids: number[]) {
    if (ids.length === 0) return;
    bulkToggle(ids);
    clearSelection();
  }

  function handleRemoveSelected(ids: number[]) {
    if (ids.length === 0) return;
    confirm({
      title: 'Retirer de la collection ?',
      description: `Voulez-vous retirer les ${ids.length} tome${ids.length > 1 ? 's' : ''} sélectionné${ids.length > 1 ? 's' : ''} de votre collection ?`,
      onConfirm: () => {
        bulkRemove.mutate(ids, {
          onSuccess: () => {
            clearSelection();
            queryClient.invalidateQueries({ queryKey: queryKeys.box(boxId) });
          },
        });
      },
      confirmLabel: 'Retirer',
      variant: 'danger',
    });
  }

  return (
    <div className="flex flex-col gap-8">
      <BackNav onClick={handleBack} label="Coffret" />

      {/* Box header */}
      {isError ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm" style={{ color: 'var(--destructive)' }}>
            Impossible de charger cette boîte.
          </p>
          <button
            type="button"
            onClick={handleBack}
            className="text-sm font-medium transition-opacity hover:opacity-80 text-left"
            style={{ color: 'var(--primary)' }}
          >
            ← Retour
          </button>
        </div>
      ) : box ? (
        <DetailHeader
          isLoading={false}
          coverUrl={box.cover_url}
          title={box.title}
          subtitle={box.number ? `Boîte ${box.number}` : null}
          progress={progressValue !== null ? {
            value: progressValue,
            label: `${ownedCount} / ${totalVolumes} vol. possédés`,
            ariaLabel: `${ownedCount} volumes sur ${totalVolumes} possédés`,
          } : null}
          fallbackIcon={<Package2 size={24} aria-hidden style={{ color: 'var(--muted-foreground)' }} />}
        />
      ) : (
        <DetailHeader
          isLoading={boxLoading}
          coverUrl={null}
          title=""
          fallbackIcon={<Package2 size={24} aria-hidden style={{ color: 'var(--muted-foreground)' }} />}
        />
      )}

      {/* Volume grid */}
      {boxLoading ? (
        gridSkeleton
      ) : volumes.length === 0 && !isError ? (
        <EmptyState context="collection" />
      ) : (
        <motion.section
          variants={sectionVariants}
          initial="initial"
          animate="animate"
          aria-label="Volumes de la boîte"
        >
          <div className="flex items-center justify-between mb-4">
            <h2
              className="text-xs font-semibold uppercase"
              style={{ color: 'var(--muted-foreground)', letterSpacing: '0.08em' }}
            >
              {selectedIds.size > 0
                ? `${selectedIds.size} sélectionné${selectedIds.size > 1 ? 's' : ''}`
                : `Volumes (${volumes.length})`}
            </h2>
            {volumes.length > 0 && (
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

          <div className={`volume-grid ${selectedIds.size > 0 ? 'pb-28' : ''}`}>
            {volumes.map(volume => (
              <VolumeActionCard
                key={volume.id}
                volume={volume}
                isRead={readSet.has(volume.id)}
                isLoaned={loanedSet.has(volume.id)}
                isSelected={selectedIds.has(volume.id)}
                onToggle={handleToggle}
              />
            ))}
          </div>
        </motion.section>
      )}

      <UnifiedActionBar
        variant="edition"
        ownedSelected={selectedOwned}
        nonOwnedSelected={selectedNonOwned}
        onAdd={handleAddSelected}
        onMarkRead={handleMarkSelected}
        ownedSelectedUnread={ownedSelectedUnread}
        onLoan={() => openLoanSheet(selectedOwned.map(id => ({ type: 'volume' as const, id })))}
        onRemove={handleRemoveSelected}
        addPending={addBulk.isPending}
        markPending={togglePending}
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
