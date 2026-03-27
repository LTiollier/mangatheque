'use client';

import { BottomSheet } from '@/components/feedback/BottomSheet';
import { LoanForm } from '@/components/forms/LoanForm';

interface LoanSheetProps {
  items: { type: 'volume' | 'box'; id: number }[];
  open: boolean;
  onClose: () => void;
}

export function LoanSheet({ items, open, onClose }: LoanSheetProps) {
  const count = items.length;
  const title = count === 1 ? 'Prêter 1 élément' : `Prêter ${count} éléments`;

  return (
    <BottomSheet open={open} onClose={onClose} title={title}>
      <div className="pt-2">
        <LoanForm items={items} onSuccess={onClose} />
      </div>
    </BottomSheet>
  );
}
