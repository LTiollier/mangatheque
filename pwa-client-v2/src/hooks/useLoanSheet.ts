import { useState } from 'react';

type LoanItem = { type: 'volume' | 'box'; id: number };

/**
 * Loan bottom sheet state: open/close + items to loan.
 * Centralises state across Edition, BoxSet, Box clients.
 */
export function useLoanSheet() {
  const [isLoanOpen, setIsLoanOpen] = useState(false);
  const [loanItems, setLoanItems] = useState<LoanItem[]>([]);

  function openLoanSheet(items: LoanItem[]) {
    setLoanItems(items);
    setIsLoanOpen(true);
  }

  function closeLoanSheet() {
    setIsLoanOpen(false);
    setLoanItems([]);
  }

  return { isLoanOpen, loanItems, openLoanSheet, closeLoanSheet };
}
