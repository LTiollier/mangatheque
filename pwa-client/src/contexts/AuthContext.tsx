'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '@/types/auth';
import { tokenStorage } from '@/lib/tokenStorage';

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (user: User) => void;
    logout: () => void;
    updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Restaure le profil depuis sessionStorage — le token est dans le cookie httpOnly
        const storedUser = tokenStorage.getUser<User>();

        setTimeout(() => {
            if (storedUser) {
                setUser(storedUser);
            }
            setIsLoading(false);
        }, 0);
    }, []);

    const login = useCallback((newUser: User) => {
        setUser(newUser);
        tokenStorage.setUser(newUser);
        // Le cookie `auth_token` httpOnly est posé par le serveur dans la réponse
    }, []);

    const logout = useCallback(() => {
        setUser(null);
        tokenStorage.clear();
        // Le cookie `auth_token` est supprimé par le serveur (Cookie::forget)
    }, []);

    const updateUser = useCallback((updatedUser: User) => {
        setUser(updatedUser);
        tokenStorage.setUser(updatedUser);
    }, []);

    const value = {
        user,
        isAuthenticated: !!user,
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
