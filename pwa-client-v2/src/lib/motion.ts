/**
 * Variants Framer Motion — Atsume Void
 *
 * RÈGLE : animations avec parcimonie.
 * ❌ Pas de stagger sur les grilles de volumes au mount (lag sur 50+ items)
 * ❌ Pas d'animation sur chaque ligne de liste
 * ❌ Pas de transition skeleton→contenu (fade simple max)
 * ✅ Transitions de page, bottom sheet, blocs dashboard, feedback actions
 */

import type { Variants } from 'framer-motion';

/* -------------------------------------------------- */
/* Transitions de page                                */
/* -------------------------------------------------- */
export const pageVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2, ease: 'easeOut' } },
  exit:    { opacity: 0, transition: { duration: 0.15, ease: 'easeIn' } },
};

/* -------------------------------------------------- */
/* Blocs de section (dashboard, première apparition)  */
/* -------------------------------------------------- */
export const sectionVariants: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};

/* -------------------------------------------------- */
/* Stat cards — stagger 80ms                          */
/* UNIQUEMENT sur les 4 cards dashboard, jamais grille */
/* -------------------------------------------------- */
export const statContainerVariants: Variants = {
  initial: {},
  animate: { transition: { staggerChildren: 0.08 } },
};

export const statCardVariants: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};

/* -------------------------------------------------- */
/* Bottom sheet — slide depuis le bas                 */
/* -------------------------------------------------- */
export const bottomSheetVariants: Variants = {
  initial: { y: '100%' },
  animate: {
    y: 0,
    transition: { type: 'spring', stiffness: 400, damping: 40 },
  },
  exit: {
    y: '100%',
    transition: { duration: 0.2, ease: 'easeIn' },
  },
};

export const bottomSheetOverlayVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2, ease: 'easeOut' } },
  exit:    { opacity: 0, transition: { duration: 0.15, ease: 'easeIn' } },
};

/* -------------------------------------------------- */
/* Feedback action utilisateur (tap bouton)           */
/* -------------------------------------------------- */
export const tapVariants = {
  tap: { scale: 0.92, transition: { duration: 0.1, ease: 'easeOut' as const } },
};

/* -------------------------------------------------- */
/* Apparition d'un élément unique (modal, panel)      */
/* -------------------------------------------------- */
export const fadeInVariants: Variants = {
  initial: { opacity: 0, scale: 0.97 },
  animate: { opacity: 1, scale: 1,  transition: { duration: 0.2, ease: 'easeOut' } },
  exit:    { opacity: 0, scale: 0.97, transition: { duration: 0.15, ease: 'easeIn' } },
};

/* -------------------------------------------------- */
/* Transition de tab (changement d'onglet Collection) */
/* -------------------------------------------------- */
export const tabContentVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.15, ease: 'easeOut' } },
  exit:    { opacity: 0, transition: { duration: 0.1,  ease: 'easeIn' } },
};

/* -------------------------------------------------- */
/* Transition de vue (Couverture ↔ Liste)             */
/* -------------------------------------------------- */
export const viewTransitionVariants: Variants = {
  initial: { opacity: 0, y: 4 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.15, ease: 'easeOut' } },
  exit:    { opacity: 0,       transition: { duration: 0.1,  ease: 'easeIn'  } },
};
