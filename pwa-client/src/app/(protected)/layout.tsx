'use client';

import AuthGuard from '@/components/auth/AuthGuard';
import { Shell } from '@/components/layout/Shell';

export default function ProtectedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AuthGuard requireAuth={true}>
            <Shell>
                {children}
            </Shell>
        </AuthGuard>
    );
}
