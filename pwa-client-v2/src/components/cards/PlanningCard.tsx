import { VolumeCard } from '@/components/cards/VolumeCard';
import type { PlanningItem, Volume } from '@/types/volume';

// ─── Helpers (module level — rerender-no-inline-components) ───────────────────

function getItemHref(item: PlanningItem): string {
    if (item.type === 'volume' && item.edition) {
        return `/series/${item.series.id}/edition/${item.edition.id}`;
    }
    return `/series/${item.series.id}/box/${item.id}`;
}

/**
 * Maps PlanningItem → Volume shape for VolumeCard.
 * release_date → published_date so the future-date pill works identically.
 */
function toVolume(item: PlanningItem): Volume {
    return {
        id: item.id,
        api_id: null,
        isbn: null,
        title: item.title,
        authors: null,
        description: null,
        published_date: item.release_date,
        page_count: null,
        cover_url: item.cover_url,
        number: item.number,
        is_owned: item.is_owned,
        is_loaned: false,
        is_wishlisted: item.is_wishlisted,
        loaned_to: null,
        series: null,
        edition: null,
    };
}

// ─── PlanningCard ─────────────────────────────────────────────────────────────

interface PlanningCardProps {
    item: PlanningItem;
}

export function PlanningCard({ item }: PlanningCardProps) {
    const href = getItemHref(item);
    const subtitle = item.type === 'box' ? 'Coffret' : (item.edition?.title ?? '');

    return (
        <div className="flex flex-col gap-2">
            <VolumeCard volume={toVolume(item)} href={href} isLastVolume={item.is_last_volume} hideOwnershipFilter alwaysShowDate />
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
