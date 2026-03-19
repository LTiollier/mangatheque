import Image from 'next/image';
import Link from 'next/link';
import { BookUp, Heart, Package } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { Manga } from '@/types/manga';

// Static JSX hoisted outside component — never re-created (rendering-hoist-jsx)
const bottomGradient = (
  <div
    aria-hidden
    className="absolute inset-0 pointer-events-none"
    style={{
      background: 'linear-gradient(to top, oklch(0% 0 0 / 0.65) 0%, transparent 55%)',
    }}
  />
);

const coverFallback = (
  <div className="absolute inset-0 flex items-center justify-center">
    <Package size={28} aria-hidden style={{ color: 'var(--muted-foreground)' }} />
  </div>
);

interface VolumeCardProps {
  manga: Manga;
  href: string;
  /** Passé depuis le parent qui dispose des données de progression de lecture */
  isRead?: boolean;
  /** Multi-select — géré par le parent Client Component */
  selected?: boolean;
  /** Afficher le numéro de tome en bas de la cover */
  showNumber?: boolean;
}

export function VolumeCard({
  manga,
  href,
  isRead = false,
  selected = false,
  showNumber = true,
}: VolumeCardProps) {
  return (
    <Link
      href={href}
      className={cn('manga-card block', selected && 'outline outline-2 outline-primary')}
      aria-label={`${manga.title}${manga.number ? ` — tome ${manga.number}` : ''}`}
    >
      {/* Cover */}
      {manga.cover_url ? (
        <Image
          src={manga.cover_url}
          alt={manga.title ?? `Tome ${manga.number}`}
          fill
          sizes="(max-width: 480px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
          className="object-cover"
        />
      ) : (
        coverFallback
      )}

      {/* Gradient bas — toujours actif pour le relief visuel */}
      {bottomGradient}

      {/* Overlay selection */}
      {selected && (
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'color-mix(in oklch, var(--primary) 20%, transparent)' }}
        />
      )}

      {/* Read dot — 10px top left, ring pour contraste sur covers sombres (spec §6.2) */}
      {isRead && (
        <span
          className="absolute top-1.5 left-1.5 w-2.5 h-2.5 rounded-full shrink-0"
          style={{
            background: 'var(--color-read)',
            boxShadow: '0 0 0 1px color-mix(in oklch, var(--background) 80%, transparent)',
          }}
          aria-label="Lu"
        />
      )}

      {/* Loaned badge — top right (priorité sur wishlist) */}
      {manga.is_loaned && (
        <div
          aria-label="Prêté"
          className="absolute top-1.5 right-1.5 flex items-center justify-center w-[22px] h-[22px] rounded"
          style={{ background: 'var(--color-loaned)' }}
        >
          <BookUp size={14} style={{ color: 'var(--background)' }} aria-hidden />
        </div>
      )}

      {/* Wishlist badge — top right (si pas possédé ni prêté) */}
      {manga.is_wishlisted && !manga.is_owned && !manga.is_loaned && (
        <div
          aria-label="En wishlist"
          className="absolute top-1.5 right-1.5 flex items-center justify-center w-[22px] h-[22px] rounded"
          style={{ background: 'var(--color-wishlist)' }}
        >
          <Heart size={14} style={{ color: 'var(--background)' }} aria-hidden />
        </div>
      )}

      {/* Numéro de tome — positionné sur le gradient bas */}
      {showNumber && manga.number && (
        <div className="absolute bottom-0 left-0 right-0 px-1.5 pb-1.5">
          <span
            className="text-[11px] font-medium leading-none"
            style={{ color: 'var(--foreground)', fontFamily: 'var(--font-mono)' }}
          >
            #{manga.number}
          </span>
        </div>
      )}
    </Link>
  );
}
