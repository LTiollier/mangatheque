'use client';

/**
 * PaletteContext — Atsume Void
 *
 * Gère la palette de couleurs active parmi les 4 options :
 * crimson (défaut) · ember · indigo · forest
 *
 * Implémentation hydration-safe via useSyncExternalStore :
 * - getServerSnapshot() retourne toujours 'crimson'
 * - getSnapshot() lit l'état en mémoire (initialisé depuis localStorage côté client)
 * - La classe .palette-X est appliquée sur <html> — jamais via un état React
 *   pour éviter le flash ou un re-render de l'arbre complet.
 */

import {
  createContext,
  useContext,
  useCallback,
  useSyncExternalStore,
  type ReactNode,
} from 'react';

/* -------------------------------------------------- */
/* Types                                              */
/* -------------------------------------------------- */

export type Palette = 'ember' | 'crimson' | 'indigo' | 'forest';

export interface PaletteContextValue {
  palette: Palette;
  setPalette: (palette: Palette) => void;
  palettes: readonly Palette[];
}

/* -------------------------------------------------- */
/* Constantes                                         */
/* -------------------------------------------------- */

const STORAGE_KEY = 'atsume-palette:v1';
const DEFAULT_PALETTE: Palette = 'crimson';
export const PALETTES: readonly Palette[] = [
  'crimson',
  'ember',
  'indigo',
  'forest',
] as const;

/* -------------------------------------------------- */
/* External store (singleton module-level)            */
/* Survit aux re-renders, partagé entre providers.    */
/* -------------------------------------------------- */

let _listeners: Array<() => void> = [];
let _current: Palette = DEFAULT_PALETTE;

function _applyClass(palette: Palette): void {
  if (typeof document === 'undefined') return;
  const html = document.documentElement;
  PALETTES.forEach((p) => html.classList.remove(`palette-${p}`));
  html.classList.add(`palette-${palette}`);
}

function _store_subscribe(cb: () => void): () => void {
  _listeners.push(cb);
  return () => {
    _listeners = _listeners.filter((l) => l !== cb);
  };
}

function _store_getSnapshot(): Palette {
  return _current;
}

function _store_getServerSnapshot(): Palette {
  return DEFAULT_PALETTE;
}

function _store_set(palette: Palette): void {
  if (!PALETTES.includes(palette)) return;
  _current = palette;
  _applyClass(palette);
  try {
    localStorage.setItem(STORAGE_KEY, palette);
  } catch {
    /* localStorage peut être indisponible (private mode strict) */
  }
  _listeners.forEach((l) => l());
}

/**
 * Seed the palette from the authenticated user's server-side preference.
 * Call this after login or on app init when the User object is available.
 * Takes priority over localStorage — writes back to localStorage for consistency.
 */
export function seedPaletteFromUser(palette: string): void {
  if ((PALETTES as readonly string[]).includes(palette)) {
    _store_set(palette as Palette);
  }
}

/* Initialisation côté client — lecture localStorage + application de la classe */
if (typeof window !== 'undefined') {
  try {
    const stored = localStorage.getItem(STORAGE_KEY) as Palette | null;
    const initial =
      stored && (PALETTES as readonly string[]).includes(stored)
        ? (stored as Palette)
        : DEFAULT_PALETTE;
    _current = initial;
    _applyClass(initial);
  } catch {
    _applyClass(DEFAULT_PALETTE);
  }
}

/* -------------------------------------------------- */
/* Context                                            */
/* -------------------------------------------------- */

const PaletteContext = createContext<PaletteContextValue | null>(null);

/* -------------------------------------------------- */
/* Provider                                           */
/* -------------------------------------------------- */

export function PaletteProvider({ children }: { children: ReactNode }) {
  const palette = useSyncExternalStore(
    _store_subscribe,
    _store_getSnapshot,
    _store_getServerSnapshot,
  );

  const handleSet = useCallback((p: Palette) => {
    _store_set(p);
  }, []);

  return (
    <PaletteContext.Provider
      value={{ palette, setPalette: handleSet, palettes: PALETTES }}
    >
      {children}
    </PaletteContext.Provider>
  );
}

/* -------------------------------------------------- */
/* Hook consommateur                                  */
/* -------------------------------------------------- */

export function usePalette(): PaletteContextValue {
  const ctx = useContext(PaletteContext);
  if (!ctx) {
    throw new Error('usePalette() must be used within <PaletteProvider>');
  }
  return ctx;
}
