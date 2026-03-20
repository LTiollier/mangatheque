'use client';

import { BottomSheet } from '@/components/feedback/BottomSheet';

interface LoanSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  question: string;
  borrowerName: string;
  onBorrowerNameChange: (v: string) => void;
  onConfirm: () => void;
  isPending: boolean;
}

export function LoanSheet({
  open,
  onClose,
  title,
  question,
  borrowerName,
  onBorrowerNameChange,
  onConfirm,
  isPending,
}: LoanSheetProps) {
  return (
    <BottomSheet open={open} onClose={onClose} title={title}>
      <div className="flex flex-col gap-4 pt-2">
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          {question}
        </p>
        <input
          type="text"
          value={borrowerName}
          onChange={e => onBorrowerNameChange(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') onConfirm(); }}
          placeholder="Nom de l'emprunteur"
          autoFocus
          className="w-full h-11 px-3 text-sm outline-none"
          style={{
            background: 'var(--input)',
            border: '1px solid var(--border)',
            color: 'var(--foreground)',
            borderRadius: 'var(--radius)',
          }}
        />
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-10 text-sm font-medium transition-opacity hover:opacity-80"
            style={{
              background: 'var(--secondary)',
              color: 'var(--foreground)',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--border)',
            }}
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!borrowerName.trim() || isPending}
            className="flex-1 h-10 text-sm font-semibold transition-opacity disabled:opacity-50 hover:opacity-80"
            style={{
              background: 'var(--primary)',
              color: 'var(--primary-foreground)',
              borderRadius: 'var(--radius)',
            }}
          >
            {isPending ? 'Enregistrement…' : 'Confirmer'}
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
