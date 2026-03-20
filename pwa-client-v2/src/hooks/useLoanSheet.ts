import { useState } from 'react';

/**
 * Loan bottom sheet state: open/close + borrower name.
 * Centralises the 3 identical useState pairs across Edition, BoxSet, Box clients.
 */
export function useLoanSheet() {
  const [isLoanOpen, setIsLoanOpen] = useState(false);
  const [borrowerName, setBorrowerName] = useState('');

  function openLoanSheet() {
    setIsLoanOpen(true);
  }

  function closeLoanSheet() {
    setIsLoanOpen(false);
    setBorrowerName('');
  }

  return { isLoanOpen, borrowerName, setBorrowerName, openLoanSheet, closeLoanSheet };
}
