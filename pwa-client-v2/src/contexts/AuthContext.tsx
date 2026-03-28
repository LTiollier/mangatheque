'use client';

import React, { createContext, useContext, useCallback, useSyncExternalStore, useEffect } from 'react';
import { User } from '@/types/auth';
import { tokenStorage } from '@/lib/tokenStorage';
import { useHasHydrated } from '@/hooks/useHasHydrated';
import { authService } from '@/services/auth.service';
import { clearAuthCookieAction } from '@/app/actions/auth';
import { userService } from '@/services/user.service';
import { seedThemeFromUser } from '@/contexts/ThemeContext';
import { seedPaletteFromUser } from '@/contexts/PaletteContext';

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (user: User) => void;
    logout: () => void;
    updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Store externe singleton — hydration-safe via useSyncExternalStore
let cachedUser: User | null = null;
let initialized = false;
let listeners: (() => void)[] = [];

const getUserSnapshot = (): User | null => {
    if (!initialized) {
        cachedUser = tokenStorage.getUser<User>();
        initialized = true;
        if (cachedUser) {
            seedThemeFromUser(cachedUser.theme);
            seedPaletteFromUser(cachedUser.palette);
        }
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

    const user = useSyncExternalStore(
        subscribeUser,
        getUserSnapshot,
        () => null // Server snapshot
    );

    const login = useCallback((newUser: User) => {
        tokenStorage.setUser(newUser);
        seedThemeFromUser(newUser.theme);
        seedPaletteFromUser(newUser.palette);
        emitUserChange();
    }, []);

    const logout = useCallback(() => {
        // Fire and forget — both can fail gracefully (token may already be expired)
        authService.logout().catch(() => {});
        clearAuthCookieAction().catch(() => {});
        tokenStorage.clear();
        emitUserChange();
    }, []);

    const updateUser = useCallback((updatedUser: User) => {
        tokenStorage.setUser(updatedUser);
        seedThemeFromUser(updatedUser.theme);
        seedPaletteFromUser(updatedUser.palette);
        emitUserChange();
    }, []);

    useEffect(() => {
        // If we have a token but no user, try to fetch the user (e.g. after refresh/new tab if storage was cleared)
        // Note: we now use localStorage for user too, but this is a safe fallback
        if (hasHydrated && !user && tokenStorage.getToken()) {
            userService.getCurrentUser()
                .then(updateUser)
                .catch(() => {
                    // Token invalid or network error
                    tokenStorage.clear();
                    emitUserChange();
                });
        }
    }, [hasHydrated, user, updateUser]);

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
