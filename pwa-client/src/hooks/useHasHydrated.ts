import { useSyncExternalStore } from 'react';

/**
 * Hook to check if the component has hydrated on the client.
 * Essential for components that rely on browser-only APIs like localStorage or sessionStorage
 * to avoid hydration mismatch errors in Next.js.
 * 
 * Uses useSyncExternalStore to avoid the "set state in useEffect" cascading render lint error.
 */

const subscribe = () => () => { };

export function useHasHydrated() {
    return useSyncExternalStore(
        subscribe,
        () => true,
        () => false
    );
}
