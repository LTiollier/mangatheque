'use client';

import { useState, useTransition, useDeferredValue } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Search,
  Package,
  Package2,
  Plus,
  Loader2,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  SearchX,
  AlertCircle,
  Heart,
} from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

import {
  useSearchQuery,
  useEditionQuery,
  useBoxSetQuery,
  useAddBulkToCollection,
  useAddBoxToCollection,
  useToggleWishlist,
  queryKeys,
} from '@/hooks/queries';
import { VolumeGrid } from '@/components/cards/VolumeGrid';
import { useAuth } from '@/contexts/AuthContext';
import { sectionVariants, viewTransitionVariants } from '@/lib/motion';
import { useViewMode } from '@/contexts/ViewModeContext';
import { getApiErrorMessage } from '@/lib/error';
import { ConfirmationDialog } from '@/components/feedback/ConfirmationDialog';
import { useConfirmationDialog } from '@/hooks/useConfirmationDialog';
import type { Volume, Box, SeriesSearchResult, SearchEdition, SearchBoxSet, PaginatedSeriesSearchResult } from '@/types/volume';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildPageItems(current: number, last: number): (number | '…')[] {
  if (last <= 7) return Array.from({ length: last }, (_, i) => i + 1);
  const keep = new Set(
    [1, last, current - 1, current, current + 1].filter(p => p >= 1 && p <= last),
  );
  const sorted = Array.from(keep).sort((a, b) => a - b);
  const items: (number | '…')[] = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) items.push('…');
    items.push(sorted[i]);
  }
  return items;
}

function seriesCollectionStats(series: SeriesSearchResult) {
  const hasData = series.editions.some(e => e.possessed_count !== null);
  if (!hasData) return { possessed: 0, total: 0, hasData: false };
  const possessed = series.editions.reduce((s, e) => s + (e.possessed_count ?? 0), 0);
  const total = series.editions.reduce((s, e) => s + (e.total_volumes ?? 0), 0);
  return { possessed, total, hasData: true };
}

// ─── Hoisted static JSX (rendering-hoist-jsx) ─────────────────────────────────

const seriesCoverFallback = (
  <div className="absolute inset-0 flex items-center justify-center">
    <Package size={32} aria-hidden style={{ color: 'var(--muted-foreground)' }} />
  </div>
);

const boxCoverFallback = (
  <div className="absolute inset-0 flex items-center justify-center">
    <Package2 size={32} aria-hidden style={{ color: 'var(--muted-foreground)' }} />
  </div>
);

const boxBadge = (
  <div
    className="absolute top-1.5 left-1.5 flex items-center justify-center w-[22px] h-[22px] rounded"
    style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
    aria-label="Coffret"
  >
    <Package2 size={12} style={{ color: 'var(--muted-foreground)' }} aria-hidden />
  </div>
);

const bottomGradient = (
  <div
    aria-hidden
    className="absolute inset-0 pointer-events-none"
    style={{ background: 'linear-gradient(to top, oklch(0% 0 0 / 0.65) 0%, transparent 55%)' }}
  />
);

const volumeCoverFallback = (
  <div className="absolute inset-0 flex items-center justify-center">
    <Package size={24} aria-hidden style={{ color: 'var(--muted-foreground)' }} />
  </div>
);

const gridSkeleton = (
  <div className="volume-grid" aria-busy aria-hidden>
    {Array.from({ length: 12 }, (_, i) => (
      <div key={i} className="volume-card skeleton" aria-hidden />
    ))}
  </div>
);

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

const resultsGridSkeleton = (
  <div className="volume-grid" aria-busy aria-hidden>
    {Array.from({ length: 10 }, (_, i) => (
      <div key={i} className="flex flex-col gap-2">
        <div
          className="skeleton rounded-[calc(var(--radius)*2)] w-full"
          style={{ aspectRatio: '2/3' }}
        />
        <div className="skeleton h-3.5 w-3/4 rounded" />
        <div className="skeleton h-3 w-1/2 rounded" />
      </div>
    ))}
  </div>
);

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
      onClick={e => { e.preventDefault(); e.stopPropagation(); onToggle(); }}
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

// ─── SearchSeriesCard — mirrors SeriesCard, button-based (rerender-no-inline-components)

interface SearchSeriesCardProps {
  series: SeriesSearchResult;
  onClick: (series: SeriesSearchResult) => void;
}

function SearchSeriesCard({ series, onClick }: SearchSeriesCardProps) {
  const { possessed, total, hasData } = seriesCollectionStats(series);
  const hasTotal = hasData && total > 0;

  const subLabel = hasData && hasTotal
    ? `${possessed} / ${total} vol.`
    : series.authors?.[0] ?? null;

  return (
    // w-full garantit que le button prend toute la cellule du grid (identique à SeriesCard <Link>)
    <button
      type="button"
      className="group flex flex-col gap-2 text-left w-full"
      onClick={() => onClick(series)}
    >
      <div
        className="relative overflow-hidden rounded-[calc(var(--radius)*2)] aspect-[2/3] w-full"
        style={{ background: 'var(--muted)' }}
      >
        {series.cover_url ? (
          <Image
            src={series.cover_url}
            alt={series.title}
            fill
            sizes="(max-width: 480px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
            className="object-cover transition-transform duration-200 group-hover:scale-[1.02]"
          />
        ) : (
          seriesCoverFallback
        )}
      </div>

      <div className="flex flex-col gap-1.5 px-0.5">
        <p
          className="text-sm font-semibold leading-tight line-clamp-2"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}
        >
          {series.title}
        </p>
        {subLabel && (
          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            {subLabel}
          </p>
        )}
        {hasTotal && (
          <div
            className="volume-progress overflow-hidden"
            role="progressbar"
            aria-valuenow={Math.min(Math.round((possessed / total) * 100), 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${possessed} / ${total} tomes possédés`}
          >
            <div
              className="h-full"
              style={{
                width: `${Math.min((possessed / total) * 100, 100)}%`,
                background: 'color-mix(in oklch, var(--primary) 25%, transparent)',
                float: 'left',
              }}
            />
          </div>
        )}
      </div>
    </button>
  );
}

// ─── SearchSeriesListRow — Vue Liste pour les résultats séries (rerender-no-inline-components)

interface SearchSeriesListRowProps {
  series: SeriesSearchResult;
  onClick: (series: SeriesSearchResult) => void;
}

function SearchSeriesListRow({ series, onClick }: SearchSeriesListRowProps) {
  const { possessed, total, hasData } = seriesCollectionStats(series);
  const hasTotal = hasData && total > 0;

  const countLabel = hasData && hasTotal
    ? `${possessed} / ${total} vol.`
    : series.authors?.[0] ?? null;

  return (
    <button
      type="button"
      className="flex items-center gap-3 py-3 border-b last:border-b-0 w-full text-left group"
      style={{ borderColor: 'var(--border)' }}
      onClick={() => onClick(series)}
      aria-label={`Voir ${series.title}`}
    >
      {/* Thumbnail */}
      <div
        className="shrink-0 w-12 relative overflow-hidden"
        style={{ aspectRatio: '2/3', background: 'var(--muted)', borderRadius: 'var(--radius)' }}
      >
        {series.cover_url ? (
          <Image src={series.cover_url} alt={series.title} fill sizes="48px" className="object-cover" />
        ) : (
          seriesCoverFallback
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-semibold truncate leading-tight"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}
        >
          {series.title}
        </p>
        {countLabel ? (
          <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--muted-foreground)' }}>
            {countLabel}
          </p>
        ) : null}
        {hasTotal ? (
          <div
            className="volume-progress mt-1.5 overflow-hidden"
            role="progressbar"
            aria-valuenow={Math.min(Math.round((possessed / total) * 100), 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${possessed} / ${total} tomes possédés`}
          >
            <div
              className="h-full"
              style={{
                width: `${Math.min((possessed / total) * 100, 100)}%`,
                background: 'color-mix(in oklch, var(--primary) 25%, transparent)',
                float: 'left',
              }}
            />
          </div>
        ) : null}
      </div>

      {/* Chevron */}
      <ChevronRight
        size={14}
        aria-hidden
        className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ color: 'var(--muted-foreground)' }}
      />
    </button>
  );
}

// ─── SearchEditionCard — Level 1, mirrors SeriesCard exactly (rerender-no-inline-components)

interface SearchEditionCardProps {
  edition: SearchEdition;
  onClick: (edition: SearchEdition) => void;
}

function SearchEditionCard({ edition, onClick }: SearchEditionCardProps) {
  const possessed = edition.possessed_count ?? 0;
  const total = edition.total_volumes ?? 0;
  const hasTotal = edition.possessed_count !== null && total > 0;
  const isComplete = hasTotal && possessed >= total;

  const countLabel = hasTotal ? `${possessed} / ${total} vol.` : total > 0 ? `${total} vol.` : null;

  return (
    // w-full garantit que le button prend toute la cellule du grid (identique à SeriesCard <Link>)
    <button
      type="button"
      className="group flex flex-col gap-2 text-left w-full"
      onClick={() => onClick(edition)}
    >
      <div
        className="relative overflow-hidden rounded-[calc(var(--radius)*2)] aspect-[2/3] w-full"
        style={{ background: 'var(--muted)' }}
      >
        {edition.cover_url ? (
          <Image
            src={edition.cover_url}
            alt={edition.name}
            fill
            sizes="(max-width: 480px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
            className="object-cover transition-transform duration-200 group-hover:scale-[1.02]"
          />
        ) : (
          seriesCoverFallback
        )}
        {isComplete && (
          <div
            className="absolute top-1.5 right-1.5 flex items-center justify-center w-[22px] h-[22px] rounded"
            style={{ background: 'var(--color-read)' }}
            aria-label="Édition complète"
          >
            <CheckCircle size={13} style={{ color: 'var(--background)' }} aria-hidden />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1.5 px-0.5">
        <p
          className="text-sm font-semibold leading-tight line-clamp-2"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}
        >
          {edition.name}
        </p>
        {countLabel && (
          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            {countLabel}
          </p>
        )}
        {hasTotal && (
          <div
            className="volume-progress overflow-hidden"
            role="progressbar"
            aria-valuenow={Math.min(Math.round((possessed / total) * 100), 100)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full"
              style={{
                width: `${Math.min((possessed / total) * 100, 100)}%`,
                background: isComplete
                  ? 'var(--color-read)'
                  : 'color-mix(in oklch, var(--primary) 25%, transparent)',
                float: 'left',
              }}
            />
          </div>
        )}
      </div>
    </button>
  );
}

// ─── SearchBoxSetCard — Level 1, mirrors BoxCard exactly (rerender-no-inline-components)

interface SearchBoxSetCardProps {
  boxSet: SearchBoxSet;
  onClick: (boxSet: SearchBoxSet) => void;
}

function SearchBoxSetCard({ boxSet, onClick }: SearchBoxSetCardProps) {
  const isComplete = boxSet.total_boxes > 0 && boxSet.possessed_count >= boxSet.total_boxes;
  const countLabel = boxSet.possessed_count > 0
    ? `${boxSet.possessed_count} / ${boxSet.total_boxes} boîte${boxSet.total_boxes > 1 ? 's' : ''}`
    : `${boxSet.total_boxes} boîte${boxSet.total_boxes > 1 ? 's' : ''}`;

  return (
    // w-full garantit que le button prend toute la cellule du grid (identique à BoxCard <Link>)
    <button
      type="button"
      className="group flex flex-col gap-2 text-left w-full"
      onClick={() => onClick(boxSet)}
    >
      <div
        className="relative overflow-hidden rounded-[calc(var(--radius)*2)] aspect-[2/3] w-full"
        style={{ background: 'var(--muted)' }}
      >
        {boxSet.cover_url ? (
          <Image
            src={boxSet.cover_url}
            alt={boxSet.title}
            fill
            sizes="(max-width: 480px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
            className="object-cover transition-transform duration-200 group-hover:scale-[1.02]"
          />
        ) : (
          boxCoverFallback
        )}
        {boxBadge}
        {isComplete && (
          <div
            className="absolute top-1.5 right-1.5 flex items-center justify-center w-[22px] h-[22px] rounded"
            style={{ background: 'var(--color-read)' }}
            aria-label="Coffret complet"
          >
            <CheckCircle size={13} style={{ color: 'var(--background)' }} aria-hidden />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1 px-0.5">
        <p
          className="text-sm font-semibold leading-tight line-clamp-2"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}
        >
          {boxSet.title}
        </p>
        <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
          {countLabel}
        </p>
      </div>
    </button>
  );
}

// ─── SeriesEditionsView — Level 1, mirrors SeriesDetailClient ─────────────────

interface SeriesEditionsViewProps {
  series: SeriesSearchResult;
  onBack: () => void;
  onEditionClick: (edition: SearchEdition) => void;
  onBoxSetClick: (boxSet: SearchBoxSet) => void;
}

function SeriesEditionsView({ series, onBack, onEditionClick, onBoxSetClick }: SeriesEditionsViewProps) {
  const queryClient = useQueryClient();
  const toggleWishlist = useToggleWishlist();

  function optimisticUpdateSearch(updater: (s: SeriesSearchResult) => SeriesSearchResult) {
    queryClient.setQueriesData<PaginatedSeriesSearchResult>(
      { queryKey: ['search'], exact: false },
      old => old && { ...old, data: old.data.map(s => s.id === series.id ? updater(s) : s) },
    );
  }

  function handleToggleEditionWishlist(edition: SearchEdition) {
    const newValue = !(edition.is_wishlisted ?? false);
    optimisticUpdateSearch(s => ({
      ...s,
      editions: s.editions.map(e => e.id === edition.id ? { ...e, is_wishlisted: newValue } : e),
    }));
    toggleWishlist.mutate(
      { id: edition.id, type: 'edition', isCurrentlyWishlisted: edition.is_wishlisted ?? false, seriesId: series.id ?? undefined },
      { onSettled: () => queryClient.invalidateQueries({ queryKey: ['search'] }) },
    );
  }

  function handleToggleBoxSetWishlist(boxSet: SearchBoxSet) {
    const newValue = !(boxSet.is_wishlisted ?? false);
    optimisticUpdateSearch(s => ({
      ...s,
      box_sets: s.box_sets.map(bs => bs.id === boxSet.id ? { ...bs, is_wishlisted: newValue } : bs),
    }));
    toggleWishlist.mutate(
      { id: boxSet.id, type: 'box_set', isCurrentlyWishlisted: boxSet.is_wishlisted ?? false, seriesId: series.id ?? undefined },
      { onSettled: () => queryClient.invalidateQueries({ queryKey: ['search'] }) },
    );
  }

  return (
    <motion.div
      key="series-detail"
      variants={sectionVariants}
      initial="initial"
      animate="animate"
      className="flex flex-col gap-8"
    >
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1 text-sm transition-opacity hover:opacity-70 w-fit -ml-0.5"
        style={{ color: 'var(--muted-foreground)' }}
      >
        <ChevronLeft size={16} aria-hidden />
        Résultats de recherche
      </button>

      <div className="flex gap-4">
        <div
          className="shrink-0 w-20 relative overflow-hidden rounded-[calc(var(--radius)*2)]"
          style={{ aspectRatio: '2/3', background: 'var(--muted)' }}
        >
          {series.cover_url ? (
            <Image src={series.cover_url} alt={series.title} fill sizes="80px" className="object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Package size={24} aria-hidden style={{ color: 'var(--muted-foreground)' }} />
            </div>
          )}
        </div>
        <div className="flex flex-col justify-center gap-1 min-w-0">
          <h2
            className="text-xl font-bold leading-tight"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}
          >
            {series.title}
          </h2>
          {series.authors && series.authors.length > 0 && (
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
              {series.authors.join(', ')}
            </p>
          )}
        </div>
      </div>

      {series.editions.length > 0 && (
        <motion.section variants={sectionVariants} initial="initial" animate="animate">
          <h3
            className="text-xs font-semibold uppercase mb-4"
            style={{ color: 'var(--muted-foreground)', letterSpacing: '0.08em' }}
          >
            Éditions ({series.editions.length})
          </h3>
          <VolumeGrid variant="series">
            {series.editions.map(edition => (
              <div key={edition.id} className="relative">
                <SearchEditionCard edition={edition} onClick={onEditionClick} />
                {(edition.possessed_count ?? 0) === 0 && (
                  <WishlistButton
                    isWishlisted={edition.is_wishlisted ?? false}
                    onToggle={() => handleToggleEditionWishlist(edition)}
                    isPending={toggleWishlist.isPending}
                  />
                )}
              </div>
            ))}
          </VolumeGrid>
        </motion.section>
      )}

      {series.box_sets.length > 0 && (
        <motion.section variants={sectionVariants} initial="initial" animate="animate">
          <h3
            className="text-xs font-semibold uppercase mb-4"
            style={{ color: 'var(--muted-foreground)', letterSpacing: '0.08em' }}
          >
            Coffrets ({series.box_sets.length})
          </h3>
          <VolumeGrid variant="series">
            {series.box_sets.map(bs => (
              <div key={bs.id} className="relative">
                <SearchBoxSetCard boxSet={bs} onClick={onBoxSetClick} />
                {bs.possessed_count < bs.total_boxes && (
                  <WishlistButton
                    isWishlisted={bs.is_wishlisted ?? false}
                    onToggle={() => handleToggleBoxSetWishlist(bs)}
                    isPending={toggleWishlist.isPending}
                  />
                )}
              </div>
            ))}
          </VolumeGrid>
        </motion.section>
      )}

      {series.editions.length === 0 && series.box_sets.length === 0 && (
        <p className="text-sm py-8 text-center" style={{ color: 'var(--muted-foreground)' }}>
          Aucune édition disponible.
        </p>
      )}
    </motion.div>
  );
}

// ─── SearchVolumeCard — mirrors VolumeActionCard + multiselect (rerender-no-inline-components)

interface SearchVolumeCardProps {
  volume: Volume;
  isSelected: boolean;
  onToggle: (volume: Volume) => void;
}

function SearchVolumeCard({ volume, isSelected, onToggle }: SearchVolumeCardProps) {
  const isNonOwned = ! volume.is_owned;
  const isInteractive = isNonOwned;

  return (
    <button
      type="button"
      className="volume-card block w-full"
      style={{ background: 'none', border: 'none', padding: 0, cursor: isInteractive ? 'pointer' : 'default' }}
      onClick={() => { if (isInteractive) onToggle(volume); }}
      aria-label={`${ volume.title}${ volume.number ? ` — tome ${ volume.number}` : ''}`}
      aria-pressed={isSelected}
    >
      { volume.cover_url ? (
        <Image
          src={ volume.cover_url}
          alt={ volume.title ?? `Tome ${ volume.number}`}
          fill
          sizes="(max-width: 480px) 33vw, (max-width: 768px) 25vw, 16vw"
          className="object-cover"
        />
      ) : (
        volumeCoverFallback
      )}

      {bottomGradient}

      {/* Non-owned overlay */}
      {isNonOwned && !isSelected && (
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'oklch(0% 0 0 / 0.45)' }}
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

      {/* Volume number */}
      { volume.number && (
        <div className="absolute bottom-0 left-0 right-0 px-1.5 pb-1.5">
          <span
            className="text-[11px] font-medium leading-none"
            style={{ color: 'var(--foreground)', fontFamily: 'var(--font-mono)' }}
          >
            #{ volume.number}
          </span>
        </div>
      )}
    </button>
  );
}

// ─── SearchBoxCard — mirrors BoxCard + multiselect (rerender-no-inline-components)

interface SearchBoxCardProps {
  box: Box;
  isSelected: boolean;
  onToggle: (box: Box) => void;
}

function SearchBoxCard({ box, isSelected, onToggle }: SearchBoxCardProps) {
  const isNonOwned = !box.is_owned;
  const isInteractive = isNonOwned;

  const countLabel = box.total_volumes != null
    ? `${box.total_volumes} vol.`
    : box.volumes?.length
      ? `${box.volumes.length} vol.`
      : null;

  const metaLine = [box.number ? `Boîte ${box.number}` : null, countLabel].filter(Boolean).join(' · ');

  return (
    <button
      type="button"
      className="group flex flex-col gap-2 text-left"
      style={{ cursor: isInteractive ? 'pointer' : 'default' }}
      onClick={() => { if (isInteractive) onToggle(box); }}
      aria-label={box.title}
      aria-pressed={isSelected}
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
            sizes="(max-width: 480px) 50vw, (max-width: 768px) 33vw, 25vw"
            className="object-cover transition-transform duration-200 group-hover:scale-[1.02]"
          />
        ) : (
          boxCoverFallback
        )}
        {boxBadge}

        {/* Non-owned overlay */}
        {isNonOwned && !isSelected && (
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'oklch(0% 0 0 / 0.45)' }}
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

// ─── SelectConfirmBar — portal-based sticky bar for multiselect (rerender-no-inline-components)

interface SelectConfirmBarProps {
  count: number;
  isPending: boolean;
  label: string;
  onConfirm: () => void;
}

function SelectConfirmBar({ count, isPending, label, onConfirm }: SelectConfirmBarProps) {
  if (typeof document === 'undefined') return null;
  return createPortal(
    <div
      className="fixed bottom-0 left-0 right-0 z-40 lg:left-64 px-4 pt-3"
      style={{
        paddingBottom: 'calc(64px + env(safe-area-inset-bottom) + 12px)',
        background: 'var(--background)',
        borderTop: '1px solid var(--border)',
      }}
    >
      <button
        type="button"
        onClick={onConfirm}
        disabled={count === 0 || isPending}
        className="flex items-center justify-center gap-2 w-full h-11 text-sm font-semibold transition-opacity disabled:opacity-40 hover:opacity-90"
        style={{
          background: 'var(--primary)',
          color: 'var(--primary-foreground)',
          borderRadius: 'var(--radius)',
        }}
      >
        {isPending ? (
          <Loader2 size={14} className="animate-spin" aria-hidden />
        ) : (
          <>
            <Plus size={14} aria-hidden />
            {count > 0 ? label : 'Sélectionner des éléments'}
          </>
        )}
      </button>
    </div>,
    document.body,
  );
}

// ─── SearchEditionDetailView — Level 2a, mirrors EditionDetailClient ──────────

interface SearchEditionDetailViewProps {
  edition: SearchEdition;
  seriesTitle: string;
  onBack: () => void;
}

function SearchEditionDetailView({ edition, seriesTitle, onBack }: SearchEditionDetailViewProps) {
  const queryClient = useQueryClient();
  const { data: fullEdition, isLoading } = useEditionQuery(edition.id);
  const addBulk = useAddBulkToCollection();

  // Dialog management
  const { isOpen, setIsOpen, confirm, handleConfirm, config } = useConfirmationDialog();

  const [selectedNumbers, setSelectedNumbers] = useState<ReadonlySet<number>>(() => new Set());

  const volumes: Volume[] = fullEdition?.volumes ?? [];
  const nonOwnedVolumes = volumes.filter(v => !v.is_owned);

  const possessedCount = fullEdition?.possessed_count ?? edition.possessed_count ?? 0;
  const totalVolumes = fullEdition?.total_volumes ?? edition.total_volumes ?? null;
  const progress =
    totalVolumes && totalVolumes > 0
      ? Math.round(((possessedCount ?? 0) / totalVolumes) * 100)
      : null;
  const isAllSelected = nonOwnedVolumes.length > 0 && selectedNumbers.size === nonOwnedVolumes.length;

  function parseNumber(volume: Volume): number | null {
    const n = parseInt( volume.number ?? '');
    return isNaN(n) ? null : n;
  }

  function handleToggle(volume: Volume) {
    const n = parseNumber(volume);
    if (n === null) return;
    setSelectedNumbers(prev => {
      const next = new Set(prev);
      if (next.has(n)) next.delete(n); else next.add(n);
      return next;
    });
  }

  function handleSelectAll() {
    setSelectedNumbers(prev => {
      const allNumbers = nonOwnedVolumes.map(parseNumber).filter((n): n is number => n !== null);
      if (isAllSelected) return new Set();
      return new Set(allNumbers);
    });
  }

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: queryKeys.edition(edition.id) });
  }

  function handleAddAll() {
    const numbers = nonOwnedVolumes.map(parseNumber).filter((n): n is number => n !== null);
    if (numbers.length === 0) return;
    addBulk.mutate({ editionId: edition.id, numbers }, {
      onSuccess: () => {
        toast.success(`${numbers.length} tome${numbers.length > 1 ? 's' : ''} ajouté${numbers.length > 1 ? 's' : ''}`);
        invalidate();
      },
      onError: err => {
        toast.error(getApiErrorMessage(err, "Erreur lors de l'ajout"));
      },
    });
  }

  function handleAddSelected() {
    const numbers = [...selectedNumbers].sort((a, b) => a - b);
    if (numbers.length === 0) return;
    addBulk.mutate({ editionId: edition.id, numbers }, {
      onSuccess: () => {
        toast.success(`${numbers.length} tome${numbers.length > 1 ? 's' : ''} ajouté${numbers.length > 1 ? 's' : ''}`);
        setSelectedNumbers(new Set());
        invalidate();
      },
      onError: err => toast.error(getApiErrorMessage(err, "Erreur lors de l'ajout")),
    });
  }

  const confirmLabel = `Ajouter ${selectedNumbers.size} tome${selectedNumbers.size > 1 ? 's' : ''}`;

  return (
    <motion.div
      key="edition-detail"
      variants={sectionVariants}
      initial="initial"
      animate="animate"
      className="flex flex-col gap-8"
    >
      {/* Back */}
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1 text-sm transition-opacity hover:opacity-70 w-fit -ml-0.5"
        style={{ color: 'var(--muted-foreground)' }}
      >
        <ChevronLeft size={16} aria-hidden />
        {seriesTitle}
      </button>

      {/* Header */}
      {isLoading ? headerSkeleton : fullEdition ? (
        <div className="flex gap-4">
          <div
            className="shrink-0 w-20 relative overflow-hidden rounded-[calc(var(--radius)*2)]"
            style={{ aspectRatio: '2/3', background: 'var(--muted)' }}
          >
            {fullEdition.cover_url ? (
              <Image src={fullEdition.cover_url} alt={fullEdition.name} fill sizes="80px" className="object-cover" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <Package size={24} aria-hidden style={{ color: 'var(--muted-foreground)' }} />
              </div>
            )}
          </div>
          <div className="flex flex-col justify-center gap-1.5 min-w-0 flex-1">
            <h2
              className="text-xl font-bold leading-tight"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}
            >
              {fullEdition.name}
            </h2>
            {fullEdition.publisher && (
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                {fullEdition.publisher}
              </p>
            )}
            {progress !== null && (
              <>
                <div
                  className="volume-progress"
                  role="progressbar"
                  aria-valuenow={progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${possessedCount} volumes sur ${totalVolumes} possédés`}
                >
                  <div className="volume-progress__fill" style={{ width: `${progress}%` }} />
                </div>
                <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  {possessedCount} / {totalVolumes} vol. possédés
                </p>
              </>
            )}
          </div>
        </div>
      ) : null}

      {/* Volume grid */}
      {isLoading ? gridSkeleton : volumes.length > 0 ? (
        <section>
          <div className="flex items-center justify-between mb-4">
            <p
              className="text-xs font-semibold uppercase"
              style={{ color: 'var(--muted-foreground)', letterSpacing: '0.08em' }}
            >
              {selectedNumbers.size > 0
                ? `${selectedNumbers.size} sélectionné${selectedNumbers.size > 1 ? 's' : ''}`
                : `Volumes (${volumes.length})`}
            </p>
            {nonOwnedVolumes.length > 0 && (
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-xs font-medium transition-opacity hover:opacity-70"
                  style={{ color: 'var(--muted-foreground)' }}
                >
                    {isAllSelected ? 'Tout désélectionner' : 'Tout sélectionner'}
                </button>
                <button
                  type="button"
                  onClick={() => confirm({
                    title: 'Ajouter tout ?',
                    description: `Voulez-vous ajouter les ${nonOwnedVolumes.length} tomes manquants à votre collection ?`,
                    onConfirm: handleAddAll,
                    confirmLabel: 'Ajouter tout',
                  })}
                  disabled={addBulk.isPending}
                  className="flex items-center gap-1 text-xs font-medium transition-opacity disabled:opacity-50 hover:opacity-80"
                  style={{ color: 'var(--primary)' }}
                >
                  {addBulk.isPending
                    ? <Loader2 size={11} className="animate-spin" aria-hidden />
                    : <Plus size={11} aria-hidden />}
                  Ajouter tout
                </button>
              </div>
            )}
          </div>

          <div className={`volume-grid ${selectedNumbers.size > 0 ? 'pb-28' : ''}`}>
            {volumes.map(volume => (
              <SearchVolumeCard
                key={ volume.id}
                volume={volume}
                isSelected={selectedNumbers.has(parseNumber(volume) ?? -1)}
                onToggle={handleToggle}
              />
            ))}
          </div>
        </section>
      ) : null}

      {/* Sticky confirm bar when selection non vide */}
      {selectedNumbers.size > 0 && (
        <SelectConfirmBar
          count={selectedNumbers.size}
          isPending={addBulk.isPending}
          label={confirmLabel}
          onConfirm={handleAddSelected}
        />
      )}

      <ConfirmationDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        {...config!}
        onConfirm={handleConfirm}
      />
    </motion.div>
  );
}

// ─── SearchBoxSetDetailView — Level 2b, mirrors BoxSetDetailClient ────────────

interface SearchBoxSetDetailViewProps {
  boxSet: SearchBoxSet;
  seriesTitle: string;
  onBack: () => void;
}

function SearchBoxSetDetailView({ boxSet, seriesTitle, onBack }: SearchBoxSetDetailViewProps) {
  const queryClient = useQueryClient();
  const { data: fullBoxSet, isLoading } = useBoxSetQuery(boxSet.id);
  const addBox = useAddBoxToCollection();

  // Dialog management
  const { isOpen, setIsOpen, confirm, handleConfirm, config } = useConfirmationDialog();

  const [selectedBoxIds, setSelectedBoxIds] = useState<ReadonlySet<number>>(() => new Set());

  const boxes: Box[] = fullBoxSet?.boxes ?? [];
  const nonOwnedBoxes = boxes.filter(b => !b.is_owned);
  const ownedCount = boxes.filter(b => b.is_owned).length;
  const progress = boxes.length > 0 ? Math.round((ownedCount / boxes.length) * 100) : null;

  const isAllSelected = nonOwnedBoxes.length > 0 && selectedBoxIds.size === nonOwnedBoxes.length;

  function handleToggle(box: Box) {
    setSelectedBoxIds(prev => {
      const next = new Set(prev);
      if (next.has(box.id)) next.delete(box.id); else next.add(box.id);
      return next;
    });
  }

  function handleSelectAll() {
    setSelectedBoxIds(prev => {
      if (isAllSelected) return new Set();
      return new Set(nonOwnedBoxes.map(b => b.id));
    });
  }

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: queryKeys.boxSet(boxSet.id) });
  }

  async function handleAddAll() {
    if (nonOwnedBoxes.length === 0) return;
    try {
      await Promise.all(nonOwnedBoxes.map(b => addBox.mutateAsync(b.id)));
      toast.success(
        `${nonOwnedBoxes.length} coffret${nonOwnedBoxes.length > 1 ? 's' : ''} ajouté${nonOwnedBoxes.length > 1 ? 's' : ''}`,
      );
      invalidate();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Erreur lors de l'ajout"));
    }
  }

  async function handleAddSelected() {
    const ids = [...selectedBoxIds];
    if (ids.length === 0) return;
    try {
      await Promise.all(ids.map(id => addBox.mutateAsync(id)));
      toast.success(
        `${ids.length} coffret${ids.length > 1 ? 's' : ''} ajouté${ids.length > 1 ? 's' : ''}`,
      );
      setSelectedBoxIds(new Set());
      invalidate();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Erreur lors de l'ajout"));
    }
  }

  const confirmLabel = `Ajouter ${selectedBoxIds.size} coffret${selectedBoxIds.size > 1 ? 's' : ''}`;

  return (
    <motion.div
      key="boxset-detail"
      variants={sectionVariants}
      initial="initial"
      animate="animate"
      className="flex flex-col gap-8"
    >
      {/* Back */}
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1 text-sm transition-opacity hover:opacity-70 w-fit -ml-0.5"
        style={{ color: 'var(--muted-foreground)' }}
      >
        <ChevronLeft size={16} aria-hidden />
        {seriesTitle}
      </button>

      {/* Header */}
      {isLoading ? headerSkeleton : fullBoxSet ? (
        <div className="flex gap-4">
          <div
            className="shrink-0 w-20 relative overflow-hidden rounded-[calc(var(--radius)*2)]"
            style={{ aspectRatio: '2/3', background: 'var(--muted)' }}
          >
            {fullBoxSet.cover_url ? (
              <Image src={fullBoxSet.cover_url} alt={fullBoxSet.title} fill sizes="80px" className="object-cover" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <Package2 size={24} aria-hidden style={{ color: 'var(--muted-foreground)' }} />
              </div>
            )}
          </div>
          <div className="flex flex-col justify-center gap-1.5 min-w-0 flex-1">
            <h2
              className="text-xl font-bold leading-tight"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}
            >
              {fullBoxSet.title}
            </h2>
            {fullBoxSet.publisher && (
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                {fullBoxSet.publisher}
              </p>
            )}
            {progress !== null && (
              <>
                <div
                  className="volume-progress"
                  role="progressbar"
                  aria-valuenow={progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${ownedCount} boîtes sur ${boxes.length} possédées`}
                >
                  <div className="volume-progress__fill" style={{ width: `${progress}%` }} />
                </div>
                <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  {ownedCount} / {boxes.length} boîte{boxes.length > 1 ? 's' : ''} possédée{ownedCount > 1 ? 's' : ''}
                </p>
              </>
            )}
          </div>
        </div>
      ) : null}

      {/* Boxes grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4" aria-busy aria-hidden>
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <div className="skeleton rounded-[calc(var(--radius)*2)] w-full" style={{ aspectRatio: '2/3' }} />
              <div className="skeleton h-4 w-3/4 rounded" />
            </div>
          ))}
        </div>
      ) : boxes.length > 0 ? (
        <section>
          <div className="flex items-center justify-between mb-4">
            <p
              className="text-xs font-semibold uppercase"
              style={{ color: 'var(--muted-foreground)', letterSpacing: '0.08em' }}
            >
              {selectedBoxIds.size > 0
                ? `${selectedBoxIds.size} sélectionné${selectedBoxIds.size > 1 ? 's' : ''}`
                : `Boîtes (${boxes.length})`}
            </p>
            {nonOwnedBoxes.length > 0 && (
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-xs font-medium transition-opacity hover:opacity-70"
                  style={{ color: 'var(--muted-foreground)' }}
                >
                    {isAllSelected ? 'Tout désélectionner' : 'Tout sélectionner'}
                </button>
                <button
                  type="button"
                  onClick={() => confirm({
                    title: 'Ajouter tout ?',
                    description: `Voulez-vous ajouter les ${nonOwnedBoxes.length} boîtes manquantes à votre collection ?`,
                    onConfirm: handleAddAll,
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
              </div>
            )}
          </div>

          <VolumeGrid variant="series" className={selectedBoxIds.size > 0 ? 'pb-28' : undefined}>
            {boxes.map(box => (
              <SearchBoxCard
                key={box.id}
                box={box}
                isSelected={selectedBoxIds.has(box.id)}
                onToggle={handleToggle}
              />
            ))}
          </VolumeGrid>
        </section>
      ) : null}

      {/* Sticky confirm bar quand sélection non vide */}
      {selectedBoxIds.size > 0 && (
        <SelectConfirmBar
          count={selectedBoxIds.size}
          isPending={addBox.isPending}
          label={confirmLabel}
          onConfirm={handleAddSelected}
        />
      )}

      <ConfirmationDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        {...config!}
        onConfirm={handleConfirm}
      />
    </motion.div>
  );
}

// ─── SearchClient ─────────────────────────────────────────────────────────────

export function SearchClient() {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const [inputValue, setInputValue] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [page, setPage] = useState(1);
  const [isPaginating, startTransition] = useTransition();

  // Navigation stack
  const [selectedSeries, setSelectedSeries] = useState<SeriesSearchResult | null>(null);
  const [selectedEdition, setSelectedEdition] = useState<SearchEdition | null>(null);
  const [selectedBoxSet, setSelectedBoxSet] = useState<SearchBoxSet | null>(null);

  const { data, isLoading, isFetching, isError } = useSearchQuery(submittedQuery, page);

  const results = data?.data ?? [];
  const meta = data?.meta;
  const hasSearched = submittedQuery.length > 0;
  const showLoading = isLoading || (isPaginating && isFetching);
  const pageItems = meta ? buildPageItems(meta.current_page, meta.last_page) : [];

  // Vue Couverture / Vue Liste — séries uniquement, volumes restent en grille
  const viewMode         = useViewMode();
  const deferredViewMode = useDeferredValue(viewMode);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = inputValue.trim();
    if (!q || q === submittedQuery) return;
    setSubmittedQuery(q);
    setPage(1);
    setSelectedSeries(null);
    setSelectedEdition(null);
    setSelectedBoxSet(null);
  }

  function handlePageChange(newPage: number) {
    startTransition(() => setPage(newPage));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function invalidateSearch() {
    queryClient.invalidateQueries({ queryKey: queryKeys.search(submittedQuery, page) });
  }

  // Determine active view
  const activeView = selectedEdition
    ? 'edition'
    : selectedBoxSet
      ? 'boxset'
      : selectedSeries
        ? 'series'
        : 'results';

  return (
    <div className="flex flex-col gap-6">
      <h1
        className="text-2xl font-bold"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}
      >
        Recherche
      </h1>

      {/* Search form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden
            style={{ color: 'var(--muted-foreground)' }}
          />
          <input
            type="search"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            placeholder="Titre, auteur…"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            className="w-full h-10 pl-9 pr-3 text-sm [&::-webkit-search-cancel-button]:hidden focus-visible:outline-none"
            style={{
              background: 'var(--input)',
              color: 'var(--foreground)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
            }}
            aria-label="Rechercher des mangas"
          />
        </div>
        <button
          type="submit"
          disabled={!inputValue.trim() || isLoading}
          className="h-10 px-4 text-sm font-semibold shrink-0 transition-opacity disabled:opacity-40 hover:opacity-90"
          style={{
            background: 'var(--primary)',
            color: 'var(--primary-foreground)',
            borderRadius: 'var(--radius)',
          }}
        >
          {isLoading && !isPaginating ? (
            <Loader2 size={14} className="animate-spin" aria-hidden />
          ) : (
            'Rechercher'
          )}
        </button>
      </form>

      {/* Level 2b — BoxSet detail */}
      {activeView === 'boxset' && selectedBoxSet && selectedSeries && (
        <SearchBoxSetDetailView
          boxSet={selectedBoxSet}
          seriesTitle={selectedSeries.title}
          onBack={() => setSelectedBoxSet(null)}
        />
      )}

      {/* Level 2a — Edition detail */}
      {activeView === 'edition' && selectedEdition && selectedSeries && (
        <SearchEditionDetailView
          edition={selectedEdition}
          seriesTitle={selectedSeries.title}
          onBack={() => setSelectedEdition(null)}
        />
      )}

      {/* Level 1 — Series editions */}
      {activeView === 'series' && selectedSeries && (
        <SeriesEditionsView
          series={selectedSeries}
          onBack={() => setSelectedSeries(null)}
          onEditionClick={edition => { setSelectedEdition(edition); invalidateSearch(); }}
          onBoxSetClick={boxSet => { setSelectedBoxSet(boxSet); invalidateSearch(); }}
        />
      )}

      {/* Level 0 — Results */}
      {activeView === 'results' && (
        showLoading ? resultsGridSkeleton
        : isError ? (
          <motion.div
            variants={sectionVariants}
            initial="initial"
            animate="animate"
            className="flex flex-col items-center gap-3 py-16 text-center"
          >
            <AlertCircle size={36} aria-hidden style={{ color: 'var(--destructive)' }} />
            <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
              Une erreur est survenue. Réessayez.
            </p>
          </motion.div>
        ) : results.length > 0 ? (
          <motion.section
            variants={sectionVariants}
            initial="initial"
            animate="animate"
            aria-label="Résultats de recherche"
          >
            {meta && (
              <p className="text-xs mb-3" style={{ color: 'var(--muted-foreground)' }}>
                {meta.total} résultat{meta.total > 1 ? 's' : ''} — page {meta.current_page} / {meta.last_page}
              </p>
            )}

            <AnimatePresence mode="wait" initial={false}>
              {deferredViewMode === 'cover' ? (
                <motion.div
                  key="cover"
                  variants={viewTransitionVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="volume-grid"
                >
                  {results.map(series => (
                    <SearchSeriesCard
                      key={series.api_id ?? series.id}
                      series={series}
                      onClick={setSelectedSeries}
                    />
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  key="list"
                  variants={viewTransitionVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  {results.map(series => (
                    <SearchSeriesListRow
                      key={series.api_id ?? series.id}
                      series={series}
                      onClick={setSelectedSeries}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {meta && meta.last_page > 1 && (
              <div className="flex items-center justify-center gap-1.5 mt-8">
                <button
                  type="button"
                  onClick={() => handlePageChange(meta.current_page - 1)}
                  disabled={meta.current_page === 1 || isFetching}
                  className="flex items-center justify-center w-8 h-8 rounded transition-opacity disabled:opacity-30 hover:opacity-70"
                  style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
                  aria-label="Page précédente"
                >
                  <ChevronLeft size={14} aria-hidden />
                </button>

                {pageItems.map((item, idx) =>
                  item === '…' ? (
                    <span
                      key={`ellipsis-${idx}`}
                      className="w-8 h-8 flex items-center justify-center text-xs"
                      style={{ color: 'var(--muted-foreground)' }}
                    >
                      …
                    </span>
                  ) : (
                    <button
                      key={item}
                      type="button"
                      onClick={() => handlePageChange(item)}
                      disabled={isFetching}
                      className="w-8 h-8 rounded text-xs font-semibold transition-opacity disabled:opacity-60 hover:opacity-80"
                      style={
                        item === meta.current_page
                          ? { background: 'var(--primary)', color: 'var(--primary-foreground)' }
                          : { background: 'var(--card)', color: 'var(--foreground)', border: '1px solid var(--border)' }
                      }
                      aria-current={item === meta.current_page ? 'page' : undefined}
                    >
                      {item}
                    </button>
                  ),
                )}

                <button
                  type="button"
                  onClick={() => handlePageChange(meta.current_page + 1)}
                  disabled={meta.current_page === meta.last_page || isFetching}
                  className="flex items-center justify-center w-8 h-8 rounded transition-opacity disabled:opacity-30 hover:opacity-70"
                  style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
                  aria-label="Page suivante"
                >
                  <ChevronRight size={14} aria-hidden />
                </button>
              </div>
            )}
          </motion.section>
        ) : hasSearched ? (
          <motion.div
            variants={sectionVariants}
            initial="initial"
            animate="animate"
            className="flex flex-col items-center gap-3 py-16 text-center"
          >
            <div
              className="flex items-center justify-center w-16 h-16 rounded-full"
              style={{ background: 'var(--muted)' }}
            >
              <SearchX size={28} aria-hidden style={{ color: 'var(--muted-foreground)' }} />
            </div>
            <p
              className="text-sm font-medium"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}
            >
              Aucun résultat pour « {submittedQuery} »
            </p>
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
              Essayez un autre titre ou un nom d&apos;auteur.
            </p>
          </motion.div>
        ) : (
          <motion.div
            variants={sectionVariants}
            initial="initial"
            animate="animate"
            className="flex flex-col items-center gap-3 py-16 text-center"
          >
            <div
              className="flex items-center justify-center w-16 h-16 rounded-full"
              style={{ background: 'var(--muted)' }}
            >
              <Search size={28} aria-hidden style={{ color: 'var(--muted-foreground)' }} />
            </div>
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
              Recherchez par titre ou auteur pour trouver des séries.
            </p>
          </motion.div>
        )
      )}

      {/* Auth guard message for unauthenticated users on Level 2 */}
      {(activeView === 'edition' || activeView === 'boxset') && !isAuthenticated && (
        <p className="text-xs text-center" style={{ color: 'var(--muted-foreground)' }}>
          Connectez-vous pour ajouter des tomes à votre collection.
        </p>
      )}
    </div>
  );
}
