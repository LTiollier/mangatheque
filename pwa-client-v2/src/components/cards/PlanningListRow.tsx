import { memo } from 'react';
import Image from 'next/image';
import { Package } from 'lucide-react';

import type { PlanningItem } from '@/types/volume';

// ─── Fallback hoisted (rendering-hoist-jsx) ───────────────────────────────────
const listRowFallback = (
  <div className="absolute inset-0 flex items-center justify-center">
    <Package size={16} aria-hidden style={{ color: 'var(--muted-foreground)' }} />
  </div>
);

// ─── Options de formatage de date hoistées (rendering-hoist-jsx) ─────────────
const DATE_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  day:   'numeric',
  month: 'long',
  year:  'numeric',
};

// ─── Badge hoisted (rendering-hoist-jsx) ──────────────────────────────────────
const badgeStyles: Record<string, { background: string; color: string; label: string }> = {
  owned:    { background: 'color-mix(in oklch, var(--color-read) 15%, transparent)',    color: 'var(--color-read)',    label: 'Possédé'  },
  wishlist: { background: 'color-mix(in oklch, var(--primary) 15%, transparent)',       color: 'var(--primary)',       label: 'Envie'    },
  upcoming: { background: 'color-mix(in oklch, var(--muted-foreground) 15%, transparent)', color: 'var(--muted-foreground)', label: 'À venir' },
};

interface PlanningListRowProps {
  item: PlanningItem;
}

// ─── Défini au module level (rerender-no-inline-components) + memo (rerender-memo)
export const PlanningListRow = memo(function PlanningListRow({ item }: PlanningListRowProps) {
  const coverUrl = item.cover_url;

  const releaseDate = new Date(item.release_date).toLocaleDateString('fr-FR', DATE_FORMAT_OPTIONS);

  const badgeKey = item.is_owned ? 'owned' : item.is_wishlisted ? 'wishlist' : 'upcoming';
  const badge = badgeStyles[badgeKey];

  const subtitle = [item.series.title, item.edition?.title].filter(Boolean).join(' · ');

  return (
    <div
      className="flex items-center gap-3 py-3 border-b last:border-b-0"
      style={{ borderColor: 'var(--border)' }}
    >
      {/* Thumbnail */}
      <div
        className="shrink-0 w-12 relative overflow-hidden"
        style={{ aspectRatio: '2/3', background: 'var(--muted)', borderRadius: 'var(--radius)' }}
      >
        {coverUrl ? (
          <Image src={coverUrl} alt={item.title} fill sizes="48px" className="object-cover" />
        ) : (
          listRowFallback
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-semibold truncate leading-tight"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}
        >
          {item.title}
        </p>
        {subtitle ? (
          <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--muted-foreground)' }}>
            {subtitle}
          </p>
        ) : null}
        <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
          {releaseDate}
        </p>
      </div>

      {/* Badge */}
      <span
        className="shrink-0 px-2 py-0.5 rounded text-[10px] font-semibold"
        style={{ background: badge.background, color: badge.color, borderRadius: 'var(--radius)' }}
      >
        {badge.label}
      </span>
    </div>
  );
});
