'use client';

import { motion } from 'framer-motion';

import { usePalette, type Palette } from '@/contexts/PaletteContext';
import { tapVariants } from '@/lib/motion';
import { cn } from '@/lib/utils';

// Hoisted — valeurs de design system, ne changent jamais (rendering-hoist-jsx)
// Les couleurs correspondent exactement aux tokens globals.css de chaque palette.
const SWATCHES: ReadonlyArray<{ key: Palette; label: string; color: string }> = [
  { key: 'crimson', label: 'Crimson', color: 'oklch(62% 0.24 18)'  },
  { key: 'ember',   label: 'Ember',   color: 'oklch(72% 0.24 55)'  },
  { key: 'indigo',  label: 'Indigo',  color: 'oklch(65% 0.26 290)' },
  { key: 'forest',  label: 'Forest',  color: 'oklch(62% 0.22 155)' },
];

interface PaletteSwitcherProps {
  /** Afficher le nom de la palette sous chaque swatch */
  showLabels?: boolean;
  className?: string;
  /** Called after the palette is applied — use to persist to the backend */
  onSelect?: (palette: Palette) => void;
}

/**
 * PaletteSwitcher — 4 swatches circulaires pour changer la palette active.
 *
 * - Changement instantané : `setPalette` applique `.palette-X` sur <html>
 *   directement via le store module-level — zéro re-render de l'arbre.
 * - Persistance automatique : PaletteContext écrit en localStorage.
 * - Ring actif : box-shadow double couche (gap --background + couleur palette)
 *   pour un rendu propre sur tout fond sombre.
 *
 * Pattern `rerender-derived-state` : `isActive` est dérivé de `palette === key`
 * pendant le render — pas de state local.
 * Pattern `rerender-move-effect-to-event` : `setPalette` appelé dans le handler.
 */
export function PaletteSwitcher({ showLabels = false, className, onSelect }: PaletteSwitcherProps) {
  // usePalette() ne re-rend que quand `palette` change — setPalette est stable (useCallback)
  const { palette, setPalette } = usePalette();

  return (
    <div
      role="radiogroup"
      aria-label="Palette de couleurs"
      className={cn('flex items-center gap-3', className)}
    >
      {SWATCHES.map(({ key, label, color }) => {
        const isActive = palette === key;

        return (
          <div key={key} className="flex flex-col items-center gap-1.5">
            <motion.button
              type="button"
              role="radio"
              aria-checked={isActive}
              aria-label={label}
              variants={tapVariants}
              whileTap="tap"
              onClick={() => { setPalette(key); onSelect?.(key); }}
              className="w-8 h-8 rounded-full transition-shadow duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
              style={{
                background: color,
                // Ring double : gap fond + anneau palette (spec ring actif)
                boxShadow: isActive
                  ? `0 0 0 2px var(--background), 0 0 0 4px ${color}`
                  : '0 0 0 2px var(--background), 0 0 0 4px transparent',
                // Légère élévation sur la swatch active
                transform: isActive ? 'scale(1.1)' : 'scale(1)',
                transition: 'box-shadow 150ms ease, transform 150ms ease',
                // focus-visible ring en couleur palette (js-batch-dom-css via CSS var)
                '--tw-ring-color': color,
              } as React.CSSProperties}
            />

            {showLabels && (
              <span
                className="text-[10px] font-medium leading-none transition-colors duration-150"
                style={{
                  color: isActive ? color : 'var(--muted-foreground)',
                  fontFamily: 'var(--font-body)',
                }}
              >
                {label}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
