'use client';

import Image from 'next/image';
import Link from 'next/link';
import { BookOpen, Package2, Heart, CheckCircle2 } from 'lucide-react';

import type { PlanningItem } from '@/types/manga';
import { useTogglePlanningWishlist } from '@/hooks/queries';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDateLabel(releaseDate: string): { label: string; isImminent: boolean; isPast: boolean } {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const release = new Date(releaseDate);
    const releaseDay = new Date(release.getFullYear(), release.getMonth(), release.getDate());
    const diffMs = releaseDay.getTime() - today.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
        return {
            label: release.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
            isImminent: false,
            isPast: true,
        };
    }
    if (diffDays === 0) return { label: "Aujourd'hui", isImminent: true, isPast: false };
    if (diffDays <= 7) return { label: `Dans ${diffDays}j`, isImminent: true, isPast: false };
    return {
        label: release.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
        isImminent: false,
        isPast: false,
    };
}

function getItemHref(item: PlanningItem): string {
    if (item.type === 'volume' && item.edition) {
        return `/series/${item.series.id}/edition/${item.edition.id}`;
    }
    return `/series/${item.series.id}/box/${item.id}`;
}

// ─── Static JSX (rendering-hoist-jsx) ────────────────────────────────────────

const bottomGradient = (
    <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(to top, oklch(0% 0 0 / 0.70) 0%, transparent 50%)' }}
    />
);

// ─── PlanningCard ─────────────────────────────────────────────────────────────

interface PlanningCardProps {
    item: PlanningItem;
}

export function PlanningCard({ item }: PlanningCardProps) {
    const { mutate: toggleWishlist, isPending } = useTogglePlanningWishlist();
    const { label: dateLabel, isImminent, isPast } = getDateLabel(item.release_date);
    const href = getItemHref(item);
    const isBox = item.type === 'box';
    const subtitle = isBox ? 'Coffret' : (item.edition?.title ?? '');

    function handleWishlistClick(e: React.MouseEvent) {
        e.preventDefault();
        e.stopPropagation();
        toggleWishlist({
            itemId: item.id,
            itemType: item.type,
            editionId: item.edition?.id ?? null,
            isCurrentlyWishlisted: item.is_wishlisted,
        });
    }

    return (
        <div className="flex flex-col gap-2">
            {/* Cover wrapper */}
            <Link
                href={href}
                className="relative overflow-hidden block transition-transform duration-200 hover:scale-[1.02]"
                style={{
                    borderRadius: 'calc(var(--radius) * 2)',
                    aspectRatio: '2/3',
                    background: 'var(--muted)',
                    ...(isPast ? { opacity: 0.75 } : {}),
                    ...(isImminent ? { boxShadow: 'var(--shadow-glow-sm, 0 0 8px color-mix(in oklch, var(--primary) 40%, transparent))' } : {}),
                }}
                aria-label={item.title}
            >
                {item.cover_url ? (
                    <Image
                        src={item.cover_url}
                        alt={item.title}
                        fill
                        sizes="(max-width: 480px) 33vw, (max-width: 768px) 25vw, 20vw"
                        className="object-cover"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Package2 size={28} aria-hidden style={{ color: 'var(--muted-foreground)' }} />
                    </div>
                )}

                {bottomGradient}

                {/* Type badge — top left */}
                <div
                    className="absolute top-1.5 left-1.5 flex items-center justify-center w-[22px] h-[22px] rounded"
                    style={{
                        background: isBox ? 'var(--secondary)' : 'var(--card)',
                        border: '1px solid var(--border)',
                    }}
                    aria-label={isBox ? 'Coffret' : 'Tome'}
                >
                    {isBox
                        ? <Package2 size={12} style={{ color: 'var(--foreground)' }} aria-hidden />
                        : <BookOpen size={12} style={{ color: 'var(--foreground)' }} aria-hidden />
                    }
                </div>

                {/* Status badge — top right */}
                {item.is_owned ? (
                    <div
                        className="absolute top-1.5 right-1.5 flex items-center justify-center w-[22px] h-[22px] rounded"
                        style={{ background: 'var(--color-owned, oklch(55% 0.15 200))' }}
                        aria-label="Possédé"
                    >
                        <CheckCircle2 size={13} style={{ color: 'var(--background)' }} aria-hidden />
                    </div>
                ) : item.is_wishlisted ? (
                    <button
                        type="button"
                        onClick={handleWishlistClick}
                        disabled={isPending}
                        className="absolute top-1.5 right-1.5 flex items-center justify-center w-[22px] h-[22px] rounded transition-opacity disabled:opacity-50"
                        style={{ background: 'var(--color-wishlist, oklch(60% 0.2 330))' }}
                        aria-label="Retirer de la wishlist"
                    >
                        <Heart size={13} style={{ color: 'var(--background)' }} aria-hidden />
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={handleWishlistClick}
                        disabled={isPending}
                        className="absolute top-1.5 right-1.5 flex items-center justify-center w-[22px] h-[22px] rounded transition-opacity disabled:opacity-50 hover:opacity-80"
                        style={{
                            background: 'color-mix(in oklch, var(--card) 80%, transparent)',
                            border: '1px solid var(--border)',
                        }}
                        aria-label="Ajouter à la wishlist"
                    >
                        <Heart size={13} style={{ color: 'var(--muted-foreground)' }} aria-hidden />
                    </button>
                )}

                {/* Number + date on gradient */}
                <div className="absolute bottom-0 left-0 right-0 px-1.5 pb-1.5 flex justify-between items-end">
                    {item.number ? (
                        <span
                            className="text-[11px] font-medium leading-none"
                            style={{ color: 'var(--foreground)', fontFamily: 'var(--font-mono)' }}
                        >
                            #{item.number}
                        </span>
                    ) : <span />}
                    <span
                        className="text-[10px] font-medium leading-none"
                        style={{
                            color: isPast
                                ? 'var(--muted-foreground)'
                                : isImminent
                                    ? 'var(--primary)'
                                    : 'var(--foreground)',
                            fontFamily: 'var(--font-mono)',
                        }}
                    >
                        {dateLabel}
                    </span>
                </div>
            </Link>

            {/* Text info */}
            <div className="flex flex-col gap-0.5 px-0.5">
                <p
                    className="text-[11px] font-semibold leading-tight line-clamp-1"
                    style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}
                >
                    {item.series.title}
                </p>
                {subtitle ? (
                    <p className="text-[10px] leading-none line-clamp-1" style={{ color: 'var(--muted-foreground)' }}>
                        {subtitle}
                    </p>
                ) : null}
            </div>
        </div>
    );
}

// ─── PlanningCardSkeleton ─────────────────────────────────────────────────────

export function PlanningCardSkeleton() {
    return (
        <div className="flex flex-col gap-2" aria-hidden>
            <div
                className="skeleton w-full rounded-[calc(var(--radius)*2)]"
                style={{ aspectRatio: '2/3' }}
            />
            <div className="flex flex-col gap-1.5 px-0.5">
                <div className="skeleton h-3 w-4/5 rounded" />
                <div className="skeleton h-2.5 w-1/2 rounded" />
            </div>
        </div>
    );
}
