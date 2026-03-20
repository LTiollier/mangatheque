import { useState } from 'react';

interface SelectableItem {
  id: number;
}

/**
 * Generic multiselect over owned items.
 * Functional setState keeps callbacks referentially stable against stale closures.
 * (rerender-functional-setstate)
 */
export function useMultiselect<T extends SelectableItem>(ownedItems: T[]) {
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<number>>(() => new Set());

  function handleToggle(item: T) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(item.id)) next.delete(item.id); else next.add(item.id);
      return next;
    });
  }

  function handleSelectAll() {
    setSelectedIds(new Set(ownedItems.map(i => i.id)));
  }

  function selectMany(items: T[]) {
    setSelectedIds(new Set(items.map(i => i.id)));
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  return { selectedIds, handleToggle, handleSelectAll, selectMany, clearSelection };
}
