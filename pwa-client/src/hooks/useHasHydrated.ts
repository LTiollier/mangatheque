import { useSyncExternalStore } from 'react';

const emptySubscribe = () => () => { };

export const useHasHydrated = () => {
    return useSyncExternalStore(
        emptySubscribe,
        () => true,
        () => false
    );
};
