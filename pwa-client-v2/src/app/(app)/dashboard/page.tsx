import type { Metadata } from 'next';
import { DashboardClient } from './DashboardClient';

export const metadata: Metadata = {
  title: 'Accueil — Mangastore',
};

/**
 * Dashboard — Server Component.
 *
 * Le data fetching est côté client (DashboardClient) car le forwarding de
 * cookie session vers le backend n'est pas encore configuré pour les
 * Server Components (cf. note Phase 5 REDESIGN.md — API_URL Docker).
 *
 * Architecture cible une fois l'infra prête :
 *   const [mangas, loans] = await Promise.all([getCollection(), getLoansCached()]);
 *   → passer en initialData à DashboardClient → 0 loading state
 */
export default function DashboardPage() {
  return (
    <div className="w-full max-w-2xl mx-auto px-4 pt-6 pb-4 lg:max-w-4xl">
      <DashboardClient />
    </div>
  );
}
