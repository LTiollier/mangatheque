'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { BookOpen, Library, BookMarked, Users, AlertTriangle } from 'lucide-react';
import { differenceInDays } from 'date-fns';

import { useAuth } from '@/contexts/AuthContext';
import { useMangas, useLoansQuery, useReadingProgressQuery } from '@/hooks/queries';
import { StatGrid } from '@/components/dashboard/StatGrid';
import { StatCard } from '@/components/dashboard/StatCard';
import { VolumeCard } from '@/components/cards/VolumeCard';
import { SkeletonCard } from '@/components/feedback/SkeletonCard';
import { sectionVariants } from '@/lib/motion';
import type { Manga } from '@/types/manga';

const OVERDUE_DAYS = 30;
const RECENT_COUNT = 8;

// ─── Hoisted static JSX (rendering-hoist-jsx) ────────────────────────────────

const statsSkeletons = (
  <div
    className="grid grid-cols-2 gap-3 md:gap-4"
    aria-busy
    aria-label="Chargement des statistiques"
  >
    {Array.from({ length: 4 }, (_, i) => (
      <div key={i} className="skeleton h-[88px] rounded-[calc(var(--radius)*2)]" aria-hidden />
    ))}
  </div>
);

const recentSkeletons = (
  <div className="flex gap-3" aria-busy aria-label="Chargement">
    {Array.from({ length: 6 }, (_, i) => (
      <div key={i} className="shrink-0 w-[72px]">
        <SkeletonCard />
      </div>
    ))}
  </div>
);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getMangaHref(manga: Manga): string {
  const { series, edition } = manga;
  if (series?.id && edition?.id) return `/series/${series.id}/edition/${edition.id}`;
  return '/collection';
}

// ─── Component ───────────────────────────────────────────────────────────────

export function DashboardClient() {
  const { user } = useAuth();

  // 3 queries parallèles — React Query les lance simultanément (async-parallel)
  const { data: mangas = [], isLoading: mangasLoading } = useMangas();
  const { data: loans = [], isLoading: loansLoading } = useLoansQuery();
  const { data: readingProgress = [], isLoading: progressLoading } = useReadingProgressQuery();

  const statsLoading = mangasLoading || loansLoading || progressLoading;

  // Stats dérivées pendant le render — pas de useEffect (rerender-derived-state-no-effect)
  const stats = useMemo(() => {
    const owned = mangas.filter(m => m.is_owned);
    // Set pour O(1) lookup sur les series uniques (js-set-map-lookups)
    const seriesIds = new Set(owned.map(m => m.series?.id).filter((id): id is number => id != null));
    return {
      totalVolumes: owned.length,
      totalSeries: seriesIds.size,
      totalRead: readingProgress.length,
      activeLoans: loans.filter(l => !l.is_returned).length,
    };
  }, [mangas, loans, readingProgress]);

  // Prêts en retard — actifs depuis >= OVERDUE_DAYS
  const overdueCount = useMemo(
    () =>
      loans.filter(
        l =>
          !l.is_returned &&
          differenceInDays(new Date(), new Date(l.loaned_at)) >= OVERDUE_DAYS,
      ).length,
    [loans],
  );

  // Derniers ajouts — premiers RECENT_COUNT volumes possédés (API retourne les plus récents en premier)
  const recentMangas = useMemo(
    () => mangas.filter(m => m.is_owned).slice(0, RECENT_COUNT),
    [mangas],
  );

  const firstName = user?.name?.split(' ')[0] ?? 'Collector';

  return (
    <div className="flex flex-col gap-8">
      {/* Greeting */}
      <motion.div variants={sectionVariants} initial="initial" animate="animate">
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          Bonjour,
        </p>
        <h1
          className="text-2xl font-bold mt-0.5 leading-tight"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}
        >
          {firstName}
        </h1>
      </motion.div>

      {/* Alerte prêts en retard */}
      {!loansLoading && overdueCount > 0 && (
        <motion.div variants={sectionVariants} initial="initial" animate="animate">
          <Link
            href="/collection"
            className="flex items-center gap-3 p-4 transition-opacity hover:opacity-80"
            style={{
              background: 'color-mix(in oklch, var(--destructive) 12%, var(--card))',
              border: '1px solid color-mix(in oklch, var(--destructive) 35%, transparent)',
              borderRadius: 'calc(var(--radius) * 2)',
            }}
          >
            <AlertTriangle
              size={18}
              aria-hidden
              style={{ color: 'var(--destructive)', flexShrink: 0 }}
            />
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                {overdueCount} prêt{overdueCount > 1 ? 's' : ''} en retard
              </span>
              <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                Plus de {OVERDUE_DAYS} jours sans retour · Voir les prêts →
              </span>
            </div>
          </Link>
        </motion.div>
      )}

      {/* Stats 2×2 */}
      <motion.section
        variants={sectionVariants}
        initial="initial"
        animate="animate"
        aria-label="Statistiques de la collection"
      >
        <h2
          className="text-xs font-semibold uppercase mb-3"
          style={{ color: 'var(--muted-foreground)', letterSpacing: '0.08em' }}
        >
          Ma collection
        </h2>
        {statsLoading ? (
          statsSkeletons
        ) : (
          <StatGrid>
            <StatCard icon={BookOpen} value={stats.totalVolumes} label="Volumes possédés" highlight />
            <StatCard icon={Library} value={stats.totalSeries} label="Séries" />
            <StatCard icon={BookMarked} value={stats.totalRead} label="Volumes lus" />
            <StatCard icon={Users} value={stats.activeLoans} label="Prêts actifs" />
          </StatGrid>
        )}
      </motion.section>

      {/* Derniers ajouts */}
      {(mangasLoading || recentMangas.length > 0) && (
        <motion.section
          variants={sectionVariants}
          initial="initial"
          animate="animate"
          aria-label="Derniers ajouts à la collection"
        >
          <div className="flex items-center justify-between mb-3">
            <h2
              className="text-xs font-semibold uppercase"
              style={{ color: 'var(--muted-foreground)', letterSpacing: '0.08em' }}
            >
              Derniers ajouts
            </h2>
            <Link
              href="/collection"
              className="text-xs transition-opacity hover:opacity-80"
              style={{ color: 'var(--primary)' }}
            >
              Voir tout
            </Link>
          </div>

          {/*
           * -mx-4 + px-4 : le scroll déborde jusqu'aux bords de l'écran
           * tout en conservant l'indentation du premier item
           */}
          <div className="overflow-x-auto -mx-4 px-4">
            {mangasLoading ? (
              recentSkeletons
            ) : (
              <div className="flex gap-3 pb-1">
                {recentMangas.map(manga => (
                  <div key={manga.id} className="shrink-0 w-[72px]">
                    <VolumeCard manga={manga} href={getMangaHref(manga)} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.section>
      )}
    </div>
  );
}
