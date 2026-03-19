'use client';

import { Moon, Sun } from 'lucide-react';
import { motion } from 'framer-motion';

import { useTheme, type Theme } from '@/contexts/ThemeContext';
import { tapVariants } from '@/lib/motion';
import { cn } from '@/lib/utils';

// Hoisted — valeurs de design system, ne changent jamais (rendering-hoist-jsx)
const BUTTONS: ReadonlyArray<{
  key: Theme;
  label: string;
  icon: typeof Moon;
  bg: string;
  fg: string;
}> = [
  {
    key: 'void',
    label: 'Void',
    icon: Moon,
    bg: 'oklch(7% 0.008 250)',    /* noir absolu — représente le fond Void */
    fg: 'oklch(94% 0.006 60)',
  },
  {
    key: 'light',
    label: 'Light',
    icon: Sun,
    bg: 'oklch(97% 0.004 80)',    /* blanc chaud — représente le fond Light */
    fg: 'oklch(12% 0.012 250)',
  },
];

interface ThemeSwitcherProps {
  /** Afficher le nom du thème sous chaque bouton */
  showLabels?: boolean;
  className?: string;
}

/**
 * ThemeSwitcher — deux boutons pour basculer entre Void (dark) et Light.
 *
 * - Changement instantané : `setTheme` applique `.theme-X` sur <html>
 *   directement via le store module-level — zéro re-render de l'arbre.
 * - Persistance automatique : ThemeContext écrit en localStorage.
 * - Ring actif : box-shadow double couche (gap --background + --primary)
 *   cohérent avec PaletteSwitcher.
 */
export function ThemeSwitcher({ showLabels = false, className }: ThemeSwitcherProps) {
  const { theme, setTheme } = useTheme();

  return (
    <div
      role="radiogroup"
      aria-label="Thème de l'interface"
      className={cn('flex items-center gap-3', className)}
    >
      {BUTTONS.map(({ key, label, icon: Icon, bg, fg }) => {
        const isActive = theme === key;

        return (
          <div key={key} className="flex flex-col items-center gap-1.5">
            <motion.button
              type="button"
              role="radio"
              aria-checked={isActive}
              aria-label={label}
              variants={tapVariants}
              whileTap="tap"
              onClick={() => setTheme(key)}
              className="w-10 h-10 rounded-[calc(var(--radius)*2)] flex items-center justify-center transition-shadow duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] focus-visible:ring-[var(--ring)]"
              style={{
                background: bg,
                border: `1px solid ${isActive ? 'var(--primary)' : 'var(--border)'}`,
                boxShadow: isActive
                  ? '0 0 0 2px var(--background), 0 0 0 4px var(--primary)'
                  : '0 0 0 2px var(--background), 0 0 0 4px transparent',
                color: fg,
                transform: isActive ? 'scale(1.05)' : 'scale(1)',
                transition: 'box-shadow 150ms ease, transform 150ms ease, border-color 150ms ease',
              }}
            >
              <Icon size={18} aria-hidden />
            </motion.button>

            {showLabels && (
              <span
                className="text-[10px] font-medium leading-none transition-colors duration-150"
                style={{
                  color: isActive ? 'var(--primary)' : 'var(--muted-foreground)',
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
