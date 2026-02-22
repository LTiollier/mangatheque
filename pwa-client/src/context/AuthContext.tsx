'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, AuthContextType } from '@/types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Initialize from localStorage
        const storedUser = localStorage.getItem('auth_user');
        const storedToken = localStorage.getItem('auth_token');

        if (storedUser && storedToken) {
            setUser(JSON.parse(storedUser));
            setToken(storedToken);
        }
        setIsLoading(false);
    }, []);

    const login = useCallback((newUser: User, newToken: string) => {
        setUser(newUser);
        setToken(newToken);
        localStorage.setItem('auth_user', JSON.stringify(newUser));
        localStorage.setItem('auth_token', newToken);
    }, []);

    const logout = useCallback(() => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('auth_user');
        localStorage.removeItem('auth_token');
    }, []);

    const value = {
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        login,
        logout,
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
