import { Suspense } from 'react';
import type { Metadata } from 'next';
import { DashboardClient } from './DashboardClient';

export const metadata: Metadata = {
  title: 'Accueil — Atsume',
};

/**
 * Dashboard — Server Component.
 *
 * Data fetching is client-side (DashboardClient) because session cookie
 * forwarding to the backend is not yet configured for Server Components
 * (see Phase 5 note in REDESIGN.md — API_URL Docker).
 *
 * Target architecture once infrastructure is ready:
 *   const [mangas, loans] = await Promise.all([getCollection(), getLoansCached()]);
 *   → pass as initialData to DashboardClient → 0 loading state
 */
export default function DashboardPage() {
  return (
    <div className="w-full max-w-2xl mx-auto px-4 pt-6 pb-4 lg:max-w-4xl">
      <Suspense fallback={<div className="animate-pulse bg-muted rounded-lg h-96 w-full" />}>
        <DashboardClient />
      </Suspense>
    </div>
  );
}
