'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ChevronLeft, Heart, Package2 } from 'lucide-react';

import { useBoxSetQuery, useToggleWishlist } from '@/hooks/queries';
import { BoxCard } from '@/components/cards/BoxCard';
import { MangaGrid } from '@/components/cards/MangaGrid';
import { EmptyState } from '@/components/feedback/EmptyState';
import { sectionVariants } from '@/lib/motion';
import type { Box } from '@/types/manga';

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

function getBoxVolumeCount(box: Box): number | undefined {
  if (box.total_volumes != null) return box.total_volumes;
  if (box.volumes && box.volumes.length > 0) return box.volumes.length;
  return undefined;
}

// ─── BoxSetDetailClient ───────────────────────────────────────────────────────

interface BoxSetDetailClientProps {
  seriesId: number;
  boxSetId: number;
}

export function BoxSetDetailClient({ seriesId, boxSetId }: BoxSetDetailClientProps) {
  const router = useRouter();

  // Single query — BoxSet embeds its boxes (async-parallel: no sequential fetches)
  const { data: boxSet, isLoading, isError } = useBoxSetQuery(boxSetId);
  const toggleWishlist = useToggleWishlist();

  // Derived during render — no useEffect (rerender-derived-state-no-effect)
  const boxes: Box[] = boxSet?.boxes ?? [];
  const ownedCount = boxes.filter(b => b.is_owned).length;
  const progress =
    boxes.length > 0 ? Math.round((ownedCount / boxes.length) * 100) : null;

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
          <h2
            className="text-xs font-semibold uppercase mb-4"
            style={{ color: 'var(--muted-foreground)', letterSpacing: '0.08em' }}
          >
            Boîtes ({boxes.length})
          </h2>
          <MangaGrid variant="series">
            {boxes.map(box => (
              <div key={box.id} className="relative">
                <BoxCard
                  title={box.title}
                  coverUrl={box.cover_url}
                  href={`/series/${seriesId}/box/${box.id}`}
                  subtitle={box.number ? `Boîte ${box.number}` : undefined}
                  volumeCount={getBoxVolumeCount(box)}
                  isOwned={box.is_owned ?? false}
                  isWishlisted={box.is_wishlisted}
                />
                {!box.is_owned && (
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
    </div>
  );
}
