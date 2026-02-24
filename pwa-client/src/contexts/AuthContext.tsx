'use client';

import React, { createContext, useContext, useCallback, useSyncExternalStore } from 'react';
import { User } from '@/types/auth';
import { tokenStorage } from '@/lib/tokenStorage';
import { useHasHydrated } from '@/hooks/useHasHydrated';

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (user: User) => void;
    logout: () => void;
    updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Système de souscription pour synchroniser useSyncExternalStore avec tokenStorage
let listeners: (() => void)[] = [];
const subscribeUser = (callback: () => void) => {
    listeners.push(callback);
    return () => {
        listeners = listeners.filter((l) => l !== callback);
    };
};
const emitUserChange = () => listeners.forEach((callback) => callback());

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const hasHydrated = useHasHydrated();

    // Utilisation de useSyncExternalStore pour éviter les setState dans useEffect
    // et gérer la synchronisation avec le stockage externe (sessionStorage)
    const user = useSyncExternalStore(
        subscribeUser,
        () => tokenStorage.getUser<User>(),
        () => null // Server snapshot
    );

    const login = useCallback((newUser: User) => {
        tokenStorage.setUser(newUser);
        emitUserChange();
    }, []);

    const logout = useCallback(() => {
        tokenStorage.clear();
        emitUserChange();
    }, []);

    const updateUser = useCallback((updatedUser: User) => {
        tokenStorage.setUser(updatedUser);
        emitUserChange();
    }, []);

    const value = {
        user,
        isAuthenticated: !!user,
        isLoading: !hasHydrated,
        login,
        logout,
        updateUser,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
