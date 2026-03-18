import { useSyncExternalStore } from 'react';

/**
 * Hook online/offline — réécrit avec useSyncExternalStore (audit Phase 1).
 *
 * Règle Vercel `client-event-listeners` : les listeners globaux doivent être
 * dédupliqués via un store externe partagé, pas recréés dans chaque composant.
 *
 * Règle `rendering-hydration-no-flicker` : getServerSnapshot retourne `true`
 * (optimiste) pour éviter un flash "offline" au rendu SSR.
 */

const subscribe = (cb: () => void): (() => void) => {
    window.addEventListener('online', cb);
    window.addEventListener('offline', cb);
    return () => {
        window.removeEventListener('online', cb);
        window.removeEventListener('offline', cb);
    };
};

const getSnapshot = () => navigator.onLine;
const getServerSnapshot = () => true; // SSR : on assume en ligne

export function useOnlineStatus(): boolean {
    return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
