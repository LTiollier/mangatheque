'use client';

import AuthGuard from '@/components/auth/AuthGuard';

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AuthGuard requireAuth={false} fallbackPath="/">
            {children}
        </AuthGuard>
    );
}
