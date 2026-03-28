import { memo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Package2, Heart } from 'lucide-react';

// Hoisted fallback — icône coffret + fond muted (rendering-hoist-jsx)
const coverFallback = (
  <div className="absolute inset-0 flex items-center justify-center">
    <Package2 size={32} aria-hidden style={{ color: 'var(--muted-foreground)' }} />
  </div>
);

// Hoisted — badge coffret identique sur chaque carte (rendering-hoist-jsx)
const boxBadge = (
  <div
    className="absolute top-1.5 left-1.5 flex items-center justify-center w-[22px] h-[22px] rounded"
    style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
    aria-label="Coffret"
  >
    <Package2 size={12} style={{ color: 'var(--muted-foreground)' }} aria-hidden />
  </div>
);

interface BoxCardProps {
  title: string;
  coverUrl: string | null;
  href: string;
  /** Sous-titre : nom de la série ou de l'éditeur */
  subtitle?: string;
  isOwned?: boolean;
  isWishlisted?: boolean;
  /** Nombre de boîtes (pour un BoxSet) */
  boxCount?: number;
  /** Nombre de volumes (pour une Box individuelle) */
  volumeCount?: number;
  /** Précharger l'image — à activer sur les cards du premier fold (LCP) */
  priority?: boolean;
}

export const BoxCard = memo(function BoxCard({
  title,
  coverUrl,
  href,
  subtitle,
  isOwned = false,
  isWishlisted = false,
  boxCount,
  volumeCount,
  priority = false,
}: BoxCardProps) {
  const countLabel =
    boxCount !== undefined
      ? `${boxCount} boîte${boxCount > 1 ? 's' : ''}`
      : volumeCount !== undefined
        ? `${volumeCount} vol.`
        : null;

  const metaLine = [subtitle, countLabel].filter(Boolean).join(' · ');

  return (
    <Link href={href} className="group flex flex-col gap-2">
      {/* Cover — ratio 2:3 avec badge coffret distinctif */}
      <div
        className="relative overflow-hidden rounded-[calc(var(--radius)*2)] aspect-[2/3] w-full"
        style={{ background: 'var(--muted)' }}
      >
        {coverUrl ? (
          <Image
            src={coverUrl}
            alt={title}
            fill
            sizes="(max-width: 480px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
            className="object-cover transition-transform duration-200 group-hover:scale-[1.02]"
            priority={priority}
          />
        ) : (
          coverFallback
        )}

        {/* Badge coffret — top left, icône distincte des VolumeCards */}
        {boxBadge}

        {/* Wishlist badge — top right (seulement si non possédé) */}
        {isWishlisted && !isOwned && (
          <div
            aria-label="En wishlist"
            className="absolute top-1.5 right-1.5 flex items-center justify-center w-[22px] h-[22px] rounded"
            style={{ background: 'var(--color-wishlist)' }}
          >
            <Heart size={14} style={{ color: 'var(--background)' }} aria-hidden />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col gap-1 px-0.5">
        <p
          className="text-sm font-semibold leading-tight line-clamp-2"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}
        >
          {title}
        </p>
        {metaLine && (
          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            {metaLine}
          </p>
        )}
      </div>
    </Link>
  );
});
