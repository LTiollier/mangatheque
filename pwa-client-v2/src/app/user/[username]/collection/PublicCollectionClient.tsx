'use client';

import { useMemo, useState, useDeferredValue } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { UserX } from 'lucide-react';

import { usePublicProfileQuery, usePublicCollectionQuery } from '@/hooks/queries';
import { useGroupedCollection } from '@/hooks/useGroupedCollection';
import { countReleasedOwned, sumReleasedTotal } from '@/lib/collection';
import { SeriesCard } from '@/components/cards/SeriesCard';
import { SearchBar } from '@/components/forms/SearchBar';
import { SkeletonCard } from '@/components/feedback/SkeletonCard';
import { EmptyState } from '@/components/feedback/EmptyState';
import { sectionVariants } from '@/lib/motion';

// ─── Hoisted static JSX (rendering-hoist-jsx) ─────────────────────────────────

const skeletonGrid = (
  <div className="volume-grid" aria-busy aria-hidden>
    <SkeletonCard variant="series" count={8} />
  </div>
);

const notFoundState = (
  <div className="flex flex-col items-center gap-4 py-16 text-center">
    <div
      className="flex items-center justify-center w-16 h-16 rounded-full"
      style={{ background: 'var(--muted)' }}
    >
      <UserX size={28} aria-hidden style={{ color: 'var(--muted-foreground)' }} />
    </div>
    <div className="flex flex-col gap-1">
      <p
        className="text-base font-semibold"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}
      >
        Profil introuvable
      </p>
      <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
        Ce profil est privé ou n&apos;existe pas.
      </p>
    </div>
    <Link
      href="/"
      className="text-sm font-medium transition-opacity hover:opacity-70"
      style={{ color: 'var(--primary)' }}
    >
      ← Retour à l&apos;accueil
    </Link>
  </div>
);

// ─── PublicCollectionClient ───────────────────────────────────────────────────

interface PublicCollectionClientProps {
  username: string;
}

export function PublicCollectionClient({ username }: PublicCollectionClientProps) {
  // 2 queries fired simultaneously — no waterfall (async-parallel)
  const {
    data: profile,
    isLoading: profileLoading,
    isError: profileError,
  } = usePublicProfileQuery(username);

  const { data: collection = [], isLoading: collectionLoading } =
    usePublicCollectionQuery(username);

  const isLoading = profileLoading || collectionLoading;

  const [search, setSearch] = useState('');

  // Deferred value — filtering does not block keystrokes on large collections
  // (rerender-use-deferred-value)
  const deferredSearch = useDeferredValue(search);

  // Memoized owned filter separate from grouping — avoids regrouping when only
  // search changes (rerender-memo split via useGroupedCollection)
  const ownedVolumes = useMemo(() => collection.filter(m => m.is_owned), [collection]);

  // useGroupedCollection has its own split useMemos internally
  const grouped = useGroupedCollection(ownedVolumes, deferredSearch);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        {/* Header skeleton */}
        <div className="flex items-center gap-3 mb-2" aria-hidden>
          <div className="skeleton w-10 h-10 rounded-full" />
          <div className="skeleton h-5 w-32 rounded" />
        </div>
        {skeletonGrid}
      </div>
    );
  }

  if (profileError || !profile) return notFoundState;

  const displayName = profile.username ?? profile.name ?? username;
  const seriesGroups = grouped.filter(gs => gs.series.id > 0);

  return (
    <motion.div
      variants={sectionVariants}
      initial="initial"
      animate="animate"
      className="flex flex-col gap-4"
    >
      {/* Profile header — avatar letter + username */}
      <div className="flex items-center gap-3 mb-1">
        <div
          className="flex items-center justify-center w-10 h-10 rounded-full text-base font-bold select-none shrink-0"
          style={{
            background: 'var(--primary)',
            color: 'var(--primary-foreground)',
            fontFamily: 'var(--font-display)',
            boxShadow: 'var(--shadow-glow-sm)',
          }}
          aria-hidden
        >
          {displayName[0].toUpperCase()}
        </div>
        <div className="flex flex-col min-w-0">
          <p
            className="text-base font-bold leading-tight truncate"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}
          >
            @{displayName}
          </p>
          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            {ownedVolumes.length} volume{ownedVolumes.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Search — client-side filtering on the public collection */}
      <SearchBar
        placeholder="Rechercher une série…"
        onChange={setSearch}
        onClear={() => setSearch('')}
      />

      {/* Grid or empty state */}
      {seriesGroups.length === 0 ? (
        <EmptyState
          context={search ? 'search' : 'collection'}
          title={!search ? 'Collection vide' : undefined}
          description={
            !search
              ? `@${displayName} n'a encore rien ajouté à sa collection.`
              : undefined
          }
        />
      ) : (
        <div className="volume-grid">
          {seriesGroups.map(({ series, volumes }, index) => {
            // Cover: first volume with a cover URL, fallback to series cover
            const coverUrl =
              volumes.find(v => v.cover_url)?.cover_url ?? series.cover_url;

            const totalVolumes = sumReleasedTotal(volumes);

            return (
              <SeriesCard
                key={series.id}
                series={series}
                possessedCount={countReleasedOwned(volumes)}
                totalVolumes={totalVolumes}
                href={`/series/${series.id}`}
                coverUrl={coverUrl}
                priority={index < 4}
              />
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
