'use client';

import Image from 'next/image';
import { CheckCircle, Package } from 'lucide-react';

import type { Manga } from '@/types/manga';

// Hoisted static decorators (rendering-hoist-jsx)
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

export interface VolumeActionCardProps {
  manga: Manga;
  isRead: boolean;
  isLoaned: boolean;
  isSelected?: boolean;
  onToggle: (manga: Manga) => void;
  isAddSelected?: boolean;
  onAddToggle?: (manga: Manga) => void;
}

// Defined outside any parent component (rerender-no-inline-components)
export function VolumeActionCard({
  manga,
  isRead,
  isLoaned,
  isSelected = false,
  onToggle,
  isAddSelected = false,
  onAddToggle,
}: VolumeActionCardProps) {
  const isOwned = manga.is_owned;
  const isClickable = isOwned || !!onAddToggle;

  function handleClick() {
    if (isOwned) onToggle(manga);
    else if (onAddToggle) onAddToggle(manga);
  }

  return (
    <button
      type="button"
      className="manga-card block w-full"
      style={{ background: 'none', border: 'none', padding: 0, cursor: isClickable ? 'pointer' : 'default' }}
      onClick={handleClick}
      aria-pressed={isClickable ? (isOwned ? isSelected : isAddSelected) : undefined}
      aria-label={`${manga.title}${manga.number ? ` — tome ${manga.number}` : ''}${isLoaned ? ' — prêté' : ''}`}
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

      {/* Read dot — top-left, hidden when selected */}
      {isRead && !isSelected && (
        <span
          className="absolute top-1.5 left-1.5 w-2.5 h-2.5 rounded-full shrink-0"
          style={{
            background: 'var(--color-read)',
            boxShadow: '0 0 0 1px color-mix(in oklch, var(--background) 80%, transparent)',
          }}
          aria-label="Lu"
        />
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

      {/* Volume number */}
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
