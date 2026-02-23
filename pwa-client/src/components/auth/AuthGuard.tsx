'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { LucideLoader2 } from 'lucide-react';

interface AuthGuardProps {
    children: React.ReactNode;
    requireAuth?: boolean;
    fallbackPath?: string;
}

/**
 * AuthGuard component to protect routes and handle redirections.
 * 
 * @param requireAuth - If true, restricts to authenticated users. If false, restricts to guests.
 * @param fallbackPath - Where to redirect if the condition is not met.
 */
export default function AuthGuard({
    children,
    requireAuth = true,
    fallbackPath
}: AuthGuardProps) {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        if (isLoading) return;

        if (requireAuth && !isAuthenticated) {
            // User is not authenticated but the route requires it
            const redirectPath = fallbackPath || `/login?callbackUrl=${encodeURIComponent(pathname)}`;
            router.push(redirectPath);
        } else if (!requireAuth && isAuthenticated) {
            // User is authenticated but the route is for guests only (e.g., login, register)
            const redirectPath = fallbackPath || '/';
            router.push(redirectPath);
        } else {
            // Condition met, authorize rendering
            setTimeout(() => {
                setIsAuthorized(true);
            }, 0);
        }
    }, [isAuthenticated, isLoading, requireAuth, fallbackPath, router, pathname]);

    if (isLoading || !isAuthorized) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white p-4">
                <div className="relative">
                    <div className="absolute -inset-4 bg-purple-500/10 blur-2xl rounded-full animate-pulse"></div>
                    <div className="relative p-4 bg-slate-900/50 rounded-2xl border border-slate-800 backdrop-blur-sm">
                        <LucideLoader2 className="h-8 w-8 text-purple-500 animate-spin" />
                    </div>
                </div>
                <div className="mt-8 space-y-2 text-center">
                    <p className="text-white font-bold tracking-tight">Vérification de l&apos;accès</p>
                    <p className="text-slate-500 text-xs uppercase tracking-widest font-medium animate-pulse">
                        Sécurisation de la session...
                    </p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
