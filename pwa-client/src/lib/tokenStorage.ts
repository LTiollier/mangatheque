/**
 * Couche d'abstraction pour le stockage des credentials d'authentification.
 *
 * Utilise `sessionStorage` à la place de `localStorage` :
 * - Les données disparaissent à la fermeture de l'onglet (surface d'attaque réduite)
 * - Isolation par onglet (pas de fuites cross-tabs)
 *
 * ⚠️  TODO SÉCURITÉ : Migration vers cookies httpOnly Sanctum SPA
 *      La solution définitive est les cookies httpOnly gérés par Laravel Sanctum,
 *      inaccessibles depuis JavaScript. Pour migrer :
 *      1. Backend : configurer `config/sanctum.php` → `stateful` domains + `SESSION_DOMAIN`
 *      2. Backend : ajouter `EnsureFrontendRequestsAreStateful` middleware
 *      3. Frontend : appeler GET /sanctum/csrf-cookie avant le login
 *      4. Frontend : passer axios en `withCredentials: true`
 *      5. Frontend : supprimer ce module et retirer l'intercepteur Authorization de api.ts
 *
 * Référence : https://laravel.com/docs/sanctum#spa-authentication
 */

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

function getStorage(): Storage | null {
    if (typeof window === 'undefined') return null;
    return window.sessionStorage;
}

export const tokenStorage = {
    getToken(): string | null {
        return getStorage()?.getItem(TOKEN_KEY) ?? null;
    },

    setToken(token: string): void {
        getStorage()?.setItem(TOKEN_KEY, token);
    },

    removeToken(): void {
        getStorage()?.removeItem(TOKEN_KEY);
    },

    getUser<T>(): T | null {
        const raw = getStorage()?.getItem(USER_KEY);
        if (!raw) return null;
        try {
            return JSON.parse(raw) as T;
        } catch {
            return null;
        }
    },

    setUser<T>(user: T): void {
        getStorage()?.setItem(USER_KEY, JSON.stringify(user));
    },

    removeUser(): void {
        getStorage()?.removeItem(USER_KEY);
    },

    clear(): void {
        this.removeToken();
        this.removeUser();
    },
};
