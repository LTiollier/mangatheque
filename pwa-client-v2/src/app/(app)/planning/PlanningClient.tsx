'use client';

import { useEffect, useRef, useMemo } from 'react';
import { CalendarDays, RefreshCw } from 'lucide-react';

import { usePlanningQuery } from '@/hooks/queries';
import { PlanningCard, PlanningCardSkeleton } from '@/components/cards/PlanningCard';
import { EmptyState } from '@/components/feedback/EmptyState';
import type { PlanningItem } from '@/types/volume';

// ─── MonthDivider ─────────────────────────────────────────────────────────────

interface MonthDividerProps {
    label: string;
    isCurrentMonth: boolean;
}

function MonthDivider({ label, isCurrentMonth }: MonthDividerProps) {
    return (
        <div className="flex items-center gap-3 py-4">
            <span
                className="text-[11px] font-semibold uppercase tracking-[0.12em] shrink-0"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--muted-foreground)' }}
            >
                {label}
            </span>
            {isCurrentMonth && (
                <span
                    className="px-2 py-0.5 rounded text-[10px] font-semibold shrink-0"
                    style={{
                        background: 'color-mix(in oklch, var(--primary) 15%, transparent)',
                        color: 'var(--primary)',
                        fontFamily: 'var(--font-display)',
                    }}
                >
                    Ce mois-ci
                </span>
            )}
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
        </div>
    );
}

// ─── Grouped items by month ───────────────────────────────────────────────────

interface MonthGroup {
    key: string;
    label: string;
    isCurrentMonth: boolean;
    items: PlanningItem[];
}

function groupByMonth(items: PlanningItem[]): MonthGroup[] {
    const now = new Date();
    const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const map = new Map<string, PlanningItem[]>();
    for (const item of items) {
        const date = new Date(item.release_date);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const bucket = map.get(key);
        if (bucket) {
            bucket.push(item);
        } else {
            map.set(key, [item]);
        }
    }

    return Array.from(map.entries()).map(([key, groupItems]) => {
        const [year, month] = key.split('-').map(Number);
        const label = new Date(year, month - 1, 1).toLocaleDateString('fr-FR', {
            month: 'long',
            year: 'numeric',
        });
        return {
            key,
            label: label.charAt(0).toUpperCase() + label.slice(1),
            isCurrentMonth: key === currentKey,
            items: groupItems,
        };
    });
}

// ─── Static skeletons (rendering-hoist-jsx) ───────────────────────────────────

const initialSkeletons = (
    <div className="grid grid-cols-3 gap-3 lg:grid-cols-5 lg:gap-4" aria-busy aria-label="Chargement">
        {Array.from({ length: 9 }, (_, i) => (
            <PlanningCardSkeleton key={i} />
        ))}
    </div>
);

const loadMoreSkeletons = (
    <div className="grid grid-cols-3 gap-3 lg:grid-cols-5 lg:gap-4" aria-busy>
        {Array.from({ length: 3 }, (_, i) => (
            <PlanningCardSkeleton key={i} />
        ))}
    </div>
);

// ─── PlanningClient ───────────────────────────────────────────────────────────

export function PlanningClient() {
    const sentinelRef = useRef<HTMLDivElement>(null);
    const currentMonthRef = useRef<HTMLElement>(null);
    const hasScrolled = useRef(false);

    const {
        data,
        isLoading,
        isError,
        refetch,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = usePlanningQuery();

    // Flatten all pages (js-combine-iterations)
    const allItems = useMemo(() => data?.pages.flatMap(p => p.data) ?? [], [data]);
    const groups = useMemo(() => groupByMonth(allItems), [allItems]);

    // Find the target month key to scroll to (current month or closest future)
    const targetMonthKey = useMemo(() => {
        if (groups.length === 0) return null;
        const now = new Date();
        const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

        // 1. Try to find the exact current month
        if (groups.some(g => g.key === currentKey)) {
            return currentKey;
        }

        // 2. Default to the closest future month
        const futureGroup = groups.find(g => g.key > currentKey);
        if (futureGroup) {
            return futureGroup.key;
        }

        // 3. Fallback to the very first group if everything is in the past
        return groups[0].key;
    }, [groups]);

    // Scroll to target month once after initial load (rerender-use-ref-transient-values)
    useEffect(() => {
        if (hasScrolled.current || !currentMonthRef.current || !targetMonthKey) return;
        
        // Use requestAnimationFrame to ensure the DOM is ready and laid out
        const timer = requestAnimationFrame(() => {
            if (currentMonthRef.current) {
                hasScrolled.current = true;
                currentMonthRef.current.scrollIntoView({ behavior: 'instant', block: 'start' });
            }
        });

        return () => cancelAnimationFrame(timer);
    }, [targetMonthKey]);

    // IntersectionObserver for infinite scroll
    useEffect(() => {
        const el = sentinelRef.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
                    fetchNextPage();
                }
            },
            { threshold: 0.1 }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    return (
        <div className="flex flex-col min-h-screen" style={{ background: 'var(--background)' }}>
            {/* Sticky header */}
            <header
                className="sticky top-0 z-10 flex items-center px-4 h-14"
                style={{
                    background: 'color-mix(in oklch, var(--background) 85%, transparent)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    borderBottom: '1px solid color-mix(in oklch, var(--border) 50%, transparent)',
                }}
            >
                <h1
                    className="text-xl font-bold"
                    style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}
                >
                    Planning
                </h1>
            </header>

            {/* Content */}
            <div className="flex-1 px-4 pt-4 pb-safe">
                {isLoading ? (
                    initialSkeletons
                ) : isError ? (
                    <div className="flex flex-col items-center gap-4 py-16 text-center">
                        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                            Impossible de charger le planning.
                        </p>
                        <button
                            type="button"
                            onClick={() => refetch()}
                            className="inline-flex items-center gap-2 h-9 px-4 rounded text-sm font-medium transition-opacity hover:opacity-80"
                            style={{
                                background: 'var(--secondary)',
                                color: 'var(--foreground)',
                                border: '1px solid var(--border)',
                                borderRadius: 'var(--radius)',
                            }}
                        >
                            <RefreshCw size={14} aria-hidden />
                            Réessayer
                        </button>
                    </div>
                ) : allItems.length === 0 ? (
                    <EmptyState
                        icon={CalendarDays}
                        title="Aucune sortie prévue"
                        description="Ajoutez des mangas à votre collection pour voir leurs prochaines sorties."
                        action={{ label: 'Rechercher', href: '/search' }}
                    />
                ) : (
                    <>
                        {groups.map(group => (
                            <section
                                key={group.key}
                                ref={group.key === targetMonthKey ? currentMonthRef : undefined}
                                style={group.key === targetMonthKey ? { scrollMarginTop: '56px' } : undefined}
                            >
                                <MonthDivider label={group.label} isCurrentMonth={group.isCurrentMonth} />
                                <div className="grid grid-cols-3 gap-3 lg:grid-cols-5 lg:gap-4">
                                    {group.items.map(item => (
                                        <PlanningCard key={`${item.type}-${item.id}`} item={item} />
                                    ))}
                                </div>
                            </section>
                        ))}

                        {/* Sentinel */}
                        <div ref={sentinelRef} className="h-4" />
                        {isFetchingNextPage && loadMoreSkeletons}
                        {!hasNextPage && allItems.length > 0 && (
                            <p
                                className="text-center text-xs py-6"
                                style={{ color: 'var(--muted-foreground)' }}
                            >
                                Fin du planning disponible
                            </p>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
