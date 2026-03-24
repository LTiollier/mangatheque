import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Hoisted at module level — not re-created on every call (js-cache-function-results)
const shortDateFormatter = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' });

export function isFutureDate(dateStr: string | null): boolean {
  if (!dateStr) { return false; }
  return new Date(dateStr) > new Date();
}

export function formatShortDate(dateStr: string): string {
  return shortDateFormatter.format(new Date(dateStr));
}
