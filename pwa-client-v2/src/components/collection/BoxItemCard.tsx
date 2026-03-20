'use client';

import Image from 'next/image';
import { CheckCircle, Heart, Package2 } from 'lucide-react';

import type { Box } from '@/types/manga';

// Package2 badge — same on every box card (rendering-hoist-jsx)
const boxBadge = (
  <div
    className="absolute top-1.5 left-1.5 flex items-center justify-center w-[22px] h-[22px] rounded"
    style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
    aria-label="Coffret"
  >
    <Package2 size={12} style={{ color: 'var(--muted-foreground)' }} aria-hidden />
  </div>
);

function getBoxMetaLine(box: Box): string | null {
  const volumeCount = box.total_volumes ?? box.volumes?.length;
  return [
    box.number ? `Boîte ${box.number}` : null,
    volumeCount ? `${volumeCount} vol.` : null,
  ].filter(Boolean).join(' · ') || null;
}

export interface BoxItemCardProps {
  box: Box;
  isLoaned: boolean;
  isSelected?: boolean;
  onToggle: (box: Box) => void;
  isWishlisted?: boolean;
  onToggleWishlist?: () => void;
  wishlistPending?: boolean;
  isAddSelected?: boolean;
  onAddToggle?: (box: Box) => void;
}

/**
 * Box card for BoxSetDetailClient.
 * Mirror of VolumeActionCard for boxes — same overlay rules, three differences:
 * - No read dot top-left
 * - Package2 badge top-left
 * - Wishlist button top-right when not owned
 *
 * Uses a wrapper <div> instead of a single <button> to avoid nested interactive elements.
 * (rerender-no-inline-components)
 */
export function BoxItemCard({
  box,
  isLoaned,
  isSelected = false,
  onToggle,
  isWishlisted = false,
  onToggleWishlist,
  wishlistPending = false,
  isAddSelected = false,
  onAddToggle,
}: BoxItemCardProps) {
  const isOwned = box.is_owned ?? false;
  const isClickable = isOwned || !!onAddToggle;
  const metaLine = getBoxMetaLine(box);

  function handleClick() {
    if (isOwned) onToggle(box);
    else if (onAddToggle) onAddToggle(box);
  }

  return (
    <div className="relative group">
      <button
        type="button"
        className="flex flex-col gap-2 text-left w-full"
        onClick={handleClick}
        style={{ cursor: isClickable ? 'pointer' : 'default' }}
        aria-pressed={isClickable ? (isOwned ? isSelected : isAddSelected) : undefined}
        aria-label={`${box.title}${isLoaned ? ' — prêté' : ''}`}
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

          {/* Non-owned overlay — hidden when add-selected */}
          {!isOwned && !isAddSelected && (
            <div
              aria-hidden
              className="absolute inset-0 pointer-events-none"
              style={{ background: 'oklch(0% 0 0 / 0.45)' }}
            />
          )}

          {/* Loaned overlay — hidden when selected */}
          {isLoaned && !isSelected && (
            <div
              aria-hidden
              className="absolute inset-0 pointer-events-none"
              style={{ background: 'color-mix(in oklch, var(--color-loaned) 15%, transparent)' }}
            />
          )}

          {/* Selected overlay — owned (loan) or non-owned (add to collection) */}
          {(isSelected || isAddSelected) && (
            <div
              aria-hidden
              className="absolute inset-0 pointer-events-none flex items-center justify-center"
              style={{ background: 'color-mix(in oklch, var(--primary) 35%, transparent)' }}
            >
              <CheckCircle size={20} style={{ color: 'white' }} />
            </div>
          )}

          {/* Loaned dot — top-right, hidden when selected */}
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

      {/* Wishlist button — only for non-owned boxes, outside the card button to avoid nesting */}
      {!isOwned && onToggleWishlist && (
        <button
          type="button"
          onClick={onToggleWishlist}
          disabled={wishlistPending}
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
      )}
    </div>
  );
}
