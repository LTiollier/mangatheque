'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { BookMarked, BookUp, Package2 } from 'lucide-react';

import {
  useBoxQuery,
  useReadingProgressQuery,
  useLoansQuery,
  useBulkToggleReadingProgress,
  useBulkCreateLoan,
} from '@/hooks/queries';
import { useMultiselect } from '@/hooks/useMultiselect';
import { useLoanSheet } from '@/hooks/useLoanSheet';
import { BackNav } from '@/components/collection/BackNav';
import { DetailHeader, gridSkeleton } from '@/components/collection/DetailHeader';
import { CollectionActionBar } from '@/components/collection/CollectionActionBar';
import { LoanSheet } from '@/components/collection/LoanSheet';
import { VolumeActionCard } from '@/components/collection/VolumeActionCard';
import { EmptyState } from '@/components/feedback/EmptyState';
import { sectionVariants } from '@/lib/motion';
import type { Loan, Manga } from '@/types/manga';

interface BoxDetailClientProps {
  seriesId: number;
  boxId: number;
}

export function BoxDetailClient({ seriesId, boxId }: BoxDetailClientProps) {
  const router = useRouter();

  // Parallel queries — fired simultaneously (async-parallel)
  const { data: box, isLoading: boxLoading, isError } = useBoxQuery(boxId);
  const { data: readingProgress = [] } = useReadingProgressQuery();
  const { data: loans = [] } = useLoansQuery();

  // Mutations
  const { mutate: bulkToggle, isPending: togglePending } = useBulkToggleReadingProgress();
  const bulkCreateLoan = useBulkCreateLoan();

  // Derived during render (rerender-derived-state-no-effect)
  const volumes: Manga[] = box?.volumes ?? [];

  // O(1) lookup sets (js-set-map-lookups)
  const readSet = useMemo(
    () => new Set(readingProgress.map(p => p.volume_id)),
    [readingProgress],
  );

  const loanedSet = useMemo(
    () => new Set(
      loans
        .filter((l): l is Loan & { loanable_type: 'volume' } => !l.is_returned && l.loanable_type === 'volume')
        .map(l => l.loanable_id)
    ),
    [loans],
  );

  const ownedVolumes = useMemo(() => volumes.filter(v => v.is_owned), [volumes]);
  const allRead = ownedVolumes.length > 0 && ownedVolumes.every(v => readSet.has(v.id));

  const { selectedIds, handleToggle, handleSelectAll, selectMany, clearSelection } = useMultiselect(ownedVolumes);
  const { isLoanOpen, borrowerName, setBorrowerName, openLoanSheet, closeLoanSheet } = useLoanSheet();

  // Progress for header
  const ownedCount = ownedVolumes.length;
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

  // Tout marquer — acts on ALL owned volumes
  function handleBulkReadToggle() {
    const targetIds = allRead
      ? ownedVolumes.map(v => v.id)
      : ownedVolumes.filter(v => !readSet.has(v.id)).map(v => v.id);
    if (targetIds.length > 0) bulkToggle(targetIds);
  }

  // Tout prêter — pre-selects non-loaned owned volumes then opens sheet
  function handleBulkLoanAll() {
    selectMany(ownedVolumes.filter(v => !loanedSet.has(v.id)));
    openLoanSheet();
  }

  // Marquer — toggle on current selection
  function handleMarkSelected() {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    bulkToggle(ids);
    clearSelection();
  }

  function handleConfirmLoan() {
    if (!borrowerName.trim() || selectedIds.size === 0) return;
    bulkCreateLoan.mutate(
      { volumeIds: [...selectedIds], borrowerName: borrowerName.trim() },
      {
        onSuccess: () => {
          closeLoanSheet();
          clearSelection();
        },
      },
    );
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
            {ownedVolumes.length > 0 && (
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
                  onClick={handleBulkReadToggle}
                  disabled={togglePending}
                  className="flex items-center gap-1 text-xs font-medium transition-opacity disabled:opacity-50 hover:opacity-80"
                  style={{ color: 'var(--primary)' }}
                >
                  <BookMarked size={11} aria-hidden />
                  {allRead ? 'Tout démarquer' : 'Tout marquer'}
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

          <div className={`manga-grid ${selectedIds.size > 0 ? 'pb-28' : ''}`}>
            {volumes.map(manga => (
              <VolumeActionCard
                key={manga.id}
                manga={manga}
                isRead={readSet.has(manga.id)}
                isLoaned={loanedSet.has(manga.id)}
                isSelected={selectedIds.has(manga.id)}
                onToggle={handleToggle}
              />
            ))}
          </div>
        </motion.section>
      )}

      <CollectionActionBar
        count={selectedIds.size}
        onMarkRead={handleMarkSelected}
        onLoan={openLoanSheet}
        markPending={togglePending}
      />

      <LoanSheet
        open={isLoanOpen}
        onClose={closeLoanSheet}
        title={`Prêter ${selectedIds.size} volume${selectedIds.size > 1 ? 's' : ''}`}
        question={`À qui prêtez-vous ${selectedIds.size > 1 ? 'ces volumes' : 'ce volume'} ?`}
        borrowerName={borrowerName}
        onBorrowerNameChange={setBorrowerName}
        onConfirm={handleConfirmLoan}
        isPending={bulkCreateLoan.isPending}
      />
    </div>
  );
}
