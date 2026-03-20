'use client';

import { createPortal } from 'react-dom';
import { Loader2, Plus } from 'lucide-react';

interface AddToCollectionBarProps {
  count: number;
  isPending: boolean;
  label: string;
  onConfirm: () => void;
}

// Portal fixed to the bottom — defined outside parent (rerender-no-inline-components)
export function AddToCollectionBar({ count, isPending, label, onConfirm }: AddToCollectionBarProps) {
  if (typeof document === 'undefined' || count === 0) return null;

  return createPortal(
    <div
      className="fixed bottom-0 left-0 right-0 z-50 lg:left-64 px-4 pt-3"
      style={{
        paddingBottom: 'calc(64px + env(safe-area-inset-bottom) + 12px)',
        background: 'var(--background)',
        borderTop: '1px solid var(--border)',
      }}
    >
      <button
        type="button"
        onClick={onConfirm}
        disabled={isPending}
        className="flex items-center justify-center gap-2 w-full h-11 text-sm font-semibold transition-opacity disabled:opacity-40 hover:opacity-90"
        style={{
          background: 'var(--primary)',
          color: 'var(--primary-foreground)',
          borderRadius: 'var(--radius)',
        }}
      >
        {isPending
          ? <Loader2 size={14} className="animate-spin" aria-hidden />
          : <><Plus size={14} aria-hidden />{label}</>}
      </button>
    </div>,
    document.body,
  );
}
