'use client';

/**
 * ViewModeContext — Vue Couverture / Vue Liste
 *
 * Gère la préférence d'affichage par breakpoint (mobile < 1024px / desktop ≥ 1024px).
 * Pattern identique à ThemeContext / PaletteContext :
 * - useSyncExternalStore → hydration-safe, pas de flash (rendering-hydration-no-flicker)
 * - Stores module-level séparés → pas de re-render croisé (rerender-split-combined-hooks)
 * - Lecture localStorage une seule fois à l'init (advanced-init-once / js-cache-storage)
 */

import {
  createContext,
  useCallback,
  useContext,
  useSyncExternalStore,
  type ReactNode,
} from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ViewMode = 'cover' | 'list';

const VIEW_MODES: readonly ViewMode[] = ['cover', 'list'] as const;
const DEFAULT: ViewMode = 'cover';

// ─── Clés versionnées — données minimales, pas de PII (client-localstorage-schema)

const STORAGE_KEY_MOBILE  = 'atsume-view-mobile:v1';
const STORAGE_KEY_DESKTOP = 'atsume-view-desktop:v1';

// ─── Helpers localStorage — try/catch obligatoire (client-localstorage-schema)

function _readStorage(key: string): ViewMode {
  try {
    const v = localStorage.getItem(key);
    return v && (VIEW_MODES as readonly string[]).includes(v) ? (v as ViewMode) : DEFAULT;
  } catch {
    return DEFAULT;
  }
}

function _writeStorage(key: string, value: ViewMode): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* silencieux */
  }
}

// ─── Store mobile (module-level — advanced-init-once) ─────────────────────────
// Deux stores indépendants : changer desktop ne re-rend pas les consommateurs
// de mobile, et vice-versa (rerender-split-combined-hooks).

let _mobileListeners: Array<() => void> = [];
let _mobile: ViewMode = DEFAULT;

function _mobileSubscribe(cb: () => void): () => void {
  _mobileListeners.push(cb);
  return () => { _mobileListeners = _mobileListeners.filter(l => l !== cb); };
}
const _mobileSnapshot       = (): ViewMode => _mobile;
const _mobileServerSnapshot = (): ViewMode => DEFAULT;

function _setMobile(v: ViewMode): void {
  if (!VIEW_MODES.includes(v) || v === _mobile) return;
  _mobile = v;
  _writeStorage(STORAGE_KEY_MOBILE, v);
  _mobileListeners.forEach(l => l());
}

// ─── Store desktop (séparé — rerender-split-combined-hooks) ───────────────────

let _desktopListeners: Array<() => void> = [];
let _desktop: ViewMode = DEFAULT;

function _desktopSubscribe(cb: () => void): () => void {
  _desktopListeners.push(cb);
  return () => { _desktopListeners = _desktopListeners.filter(l => l !== cb); };
}
const _desktopSnapshot       = (): ViewMode => _desktop;
const _desktopServerSnapshot = (): ViewMode => DEFAULT;

function _setDesktop(v: ViewMode): void {
  if (!VIEW_MODES.includes(v) || v === _desktop) return;
  _desktop = v;
  _writeStorage(STORAGE_KEY_DESKTOP, v);
  _desktopListeners.forEach(l => l());
}

// ─── Initialisation — une seule fois au chargement (advanced-init-once) ───────
// Lecture localStorage ici → pas de double init en dev, pas de flash
// (rendering-hydration-no-flicker), pas de re-render post-hydration.

if (typeof window !== 'undefined') {
  _mobile  = _readStorage(STORAGE_KEY_MOBILE);
  _desktop = _readStorage(STORAGE_KEY_DESKTOP);
}

// ─── Seed depuis le serveur (appelé après login, comme seedThemeFromUser) ─────

export function seedViewModeFromUser(mobile: string, desktop: string): void {
  if ((VIEW_MODES as readonly string[]).includes(mobile))  _setMobile(mobile as ViewMode);
  if ((VIEW_MODES as readonly string[]).includes(desktop)) _setDesktop(desktop as ViewMode);
}

// ─── Store matchMedia — breakpoint dérivé (rerender-derived-state) ────────────
// On souscrit au booléen isDesktop, PAS à window.innerWidth continu.
// useSyncExternalStore garantit hydration-safe + re-render uniquement au
// franchissement du breakpoint, pas à chaque pixel (rendering-hydration-no-flicker).

let _mq: MediaQueryList | null = null;

function _getMQ(): MediaQueryList {
  if (!_mq && typeof window !== 'undefined') {
    _mq = window.matchMedia('(min-width: 1024px)');
  }
  return _mq!;
}

function _mqSubscribe(cb: () => void): () => void {
  const mq = _getMQ();
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
}

const _mqSnapshot       = (): boolean => (typeof window !== 'undefined' ? _getMQ().matches : false);
const _mqServerSnapshot = (): boolean => false; // SSR → mobile par défaut

// ─── Context + Provider ───────────────────────────────────────────────────────

export interface ViewModeContextValue {
  mobile:     ViewMode;
  desktop:    ViewMode;
  setMobile:  (v: ViewMode) => void;
  setDesktop: (v: ViewMode) => void;
}

const ViewModeContext = createContext<ViewModeContextValue | null>(null);

export function ViewModeProvider({ children }: { children: ReactNode }) {
  const mobile  = useSyncExternalStore(_mobileSubscribe,  _mobileSnapshot,  _mobileServerSnapshot);
  const desktop = useSyncExternalStore(_desktopSubscribe, _desktopSnapshot, _desktopServerSnapshot);

  // useCallback sur setters stables — refs stables entre renders (rerender-memo)
  const handleSetMobile  = useCallback((v: ViewMode) => _setMobile(v),  []);
  const handleSetDesktop = useCallback((v: ViewMode) => _setDesktop(v), []);

  return (
    <ViewModeContext.Provider
      value={{ mobile, desktop, setMobile: handleSetMobile, setDesktop: handleSetDesktop }}
    >
      {children}
    </ViewModeContext.Provider>
  );
}

export function useViewModeContext(): ViewModeContextValue {
  const ctx = useContext(ViewModeContext);
  if (!ctx) throw new Error('useViewModeContext() must be used within <ViewModeProvider>');
  return ctx;
}

/**
 * Retourne la préférence de vue applicable à l'appareil courant.
 * Re-render uniquement au franchissement du breakpoint 1024px (lg).
 * (rerender-derived-state + rendering-hydration-no-flicker)
 */
export function useViewMode(): ViewMode {
  const isDesktop = useSyncExternalStore(_mqSubscribe, _mqSnapshot, _mqServerSnapshot);
  const { mobile, desktop } = useViewModeContext();
  return isDesktop ? desktop : mobile;
}
