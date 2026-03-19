'use client';

/**
 * ThemeContext — Mangastore Void/Light
 *
 * Gère le thème de surface actif : 'void' (dark) ou 'light'.
 * Indépendant de la palette — les 8 combinaisons thème × palette sont valides.
 *
 * Implémentation hydration-safe via useSyncExternalStore :
 * - getServerSnapshot() retourne toujours 'void'
 * - getSnapshot() lit l'état en mémoire (initialisé depuis localStorage côté client)
 * - La classe .theme-X est appliquée sur <html> — jamais via un état React
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

export type Theme = 'void' | 'light';

export interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  themes: readonly Theme[];
}

/* -------------------------------------------------- */
/* Constantes                                         */
/* -------------------------------------------------- */

const STORAGE_KEY = 'mangastore-theme:v1';
const DEFAULT_THEME: Theme = 'void';
export const THEMES: readonly Theme[] = ['void', 'light'] as const;

/* -------------------------------------------------- */
/* External store (singleton module-level)            */
/* Survit aux re-renders, partagé entre providers.    */
/* -------------------------------------------------- */

let _listeners: Array<() => void> = [];
let _current: Theme = DEFAULT_THEME;

function _applyClass(theme: Theme): void {
  if (typeof document === 'undefined') return;
  const html = document.documentElement;
  THEMES.forEach((t) => html.classList.remove(`theme-${t}`));
  html.classList.add(`theme-${theme}`);
}

function _store_subscribe(cb: () => void): () => void {
  _listeners.push(cb);
  return () => {
    _listeners = _listeners.filter((l) => l !== cb);
  };
}

function _store_getSnapshot(): Theme {
  return _current;
}

function _store_getServerSnapshot(): Theme {
  return DEFAULT_THEME;
}

function _store_set(theme: Theme): void {
  if (!THEMES.includes(theme)) return;
  _current = theme;
  _applyClass(theme);
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    /* localStorage peut être indisponible (private mode strict) */
  }
  _listeners.forEach((l) => l());
}

/* Initialisation côté client — lecture localStorage + application de la classe */
if (typeof window !== 'undefined') {
  try {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    const initial =
      stored && (THEMES as readonly string[]).includes(stored)
        ? (stored as Theme)
        : DEFAULT_THEME;
    _current = initial;
    _applyClass(initial);
  } catch {
    _applyClass(DEFAULT_THEME);
  }
}

/* -------------------------------------------------- */
/* Context                                            */
/* -------------------------------------------------- */

const ThemeContext = createContext<ThemeContextValue | null>(null);

/* -------------------------------------------------- */
/* Provider                                           */
/* -------------------------------------------------- */

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(
    _store_subscribe,
    _store_getSnapshot,
    _store_getServerSnapshot,
  );

  const handleSet = useCallback((t: Theme) => {
    _store_set(t);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme: handleSet, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

/* -------------------------------------------------- */
/* Hook consommateur                                  */
/* -------------------------------------------------- */

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme() must be used within <ThemeProvider>');
  }
  return ctx;
}
