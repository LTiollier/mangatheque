'use client';

import { type ReactNode } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

import { sectionVariants } from '@/lib/motion';

// Shared skeleton — hoisted at module level (rendering-hoist-jsx)
export const headerSkeleton = (
  <div className="flex gap-4" aria-busy aria-hidden>
    <div
      className="skeleton shrink-0 w-20 rounded-[calc(var(--radius)*2)]"
      style={{ aspectRatio: '2/3' }}
    />
    <div className="flex flex-col gap-2 pt-1 flex-1">
      <div className="skeleton h-5 w-2/3 rounded" />
      <div className="skeleton h-4 w-1/3 rounded" />
      <div className="skeleton h-[3px] w-full rounded-full mt-2" />
      <div className="skeleton h-3 w-1/4 rounded" />
    </div>
  </div>
);

// Shared grid skeleton — identical for Edition, Box, BoxSet (rendering-hoist-jsx)
export const gridSkeleton = (
  <div className="volume-grid" aria-busy aria-hidden>
    {Array.from({ length: 12 }, (_, i) => (
      <div key={i} className="volume-card skeleton" aria-hidden />
    ))}
  </div>
);

interface ProgressInfo {
  /** 0–100, drives the progress bar width */
  value: number;
  /** Full display text below the bar, e.g. "3 / 10 vol. possédés" */
  label: string;
  /** aria-label on the progressbar element */
  ariaLabel: string;
}

interface DetailHeaderProps {
  isLoading: boolean;
  coverUrl: string | null | undefined;
  title: string;
  subtitle?: string | null;
  progress?: ProgressInfo | null;
  fallbackIcon: ReactNode;
}

export function DetailHeader({
  isLoading,
  coverUrl,
  title,
  subtitle,
  progress,
  fallbackIcon,
}: DetailHeaderProps) {
  if (isLoading) return headerSkeleton;

  return (
    <motion.div
      className="flex gap-4"
      variants={sectionVariants}
      initial="initial"
      animate="animate"
    >
      <div
        className="shrink-0 w-20 relative overflow-hidden rounded-[calc(var(--radius)*2)]"
        style={{ aspectRatio: '2/3', background: 'var(--muted)' }}
      >
        {coverUrl ? (
          <Image src={coverUrl} alt={title} fill sizes="80px" className="object-cover" priority />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            {fallbackIcon}
          </div>
        )}
      </div>

      <div className="flex flex-col justify-center gap-1.5 min-w-0 flex-1">
        <h1
          className="text-xl font-bold leading-tight"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            {subtitle}
          </p>
        )}
        {progress && (
          <>
            <div
              className="volume-progress"
              role="progressbar"
              aria-valuenow={progress.value}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={progress.ariaLabel}
            >
              <div className="volume-progress__fill" style={{ width: `${progress.value}%` }} />
            </div>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              {progress.label}
            </p>
          </>
        )}
      </div>
    </motion.div>
  );
}
