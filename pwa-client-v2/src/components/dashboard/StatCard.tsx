'use client';

import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

import { statCardVariants } from '@/lib/motion';

interface StatCardProps {
  icon: LucideIcon;
  value: number | string;
  label: string;
  /**
   * Variante highlight (ex: volumes possédés) :
   * fond --primary 10% · valeur en --primary · icône en --primary
   */
  highlight?: boolean;
}

/**
 * StatCard — carte de statistique dashboard.
 * Spec rapport.md §6.5.
 *
 * Doit être enfant direct de <StatGrid> pour que le stagger fonctionne.
 * Les variants sont propagés par Framer Motion via le contexte parent.
 *
 * Pattern `rerender-no-inline-components` : StatCard est défini à part
 * de StatGrid — pas de composant inline dans le map().
 * Pattern `rendering-hoist-jsx` : valeur formatée calculée hors du JSX,
 * pas d'appel inline dans le rendu.
 */
export function StatCard({ icon: Icon, value, label, highlight = false }: StatCardProps) {
  // Formatage numérique séparé du JSX (js-cache-property-access spirit)
  const displayValue =
    typeof value === 'number' ? value.toLocaleString('fr-FR') : value;

  const iconColor = highlight ? 'var(--primary)' : 'var(--muted-foreground)';
  const valueColor = highlight ? 'var(--primary)' : 'var(--foreground)';

  return (
    <motion.div
      variants={statCardVariants}
      className="flex flex-col gap-3 p-4 rounded-[calc(var(--radius)*2)]"
      style={{
        background: highlight
          ? 'color-mix(in oklch, var(--primary) 10%, var(--card))'
          : 'var(--card)',
        boxShadow: highlight ? 'var(--shadow-glow-sm)' : 'var(--shadow-xs)',
      }}
    >
      {/* Ligne du haut : icône gauche + valeur droite */}
      <div className="flex items-center justify-between">
        <Icon size={20} style={{ color: iconColor }} aria-hidden />
        <span
          className="font-bold leading-none tabular-nums"
          style={{
            fontSize: 32,
            color: valueColor,
            fontFamily: 'var(--font-display)',
          }}
        >
          {displayValue}
        </span>
      </div>

      {/* Label */}
      <span
        className="text-[13px] leading-none"
        style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-body)' }}
      >
        {label}
      </span>
    </motion.div>
  );
}
