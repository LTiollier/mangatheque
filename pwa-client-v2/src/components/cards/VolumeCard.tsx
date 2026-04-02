import Image from 'next/image';
import Link from 'next/link';
import { BookUp, Heart, Package, SquareCheck } from 'lucide-react';

import { cn, formatShortDate, isFutureDate } from '@/lib/utils';
import type { Volume } from '@/types/volume';

// Static JSX hoisted outside component — never re-created (rendering-hoist-jsx)
const lastVolumeBadge = (
  <div
    className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold leading-none uppercase tracking-wide z-10"
    style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
    aria-hidden
  >
    FIN
  </div>
);

const bottomGradient = (
  <div
    aria-hidden
    className="absolute inset-0 pointer-events-none"
    style={{
      background: 'linear-gradient(to top, oklch(0% 0 0 / 0.65) 0%, transparent 55%)',
    }}
  />
);

interface VolumeCardProps {
  volume: Volume;
  href: string;
  /** Passé depuis le parent qui dispose des données de progression de lecture */
  isRead?: boolean;
  /** Multi-select — géré par le parent Client Component */
  selected?: boolean;
  /** Afficher le numéro de tome en bas de la cover */
  showNumber?: boolean;
  /** Dernier tome de l'édition — glow ambré + badge FIN */
  isLastVolume?: boolean;
  /** Désactive le filtre gris + overlay noir pour les tomes non possédés (ex: page planning) */
  hideOwnershipFilter?: boolean;
  /** Toujours afficher la date, même si elle n'est pas dans le futur (ex: page planning) */
  alwaysShowDate?: boolean;
  /** Afficher un badge "acquis" (icône checkbox) quand le tome est possédé (ex: page planning) */
  showAcquiredBadge?: boolean;
}

export function VolumeCard({
  volume,
  href,
  isRead = false,
  selected = false,
  showNumber = true,
  isLastVolume = false,
  hideOwnershipFilter = false,
  alwaysShowDate = false,
  showAcquiredBadge = false,
}: VolumeCardProps) {
  const isOwned = volume.is_owned;

  return (
    <Link
      href={href}
      className={cn(
        'volume-card block',
        selected && 'outline outline-2 outline-primary',
        isLastVolume && 'volume-card--last-volume',
      )}
      aria-label={`${volume.title}${volume.number ? ` — tome ${volume.number}` : ''}${isLastVolume ? ' — dernier tome de l\'édition' : ''}`}
    >
      {/* Cover */}
      {volume.cover_url ? (
        <Image
          src={volume.cover_url}
          alt={volume.title ?? `Tome ${volume.number}`}
          fill
          sizes="(max-width: 480px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
          className="object-cover"
          style={!isOwned && !hideOwnershipFilter ? { filter: 'grayscale(80%) brightness(0.55)' } : undefined}
        />
      ) : (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={!isOwned && !hideOwnershipFilter ? { opacity: 0.5 } : undefined}
        >
          <Package size={28} aria-hidden style={{ color: 'var(--muted-foreground)' }} />
        </div>
      )}

      {/* Gradient bas — toujours actif pour le relief visuel */}
      {bottomGradient}

      {/* Non-owned overlay */}
      {!isOwned && !hideOwnershipFilter && (
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none z-[5]"
          style={{ background: 'oklch(0% 0 0 / 0.45)' }}
        />
      )}

      {/* Badge dernier tome — top left */}
      {isLastVolume && lastVolumeBadge}

      {/* Overlay selection */}
      {selected && (
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'color-mix(in oklch, var(--primary) 20%, transparent)' }}
        />
      )}

      {/* Read strip — bordure gauche pleine hauteur (spec §4.1) */}
      {isRead && (
        <div
          className="absolute left-0 top-0 bottom-0 w-[3px] z-10"
          style={{ background: 'var(--color-read)' }}
          aria-label="Lu"
        />
      )}

      {/* Loaned badge — top right */}
      {volume.is_loaned && (
        <div
          aria-label="Prêté"
          className="absolute top-1.5 right-1.5 flex items-center justify-center w-[22px] h-[22px] rounded z-10"
          style={{ background: 'var(--color-loaned)' }}
        >
          <BookUp size={14} style={{ color: 'var(--background)' }} aria-hidden />
        </div>
      )}

      {/* Wishlist badge — top right (si pas possédé ni prêté) */}
      {volume.is_wishlisted && !isOwned && !volume.is_loaned && (
        <div
          aria-label="En wishlist"
          className="absolute top-1.5 right-1.5 flex items-center justify-center w-[22px] h-[22px] rounded z-10"
          style={{ background: 'var(--color-wishlist)' }}
        >
          <Heart size={14} style={{ color: 'var(--background)' }} aria-hidden />
        </div>
      )}

      {/* Acquired badge — top right (ex: page planning) */}
      {showAcquiredBadge && isOwned && !volume.is_loaned && (
        <div
          aria-label="Acquis"
          className="absolute top-1.5 right-1.5 flex items-center justify-center w-[22px] h-[22px] rounded z-10"
          style={{ background: 'var(--color-read)' }}
        >
          <SquareCheck size={14} style={{ color: 'var(--background)' }} aria-hidden />
        </div>
      )}

      {/* Future release date — bottom right, si pas encore sorti (owned ou non) */}
      {(alwaysShowDate ? !!volume.published_date : isFutureDate(volume.published_date)) && (
        <div
          className="absolute bottom-1.5 right-1.5 px-1 py-0.5 rounded text-[9px] font-semibold leading-none z-10"
          style={{ background: 'var(--color-upcoming)', color: 'var(--background)' }}
          aria-label={`Sortie prévue le ${formatShortDate(volume.published_date!)}`}
        >
          {formatShortDate(volume.published_date!)}
        </div>
      )}

      {/* Numéro de tome — positionné sur le gradient bas */}
      {showNumber && !!volume.number && (
        <div className="absolute bottom-0 left-0 right-0 px-1.5 pb-1.5 z-10">
          <span
            className="text-[13px] font-semibold leading-none"
            style={{ color: 'var(--foreground)', fontFamily: 'var(--font-mono)' }}
          >
            #{volume.number}
          </span>
        </div>
      )}
    </Link>
  );
}
