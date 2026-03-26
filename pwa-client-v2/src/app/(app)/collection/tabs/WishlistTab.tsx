'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Package } from 'lucide-react';

import { useWishlist, useWishlistStats, useRemoveFromWishlist } from '@/hooks/queries';
import { useOffline } from '@/contexts/OfflineContext';
import { EmptyState } from '@/components/feedback/EmptyState';
import { StatusBadge } from '@/components/feedback/StatusBadge';
import { CollectionStatBar } from '@/components/collection/CollectionStatBar';
import type { WishlistItem, WishlistEditionItem, WishlistBoxItem } from '@/types/volume';

// ─── Skeletons hoisted at module level (rendering-hoist-jsx) ─────────────────

const wishlistSkeletons = (
  <div
    className="rounded-[calc(var(--radius)*2)] overflow-hidden"
    style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
    aria-busy
  >
    {Array.from({ length: 4 }, (_, i) => (
      <div
        key={i}
        className="flex items-center gap-3 p-4 border-b last:border-b-0"
        style={{ borderColor: 'var(--border)' }}
        aria-hidden
      >
        <div
          className="skeleton shrink-0 w-10 rounded"
          style={{ aspectRatio: '2/3' }}
        />
        <div className="flex-1 flex flex-col gap-2">
          <div className="skeleton h-4 w-2/3 rounded" />
          <div className="skeleton h-3 w-1/3 rounded" />
        </div>
        <div className="skeleton h-8 w-16 rounded" />
      </div>
    ))}
  </div>
);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getItemTitle(item: WishlistItem): string {
  return item.type === 'edition'
    ? (item as WishlistEditionItem).name
    : (item as WishlistBoxItem).title;
}

function getItemPublisher(item: WishlistItem): string | null {
  return item.type === 'edition' ? (item as WishlistEditionItem).publisher : null;
}

function getItemHref(item: WishlistItem): string | null {
  if (item.type === 'edition') {
    const edition = item as WishlistEditionItem;
    const seriesId = edition.series_id ?? edition.series?.id;
    if (!seriesId) return null;
    return `/series/${seriesId}/edition/${edition.id}`;
  }
  const box = item as WishlistBoxItem;
  const seriesId = box.series_id ?? box.box_set?.series_id;
  const boxSetId = box.box_set_id ?? box.box_set?.id;
  if (!seriesId || !boxSetId) return null;
  return `/series/${seriesId}/box-set/${boxSetId}`;
}

// ─── WishlistRowContent — defined outside parent (rerender-no-inline-components) ─

interface WishlistRowContentProps {
  title: string;
  publisher: string | null;
  cover: string | null;
}

function WishlistRowContent({ title, publisher, cover }: WishlistRowContentProps) {
  return (
    <>
      {/* Cover thumbnail */}
      <div
        className="shrink-0 w-10 relative overflow-hidden"
        style={{
          aspectRatio: '2/3',
          background: 'var(--muted)',
          borderRadius: 'var(--radius)',
        }}
      >
        {cover ? (
          <Image src={cover} alt={title} fill sizes="40px" className="object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Package size={14} aria-hidden style={{ color: 'var(--muted-foreground)' }} />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <p
          className="text-sm font-semibold leading-tight truncate"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}
        >
          {title}
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <StatusBadge variant="wishlist" />
          {publisher ? (
            <span className="text-xs truncate" style={{ color: 'var(--muted-foreground)' }}>
              {publisher}
            </span>
          ) : null}
        </div>
      </div>
    </>
  );
}

// ─── WishlistRow — defined outside parent component (rerender-no-inline-components) ─

function WishlistRow({ item }: { item: WishlistItem }) {
  const { mutate, isPending } = useRemoveFromWishlist();
  const { isOffline } = useOffline();

  const title = getItemTitle(item);
  const publisher = getItemPublisher(item);
  const cover = item.cover_url ?? null;
  const href = getItemHref(item);

  return (
    <div
      className="flex items-center gap-3 p-4 border-b last:border-b-0"
      style={{ borderColor: 'var(--border)' }}
    >
      {href ? (
        <Link href={href} className="flex items-center gap-3 flex-1 min-w-0">
          <WishlistRowContent title={title} publisher={publisher} cover={cover} />
        </Link>
      ) : (
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <WishlistRowContent title={title} publisher={publisher} cover={cover} />
        </div>
      )}

      {/* Remove button */}
      <button
        type="button"
        onClick={() => mutate({ id: item.id, type: item.type })}
        disabled={isPending || isOffline}
        className="shrink-0 text-xs font-medium h-8 px-3 transition-opacity disabled:opacity-50 hover:opacity-80"
        style={{
          background: 'var(--secondary)',
          color: 'var(--muted-foreground)',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--border)',
        }}
        aria-label={`Retirer ${title} de la wishlist`}
      >
        {isPending ? '…' : 'Retirer'}
      </button>
    </div>
  );
}

// ─── WishlistTab ─────────────────────────────────────────────────────────────

export function WishlistTab() {
  const { data: items = [], isLoading } = useWishlist();
  const { data: stats } = useWishlistStats();

  if (isLoading) return wishlistSkeletons;

  return (
    <div className="flex flex-col gap-0">
      <CollectionStatBar items={[
        { value: items.length, label: 'En envies' },
        { value: stats?.total_volumes ?? '—', label: 'Tomes total' },
      ]} />
      {items.length === 0 ? (
        <EmptyState context="wishlist" action={{ label: 'Rechercher', href: '/search' }} />
      ) : (
        <div
          className="rounded-[calc(var(--radius)*2)] overflow-hidden"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          {items.map(item => (
            <WishlistRow key={`${item.type}-${item.id}`} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
