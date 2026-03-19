'use client';

import { useState, useMemo, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ChevronLeft, Package, BookMarked, BookUp, PlusCircle } from 'lucide-react';

import {
  useEditionQuery,
  useReadingProgressQuery,
  useBulkToggleReadingProgress,
  useReturnLoan,
  useCreateLoan,
  useAddToCollection,
  queryKeys,
} from '@/hooks/queries';
import { BottomSheet } from '@/components/feedback/BottomSheet';
import { EmptyState } from '@/components/feedback/EmptyState';
import { sectionVariants } from '@/lib/motion';
import type { Manga } from '@/types/manga';

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
      <div className="skeleton h-[3px] w-full rounded-full mt-2" />
      <div className="skeleton h-3 w-1/4 rounded" />
    </div>
  </div>
);

const gridSkeleton = (
  <div className="manga-grid" aria-busy aria-hidden>
    {Array.from({ length: 12 }, (_, i) => (
      <div key={i} className="manga-card skeleton" aria-hidden />
    ))}
  </div>
);

// Hoisted decorators reused in VolumeActionCard (rendering-hoist-jsx)
const bottomGradient = (
  <div
    aria-hidden
    className="absolute inset-0 pointer-events-none"
    style={{ background: 'linear-gradient(to top, oklch(0% 0 0 / 0.65) 0%, transparent 55%)' }}
  />
);

const coverFallback = (
  <div className="absolute inset-0 flex items-center justify-center">
    <Package size={24} aria-hidden style={{ color: 'var(--muted-foreground)' }} />
  </div>
);

// ─── VolumeActionCard — defined outside parent (rerender-no-inline-components) ─

interface VolumeActionCardProps {
  manga: Manga;
  isRead: boolean;
  onSelect: (manga: Manga) => void;
}

function VolumeActionCard({ manga, isRead, onSelect }: VolumeActionCardProps) {
  return (
    <button
      type="button"
      className="manga-card block w-full"
      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
      onClick={() => onSelect(manga)}
      aria-label={`${manga.title}${manga.number ? ` — tome ${manga.number}` : ''}`}
    >
      {manga.cover_url ? (
        <Image
          src={manga.cover_url}
          alt={manga.title ?? `Tome ${manga.number}`}
          fill
          sizes="(max-width: 480px) 33vw, (max-width: 768px) 25vw, 16vw"
          className="object-cover"
        />
      ) : (
        coverFallback
      )}

      {bottomGradient}

      {/* Dimmed overlay for non-owned volumes */}
      {!manga.is_owned && (
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'oklch(0% 0 0 / 0.45)' }}
        />
      )}

      {/* Read dot — top left */}
      {isRead && (
        <span className="status-dot status-dot--read absolute top-1.5 left-1.5" aria-label="Lu" />
      )}

      {/* Loaned badge — top right */}
      {manga.is_loaned && (
        <div
          aria-label="Prêté"
          className="absolute top-1.5 right-1.5 flex items-center justify-center w-[22px] h-[22px] rounded"
          style={{ background: 'var(--color-loaned)' }}
        >
          <BookUp size={14} style={{ color: 'var(--background)' }} aria-hidden />
        </div>
      )}

      {/* Volume number label */}
      {manga.number && (
        <div className="absolute bottom-0 left-0 right-0 px-1.5 pb-1.5">
          <span
            className="text-[11px] font-medium leading-none"
            style={{ color: 'var(--foreground)', fontFamily: 'var(--font-mono)' }}
          >
            #{manga.number}
          </span>
        </div>
      )}
    </button>
  );
}

// ─── EditionDetailClient ─────────────────────────────────────────────────────

interface EditionDetailClientProps {
  seriesId: number;
  editionId: number;
}

export function EditionDetailClient({ seriesId, editionId }: EditionDetailClientProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Parallel queries — fired simultaneously (async-parallel)
  const { data: edition, isLoading: editionLoading, isError } = useEditionQuery(editionId);
  const { data: readingProgress = [] } = useReadingProgressQuery();

  // Mutations
  const { mutate: bulkToggle, isPending: togglePending } = useBulkToggleReadingProgress();
  const returnLoan = useReturnLoan();
  const createLoan = useCreateLoan();
  const addToCollection = useAddToCollection();

  // Bottom sheet state
  const [selectedVolume, setSelectedVolume] = useState<Manga | null>(null);
  const [isLoanStep, setIsLoanStep] = useState(false);
  const [borrowerName, setBorrowerName] = useState('');

  // Preserve last known volume during bottom sheet exit animation
  // (rerender-use-ref-transient-values — ref keeps content visible while sheet slides out)
  const lastVolumeRef = useRef<Manga | null>(null);
  if (selectedVolume !== null) lastVolumeRef.current = selectedVolume;
  const displayVolume = selectedVolume ?? lastVolumeRef.current;

  // Derived during render — no useEffect (rerender-derived-state-no-effect)
  const volumes: Manga[] = edition?.volumes ?? [];

  // Set for O(1) read lookup (js-set-map-lookups)
  const readSet = useMemo(
    () => new Set(readingProgress.map(p => p.volume_id)),
    [readingProgress],
  );

  const ownedVolumes = useMemo(() => volumes.filter(v => v.is_owned), [volumes]);
  const allRead = ownedVolumes.length > 0 && ownedVolumes.every(v => readSet.has(v.id));

  // Progress for header
  const possessedCount = edition?.possessed_count ?? ownedVolumes.length;
  const totalVolumes = edition?.total_volumes ?? null;
  const progress =
    totalVolumes && totalVolumes > 0
      ? Math.round((possessedCount / totalVolumes) * 100)
      : null;

  // Derived read status of the currently selected volume
  const isSelectedRead = displayVolume ? readSet.has(displayVolume.id) : false;

  // ── Sheet title — updates on loan step change
  const sheetTitle = isLoanStep
    ? 'Prêter ce volume'
    : displayVolume
    ? `Tome ${displayVolume.number ?? '?'}`
    : undefined;

  function handleCloseSheet() {
    setSelectedVolume(null);
    setIsLoanStep(false);
    setBorrowerName('');
  }

  function invalidateEdition() {
    queryClient.invalidateQueries({ queryKey: queryKeys.edition(editionId) });
  }

  function handleBulkReadToggle() {
    const targetIds = allRead
      ? ownedVolumes.map(v => v.id)
      : ownedVolumes.filter(v => !readSet.has(v.id)).map(v => v.id);
    if (targetIds.length > 0) bulkToggle(targetIds);
  }

  function handleToggleRead() {
    if (!displayVolume) return;
    bulkToggle([displayVolume.id]);
    handleCloseSheet();
  }

  function handleReturnLoan() {
    if (!displayVolume) return;
    returnLoan.mutate(
      { id: displayVolume.id, type: 'volume' },
      { onSuccess: () => { invalidateEdition(); handleCloseSheet(); } },
    );
  }

  function handleCreateLoan() {
    if (!displayVolume || !borrowerName.trim()) return;
    createLoan.mutate(
      { id: displayVolume.id, type: 'volume', borrowerName: borrowerName.trim() },
      { onSuccess: () => { invalidateEdition(); handleCloseSheet(); } },
    );
  }

  function handleAddToCollection() {
    if (!displayVolume?.api_id) return;
    addToCollection.mutate(displayVolume.api_id, {
      onSuccess: () => { invalidateEdition(); handleCloseSheet(); },
    });
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

      {/* Edition header */}
      {editionLoading ? (
        headerSkeleton
      ) : isError ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm" style={{ color: 'var(--destructive)' }}>
            Impossible de charger cette édition.
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
      ) : edition ? (
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
            {edition.cover_url ? (
              <Image
                src={edition.cover_url}
                alt={edition.name}
                fill
                sizes="80px"
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <Package size={24} aria-hidden style={{ color: 'var(--muted-foreground)' }} />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col justify-center gap-1.5 min-w-0 flex-1">
            <h1
              className="text-xl font-bold leading-tight"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}
            >
              {edition.name}
            </h1>
            {edition.publisher && (
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                {edition.publisher}
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
                  aria-label={`${possessedCount} volumes sur ${totalVolumes} possédés`}
                >
                  <div className="manga-progress__fill" style={{ width: `${progress}%` }} />
                </div>
                <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  {possessedCount} / {totalVolumes} vol. possédés
                </p>
              </>
            )}
          </div>
        </motion.div>
      ) : null}

      {/* Volume grid */}
      {editionLoading ? (
        gridSkeleton
      ) : volumes.length === 0 && !isError ? (
        <EmptyState context="collection" />
      ) : (
        <motion.section
          variants={sectionVariants}
          initial="initial"
          animate="animate"
          aria-label="Volumes de l'édition"
        >
          {/* Section header */}
          <div className="flex items-center justify-between mb-4">
            <h2
              className="text-xs font-semibold uppercase"
              style={{ color: 'var(--muted-foreground)', letterSpacing: '0.08em' }}
            >
              Volumes ({volumes.length})
            </h2>
            {ownedVolumes.length > 0 && (
              <button
                type="button"
                onClick={handleBulkReadToggle}
                disabled={togglePending}
                className="flex items-center gap-1.5 text-xs font-medium transition-opacity disabled:opacity-50 hover:opacity-80"
                style={{ color: 'var(--primary)' }}
              >
                <BookMarked size={13} aria-hidden />
                {allRead ? 'Tout démarquer' : 'Tout marquer'}
              </button>
            )}
          </div>

          <div className="manga-grid">
            {volumes.map(manga => (
              <VolumeActionCard
                key={manga.id}
                manga={manga}
                isRead={readSet.has(manga.id)}
                onSelect={setSelectedVolume}
              />
            ))}
          </div>
        </motion.section>
      )}

      {/* Per-volume action bottom sheet */}
      <BottomSheet open={!!selectedVolume} onClose={handleCloseSheet} title={sheetTitle}>
        {displayVolume && !isLoanStep && (
          <div className="flex flex-col gap-1 pt-2">
            {/* Volume subtitle */}
            <p className="text-sm mb-2 leading-snug" style={{ color: 'var(--muted-foreground)' }}>
              {displayVolume.title}
            </p>

            {displayVolume.is_owned ? (
              <>
                {/* Toggle read */}
                <button
                  type="button"
                  onClick={handleToggleRead}
                  disabled={togglePending}
                  className="flex items-center gap-3 w-full text-sm font-medium py-3 border-b transition-opacity disabled:opacity-50 hover:opacity-80"
                  style={{ color: 'var(--foreground)', borderColor: 'var(--border)' }}
                >
                  <BookMarked size={18} aria-hidden style={{ color: 'var(--primary)' }} />
                  {isSelectedRead ? 'Marquer comme non lu' : 'Marquer comme lu'}
                </button>

                {/* Return or loan */}
                {displayVolume.is_loaned ? (
                  <button
                    type="button"
                    onClick={handleReturnLoan}
                    disabled={returnLoan.isPending}
                    className="flex items-center gap-3 w-full text-sm font-medium py-3 transition-opacity disabled:opacity-50 hover:opacity-80"
                    style={{ color: 'var(--foreground)' }}
                  >
                    <BookUp size={18} aria-hidden style={{ color: 'var(--muted-foreground)' }} />
                    {returnLoan.isPending ? 'Traitement…' : 'Marquer comme retourné'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsLoanStep(true)}
                    className="flex items-center gap-3 w-full text-sm font-medium py-3 transition-opacity hover:opacity-80"
                    style={{ color: 'var(--foreground)' }}
                  >
                    <BookUp size={18} aria-hidden style={{ color: 'var(--muted-foreground)' }} />
                    Prêter ce volume
                  </button>
                )}
              </>
            ) : (
              /* Non-owned volume */
              <>
                <p className="text-sm py-2" style={{ color: 'var(--muted-foreground)' }}>
                  Vous ne possédez pas ce volume.
                </p>
                {displayVolume.api_id && (
                  <button
                    type="button"
                    onClick={handleAddToCollection}
                    disabled={addToCollection.isPending}
                    className="flex items-center gap-3 w-full text-sm font-medium py-3 transition-opacity disabled:opacity-50 hover:opacity-80"
                    style={{ color: 'var(--primary)' }}
                  >
                    <PlusCircle size={18} aria-hidden />
                    {addToCollection.isPending ? 'Ajout…' : 'Ajouter à la collection'}
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {/* Loan form step */}
        {displayVolume && isLoanStep && (
          <div className="flex flex-col gap-4 pt-2">
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
              À qui prêtez-vous ce volume ?
            </p>
            <input
              type="text"
              value={borrowerName}
              onChange={e => setBorrowerName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleCreateLoan(); }}
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
                onClick={() => setIsLoanStep(false)}
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
                onClick={handleCreateLoan}
                disabled={!borrowerName.trim() || createLoan.isPending}
                className="flex-1 h-10 text-sm font-semibold transition-opacity disabled:opacity-50 hover:opacity-80"
                style={{
                  background: 'var(--primary)',
                  color: 'var(--primary-foreground)',
                  borderRadius: 'var(--radius)',
                }}
              >
                {createLoan.isPending ? 'Enregistrement…' : 'Confirmer'}
              </button>
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}
