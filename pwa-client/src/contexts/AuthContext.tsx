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

// Système de souscription et de mise en cache pour useSyncExternalStore
let cachedUser: User | null = null;
let initialized = false;
let listeners: (() => void)[] = [];

const getUserSnapshot = (): User | null => {
    if (!initialized) {
        cachedUser = tokenStorage.getUser<User>();
        initialized = true;
    }
    return cachedUser;
};

const subscribeUser = (callback: () => void) => {
    listeners.push(callback);
    return () => {
        listeners = listeners.filter((l) => l !== callback);
    };
};

const emitUserChange = () => {
    cachedUser = tokenStorage.getUser<User>();
    listeners.forEach((callback) => callback());
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const hasHydrated = useHasHydrated();

    // Utilisation de useSyncExternalStore avec un snapshot stable (cachedUser)
    // pour éviter les boucles infinies de rendu.
    const user = useSyncExternalStore(
        subscribeUser,
        getUserSnapshot,
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
