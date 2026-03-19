'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  Search,
  Package,
  Plus,
  Heart,
  Loader2,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  SearchX,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

import { useSearchQuery, useAddToCollection, useAddToWishlistByApiId } from '@/hooks/queries';
import { sectionVariants } from '@/lib/motion';
import { getApiErrorMessage } from '@/lib/error';
import type { MangaSearchResult } from '@/types/manga';

// ─── Pure helper — build page number items for pagination ─────────────────────
// (js-early-exit: bail out for small ranges)

function buildPageItems(current: number, last: number): (number | '…')[] {
  if (last <= 7) return Array.from({ length: last }, (_, i) => i + 1);

  const keep = new Set(
    [1, last, current - 1, current, current + 1].filter(p => p >= 1 && p <= last),
  );
  const sorted = Array.from(keep).sort((a, b) => a - b);

  const items: (number | '…')[] = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) items.push('…');
    items.push(sorted[i]);
  }
  return items;
}

// ─── Hoisted static JSX (rendering-hoist-jsx) ─────────────────────────────────

const coverFallback = (
  <div className="absolute inset-0 flex items-center justify-center">
    <Package size={28} aria-hidden style={{ color: 'var(--muted-foreground)' }} />
  </div>
);

// ─── SearchResultCard — defined at module level (rerender-no-inline-components) ─

interface SearchResultCardProps {
  result: MangaSearchResult;
  isInCollection: boolean;
  isAdding: boolean;
  isWishlisted: boolean;
  isWishlisting: boolean;
  onAdd: (apiId: string) => void;
  onWishlist: (apiId: string) => void;
}

function SearchResultCard({ result, isInCollection, isAdding, isWishlisted, isWishlisting, onAdd, onWishlist }: SearchResultCardProps) {
  return (
    <div className="flex flex-col gap-2">
      {/* Cover — 2:3 ratio, manga-card CSS class */}
      <div className="manga-card" style={{ cursor: 'default' }}>
        {result.cover_url ? (
          <Image
            src={result.cover_url}
            alt={result.title}
            fill
            sizes="(max-width: 480px) 50vw, (max-width: 768px) 33vw, 25vw"
            className="object-cover"
          />
        ) : (
          coverFallback
        )}

        {/* In-collection badge — top right */}
        {isInCollection && (
          <div
            className="absolute top-1.5 right-1.5 flex items-center justify-center w-[22px] h-[22px] rounded"
            style={{ background: 'var(--color-read)' }}
            aria-label="En collection"
          >
            <CheckCircle size={13} style={{ color: 'var(--background)' }} aria-hidden />
          </div>
        )}

        {/* Wishlist button — top right (si pas en collection) */}
        {!isInCollection && result.api_id && (
          <button
            type="button"
            onClick={() => onWishlist(result.api_id!)}
            disabled={isWishlisting}
            className="absolute top-1.5 right-1.5 z-10 flex items-center justify-center w-8 h-8 rounded-full transition-opacity disabled:opacity-50 hover:opacity-80"
            style={{
              background: 'color-mix(in oklch, var(--background) 60%, transparent)',
              backdropFilter: 'blur(4px)',
            }}
            aria-label={isWishlisted ? 'En wishlist' : 'Ajouter à la wishlist'}
          >
            <Heart
              size={14}
              fill={isWishlisted ? 'var(--color-wishlist)' : 'none'}
              style={{ color: isWishlisted ? 'var(--color-wishlist)' : 'var(--muted-foreground)' }}
              aria-hidden
            />
          </button>
        )}
      </div>

      {/* Title + author */}
      <div className="flex flex-col gap-1 px-0.5">
        <p
          className="text-sm font-semibold leading-tight line-clamp-2"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}
        >
          {result.title}
        </p>
        {result.authors && result.authors.length > 0 && (
          <p
            className="text-xs leading-tight truncate"
            style={{ color: 'var(--muted-foreground)' }}
          >
            {result.authors[0]}
          </p>
        )}
      </div>

      {/* Action — explicit button (design decision: pas de hover actions) */}
      {isInCollection ? (
        <p
          className="text-xs font-medium px-0.5 flex items-center gap-1"
          style={{ color: 'var(--color-read)' }}
        >
          <CheckCircle size={11} aria-hidden />
          En collection
        </p>
      ) : result.api_id ? (
        <button
          type="button"
          onClick={() => onAdd(result.api_id!)}
          disabled={isAdding}
          className="flex items-center justify-center gap-1.5 w-full h-8 text-xs font-semibold transition-opacity disabled:opacity-50 hover:opacity-80"
          style={{
            background: 'var(--primary)',
            color: 'var(--primary-foreground)',
            borderRadius: 'var(--radius)',
          }}
        >
          {isAdding ? (
            <Loader2 size={12} className="animate-spin" aria-hidden />
          ) : (
            <Plus size={12} aria-hidden />
          )}
          {isAdding ? 'Ajout…' : 'Ajouter'}
        </button>
      ) : null}
    </div>
  );
}

// ─── Skeleton grid — hoisted (rendering-hoist-jsx) ────────────────────────────

const gridSkeleton = (
  <div
    className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4"
    aria-busy
    aria-hidden
  >
    {Array.from({ length: 8 }, (_, i) => (
      <div key={i} className="flex flex-col gap-2">
        <div
          className="skeleton rounded-[calc(var(--radius)*2)] w-full"
          style={{ aspectRatio: '2/3' }}
        />
        <div className="skeleton h-3.5 w-3/4 rounded" />
        <div className="skeleton h-3 w-1/2 rounded" />
        <div className="skeleton h-7 w-full rounded" />
      </div>
    ))}
  </div>
);

// ─── SearchClient ─────────────────────────────────────────────────────────────

export function SearchClient() {
  const [inputValue, setInputValue] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [page, setPage] = useState(1);

  // startTransition for page navigation — non-urgent update (rerender-transitions)
  const [isPaginating, startTransition] = useTransition();

  // Track optimistically added items — O(1) Set lookup (js-set-map-lookups)
  const [addedApiIds, setAddedApiIds] = useState<ReadonlySet<string>>(() => new Set());
  const [pendingApiId, setPendingApiId] = useState<string | null>(null);

  // Track wishlisted items locally — add-only in search context
  const [wishlistedApiIds, setWishlistedApiIds] = useState<ReadonlySet<string>>(() => new Set());
  const [pendingWishlistApiId, setPendingWishlistApiId] = useState<string | null>(null);

  const addToCollection = useAddToCollection();
  const addToWishlist = useAddToWishlistByApiId();

  // keepPreviousData: old page stays visible while fetching next (client-swr-dedup)
  const { data, isLoading, isFetching, isError } = useSearchQuery(submittedQuery, page);

  // Derived during render — no useEffect (rerender-derived-state-no-effect)
  const results = data?.data ?? [];
  const meta = data?.meta;
  const hasSearched = submittedQuery.length > 0;
  const showLoading = isLoading || (isPaginating && isFetching);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = inputValue.trim();
    if (!q || q === submittedQuery) return;
    setSubmittedQuery(q);
    setPage(1);
  }

  function handlePageChange(newPage: number) {
    // Non-urgent: current results stay visible during transition (rerender-transitions)
    startTransition(() => setPage(newPage));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleAdd(apiId: string) {
    setPendingApiId(apiId);
    addToCollection.mutate(apiId, {
      onSuccess: () => {
        setAddedApiIds(prev => new Set([...prev, apiId]));
        toast.success('Ajouté à la collection');
        setPendingApiId(null);
      },
      onError: (err) => {
        toast.error(getApiErrorMessage(err, "Impossible d'ajouter le manga."));
        setPendingApiId(null);
      },
    });
  }

  function handleWishlist(apiId: string) {
    setPendingWishlistApiId(apiId);
    addToWishlist.mutate(apiId, {
      onSuccess: () => {
        setWishlistedApiIds(prev => new Set([...prev, apiId]));
        setPendingWishlistApiId(null);
      },
      onError: () => {
        setPendingWishlistApiId(null);
      },
    });
  }

  const pageItems = meta ? buildPageItems(meta.current_page, meta.last_page) : [];

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <h1
        className="text-2xl font-bold"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}
      >
        Recherche
      </h1>

      {/* Search form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden
            style={{ color: 'var(--muted-foreground)' }}
          />
          <input
            type="search"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            placeholder="Titre, auteur, ISBN…"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            className="w-full h-10 pl-9 pr-3 text-sm [&::-webkit-search-cancel-button]:hidden focus-visible:outline-none"
            style={{
              background: 'var(--input)',
              color: 'var(--foreground)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
            }}
            aria-label="Rechercher des mangas"
          />
        </div>
        <button
          type="submit"
          disabled={!inputValue.trim() || isLoading}
          className="h-10 px-4 text-sm font-semibold shrink-0 transition-opacity disabled:opacity-40 hover:opacity-90"
          style={{
            background: 'var(--primary)',
            color: 'var(--primary-foreground)',
            borderRadius: 'var(--radius)',
          }}
        >
          {isLoading && !isPaginating ? (
            <Loader2 size={14} className="animate-spin" aria-hidden />
          ) : (
            'Rechercher'
          )}
        </button>
      </form>

      {/* Results */}
      {showLoading ? (
        gridSkeleton
      ) : isError ? (
        <motion.div
          variants={sectionVariants}
          initial="initial"
          animate="animate"
          className="flex flex-col items-center gap-3 py-16 text-center"
        >
          <AlertCircle size={36} aria-hidden style={{ color: 'var(--destructive)' }} />
          <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
            Une erreur est survenue. Réessayez.
          </p>
        </motion.div>
      ) : results.length > 0 ? (
        <motion.section
          variants={sectionVariants}
          initial="initial"
          animate="animate"
          aria-label="Résultats de recherche"
        >
          {/* Results meta */}
          {meta && (
            <p
              className="text-xs mb-4"
              style={{ color: 'var(--muted-foreground)' }}
            >
              {meta.total} résultat{meta.total > 1 ? 's' : ''} — page {meta.current_page} / {meta.last_page}
            </p>
          )}

          {/* Grid — no per-card mount animation (design rule: no stagger on grids) */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4">
            {results.map(result => (
              <SearchResultCard
                key={result.api_id ?? result.id}
                result={result}
                isInCollection={result.id !== null || addedApiIds.has(result.api_id ?? '')}
                isAdding={pendingApiId === result.api_id}
                isWishlisted={wishlistedApiIds.has(result.api_id ?? '')}
                isWishlisting={pendingWishlistApiId === result.api_id}
                onAdd={handleAdd}
                onWishlist={handleWishlist}
              />
            ))}
          </div>

          {/* Pagination */}
          {meta && meta.last_page > 1 && (
            <div className="flex items-center justify-center gap-1.5 mt-8">
              {/* Prev */}
              <button
                type="button"
                onClick={() => handlePageChange(meta.current_page - 1)}
                disabled={meta.current_page === 1 || isFetching}
                className="flex items-center justify-center w-8 h-8 rounded transition-opacity disabled:opacity-30 hover:opacity-70"
                style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
                aria-label="Page précédente"
              >
                <ChevronLeft size={14} aria-hidden />
              </button>

              {/* Page numbers */}
              {pageItems.map((item, idx) =>
                item === '…' ? (
                  <span
                    key={`ellipsis-${idx}`}
                    className="w-8 h-8 flex items-center justify-center text-xs"
                    style={{ color: 'var(--muted-foreground)' }}
                  >
                    …
                  </span>
                ) : (
                  <button
                    key={item}
                    type="button"
                    onClick={() => handlePageChange(item)}
                    disabled={isFetching}
                    className="w-8 h-8 rounded text-xs font-semibold transition-opacity disabled:opacity-60 hover:opacity-80"
                    style={
                      item === meta.current_page
                        ? { background: 'var(--primary)', color: 'var(--primary-foreground)' }
                        : {
                            background: 'var(--card)',
                            color: 'var(--foreground)',
                            border: '1px solid var(--border)',
                          }
                    }
                    aria-current={item === meta.current_page ? 'page' : undefined}
                  >
                    {item}
                  </button>
                ),
              )}

              {/* Next */}
              <button
                type="button"
                onClick={() => handlePageChange(meta.current_page + 1)}
                disabled={meta.current_page === meta.last_page || isFetching}
                className="flex items-center justify-center w-8 h-8 rounded transition-opacity disabled:opacity-30 hover:opacity-70"
                style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
                aria-label="Page suivante"
              >
                <ChevronRight size={14} aria-hidden />
              </button>
            </div>
          )}
        </motion.section>
      ) : hasSearched ? (
        /* No results — already searched */
        <motion.div
          variants={sectionVariants}
          initial="initial"
          animate="animate"
          className="flex flex-col items-center gap-3 py-16 text-center"
        >
          <div
            className="flex items-center justify-center w-16 h-16 rounded-full"
            style={{ background: 'var(--muted)' }}
          >
            <SearchX size={28} aria-hidden style={{ color: 'var(--muted-foreground)' }} />
          </div>
          <p
            className="text-sm font-medium"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}
          >
            Aucun résultat pour « {submittedQuery} »
          </p>
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            Essayez un autre titre ou vérifiez l&apos;ISBN.
          </p>
        </motion.div>
      ) : (
        /* Initial state — nothing searched yet */
        <motion.div
          variants={sectionVariants}
          initial="initial"
          animate="animate"
          className="flex flex-col items-center gap-3 py-16 text-center"
        >
          <div
            className="flex items-center justify-center w-16 h-16 rounded-full"
            style={{ background: 'var(--muted)' }}
          >
            <Search size={28} aria-hidden style={{ color: 'var(--muted-foreground)' }} />
          </div>
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            Recherchez par titre, auteur ou ISBN pour trouver des mangas à ajouter à votre collection.
          </p>
        </motion.div>
      )}
    </div>
  );
}
