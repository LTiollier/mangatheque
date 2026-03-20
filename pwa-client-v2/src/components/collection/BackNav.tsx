'use client';

import { ChevronLeft } from 'lucide-react';

interface BackNavProps {
  onClick: () => void;
  label: string;
}

export function BackNav({ onClick, label }: BackNavProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1 text-sm transition-opacity hover:opacity-70 w-fit -ml-0.5"
      style={{ color: 'var(--muted-foreground)' }}
      aria-label={`Retour — ${label}`}
    >
      <ChevronLeft size={16} aria-hidden />
      {label}
    </button>
  );
}
