import { useState, useEffect } from 'react';

/**
 * Hook to check if the component has hydrated on the client.
 * Essential for components that rely on browser-only APIs like localStorage or sessionStorage
 * to avoid hydration mismatch errors in Next.js.
 */
export function useHasHydrated() {
    const [hasHydrated, setHasHydrated] = useState(false);

    useEffect(() => {
        setHasHydrated(true);
    }, []);

    return hasHydrated;
}
