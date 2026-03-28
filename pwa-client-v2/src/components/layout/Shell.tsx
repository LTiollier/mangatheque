import type { ReactNode } from 'react';

import { BottomNav } from './BottomNav';
import { SidebarNav } from './SidebarNav';
import { VerifyEmailOverlay } from './VerifyEmailOverlay';

interface ShellProps {
  children: ReactNode;
}

/**
 * Shell — layout wrapper mobile-first.
 * 
 * Mobile  : content + BottomNav fixe en bas (safe-area incluse)
 * Desktop : sidebar w-64 fixe à gauche + contenu principal
 * 
 * Shell est un Server Component — BottomNav et SidebarNav sont des Client
 * Components pour l'état actif de navigation (usePathname).
 */
export function Shell({ children }: ShellProps) {
  return (
    <div className="flex min-h-dvh">
      {/* Sidebar desktop (lg+) — hidden on mobile via SidebarNav */}
      <SidebarNav />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
        <VerifyEmailOverlay />

        {/*
         * Mobile  : pb accounts for BottomNav (64px) + iOS safe-area
         * Desktop : BottomNav is hidden, pb reduces to safe-area only
         * safe-area-bottom utility class is defined in globals.css
         */}
        <main className="flex-1 safe-area-top [padding-bottom:calc(64px+env(safe-area-inset-bottom))] lg:[padding-bottom:env(safe-area-inset-bottom)]">
          {children}
        </main>
      </div>

      {/* Bottom nav mobile (lg:hidden inside BottomNav) */}
      <BottomNav />
    </div>
  );
}
