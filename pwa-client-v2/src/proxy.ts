import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * AuthGuard — proxy Next.js Edge Runtime
 *
 * Remplace l'ancien `AuthGuard.tsx` client-side (audit Phase 1).
 * Avantage : redirect au niveau edge, avant tout rendu — 0 flash de contenu.
 *
 * Stratégie Sanctum :
 * - L'auth repose sur un cookie httpOnly `laravel_session` (pas de JWT en localStorage)
 * - On ne peut pas vérifier la validité du token côté edge sans appel API
 * - Convention : présence du cookie `auth_check` (non-httpOnly, posé par le backend
 *   au login) comme indicateur côté edge
 *
 * Note : si `auth_check` n'est pas implémenté côté backend, remplacer par
 * une vérification de `laravel_session` (présent = probablement connecté).
 */

const PUBLIC_ROUTES = [
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
];

const PUBLIC_PREFIXES = [
    '/user/',   // profils publics
    '/_next/',
    '/api/',
    '/favicon',
    '/logo.png',
    '/icons/',
    '/manifest',
    '/sw.js',
    '/workbox-',
];

export default function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Laisser passer les routes publiques et assets
    if (
        PUBLIC_ROUTES.some(r => pathname === r || pathname.startsWith(r + '?')) ||
        PUBLIC_PREFIXES.some(p => pathname.startsWith(p))
    ) {
        return NextResponse.next();
    }

    // Vérifier la présence du cookie d'authentification
    // On vérifie 'auth_token' (le token Sanctum httpOnly)
    // ou 'laravel_session' / 'auth_check' comme indicateurs secondaires
    const isAuthenticated =
        request.cookies.has('auth_token') ||
        request.cookies.has('auth_check') ||
        request.cookies.has('laravel_session');

    if (!isAuthenticated) {
        const loginUrl = new URL('/login', request.url);
        if (pathname !== '/') {
            loginUrl.searchParams.set('redirect', pathname);
        }
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!_next).*)'],
};
