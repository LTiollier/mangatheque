'use client';

import Image from 'next/image';
import { BookUp, CheckCircle, Package } from 'lucide-react';

import { formatShortDate, isFutureDate } from '@/lib/utils';
import type { Volume } from '@/types/volume';

// Hoisted static decorators (rendering-hoist-jsx)
const bottomGradient = (
  <div
    aria-hidden
    className="absolute inset-0 pointer-events-none"
    style={{ background: 'linear-gradient(to top, oklch(0% 0 0 / 0.65) 0%, transparent 55%)' }}
  />
);

export interface VolumeActionCardProps {
  volume: Volume;
  isRead: boolean;
  isLoaned: boolean;
  isSelected?: boolean;
  onToggle: (volume: Volume) => void;
  isAddSelected?: boolean;
  onAddToggle?: (volume: Volume) => void;
  /** Disable owned-item toggle (e.g. when add-to-collection mode is active) */
  disabled?: boolean;
}

// Defined outside any parent component (rerender-no-inline-components)
export function VolumeActionCard({
  volume,
  isRead,
  isLoaned,
  isSelected = false,
  onToggle,
  isAddSelected = false,
  onAddToggle,
  disabled = false,
}: VolumeActionCardProps) {
  const isOwned = volume.is_owned;
  // Owned clickable unless disabled (add-mode active); non-owned clickable when onAddToggle provided (rerender-derived-state)
  const isClickable = (isOwned && !disabled) || (!isOwned && !!onAddToggle);

  function handleClick() {
    if (isOwned && !disabled) { onToggle(volume); }
    else if (!isOwned && onAddToggle) { onAddToggle(volume); }
  }

  return (
    <button
      type="button"
      className="volume-card block w-full"
      style={{ background: 'none', border: 'none', padding: 0, cursor: isClickable ? 'pointer' : 'default' }}
      onClick={handleClick}
      aria-pressed={isClickable ? (isOwned ? isSelected : isAddSelected) : undefined}
      aria-label={`${volume.title}${volume.number ? ` — tome ${volume.number}` : ''}${isLoaned ? ' — prêté' : ''}`}
    >
      {volume.cover_url ? (
        <Image
          src={volume.cover_url}
          alt={volume.title ?? `Tome ${volume.number}`}
          fill
          sizes="(max-width: 480px) 33vw, (max-width: 768px) 25vw, 16vw"
          className="object-cover"
          style={!isOwned && !isAddSelected ? { filter: 'grayscale(35%) brightness(0.6)' } : undefined}
        />
      ) : (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={!isOwned && !isAddSelected ? { opacity: 0.5 } : undefined}
        >
          <Package size={24} aria-hidden style={{ color: 'var(--muted-foreground)' }} />
        </div>
      )}

      {bottomGradient}

      {/* Selected overlay — owned (read/loan) or non-owned (add to collection) */}
      {(isSelected || isAddSelected) && (
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none flex items-center justify-center"
          style={{ background: 'color-mix(in oklch, var(--primary) 35%, transparent)' }}
        >
          <CheckCircle size={20} style={{ color: 'white' }} />
        </div>
      )}

      {/* Read strip — bordure gauche pleine hauteur, hidden when selected (spec §4.1) */}
      {isRead && !isSelected && (
        <div
          className="absolute left-0 top-0 bottom-0 w-[3px] z-10"
          style={{ background: 'var(--color-read)' }}
          aria-label="Lu"
        />
      )}

      {/* Loaned badge — top right, hidden when selected (spec §4.2) */}
      {isLoaned && !isSelected && (
        <div
          aria-hidden
          className="absolute top-1.5 right-1.5 flex items-center justify-center w-[22px] h-[22px] rounded z-10"
          style={{ background: 'var(--color-loaned)' }}
        >
          <BookUp size={13} style={{ color: 'var(--background)' }} aria-hidden />
        </div>
      )}

      {/* Future release date — bottom right (spec §4.4) */}
      {isFutureDate(volume.published_date) && (
        <div
          className="absolute bottom-1.5 right-1.5 px-1 py-0.5 rounded text-[9px] font-semibold leading-none z-10"
          style={{ background: 'var(--color-upcoming)', color: 'var(--background)' }}
          aria-label={`Sortie prévue le ${formatShortDate(volume.published_date!)}`}
        >
          {formatShortDate(volume.published_date!)}
        </div>
      )}

      {/* Volume number */}
      {!!volume.number && (
        <div className="absolute bottom-0 left-0 right-0 px-1.5 pb-1.5">
          <span
            className="text-[11px] font-medium leading-none"
            style={{ color: 'var(--foreground)', fontFamily: 'var(--font-mono)' }}
          >
            #{volume.number}
          </span>
        </div>
      )}
    </button>
  );
}
