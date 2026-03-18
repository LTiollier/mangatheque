'use client';

import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

import { statContainerVariants } from '@/lib/motion';

interface StatGridProps {
  children: ReactNode;
}

/**
 * StatGrid — grille 2×2 animée pour les StatCards du dashboard.
 * Spec §6.5 : gap 12px mobile / 16px desktop.
 *
 * Le container motion.div propage le stagger (80ms) à ses enfants StatCard
 * via les variants Framer Motion — les StatCards n'ont pas besoin de
 * `initial/animate` explicites, ils héritent du contexte parent.
 *
 * ⚠️  Cette animation est RÉSERVÉE aux 4 stat cards du dashboard.
 *     Ne pas réutiliser pour les grilles de volumes (règle REDESIGN).
 */
export function StatGrid({ children }: StatGridProps) {
  return (
    <motion.div
      variants={statContainerVariants}
      initial="initial"
      animate="animate"
      className="grid grid-cols-2 gap-3 md:gap-4"
    >
      {children}
    </motion.div>
  );
}
