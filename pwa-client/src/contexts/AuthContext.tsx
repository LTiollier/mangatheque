'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, AuthContextType } from '@/types/auth';
import { tokenStorage } from '@/lib/tokenStorage';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Initialize from sessionStorage via tokenStorage adapter
        const storedToken = tokenStorage.getToken();
        const storedUser = tokenStorage.getUser<User>();

        setTimeout(() => {
            if (storedUser && storedToken) {
                setUser(storedUser);
                setToken(storedToken);
            }
            setIsLoading(false);
        }, 0);
    }, []);

    const login = useCallback((newUser: User, newToken: string) => {
        setUser(newUser);
        setToken(newToken);
        tokenStorage.setToken(newToken);
        tokenStorage.setUser(newUser);
    }, []);

    const logout = useCallback(() => {
        setUser(null);
        setToken(null);
        tokenStorage.clear();
    }, []);

    const updateUser = useCallback((updatedUser: User) => {
        setUser(updatedUser);
        tokenStorage.setUser(updatedUser);
    }, []);

    const value = {
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
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
