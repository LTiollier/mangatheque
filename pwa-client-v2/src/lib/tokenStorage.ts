/**
 * Stockage du profil utilisateur en sessionStorage.
 *
 * Le token d'authentification n'est PAS stocké ici — il réside dans un cookie
 * httpOnly géré par le serveur, inaccessible depuis JavaScript.
 *
 * sessionStorage est utilisé pour le profil uniquement :
 * - Évite un appel GET /user à chaque rechargement de page
 * - Isolé par onglet (pas de fuite cross-tabs)
 * - Disparaît à la fermeture de l'onglet
 */

const USER_KEY = 'auth_user';

function getStorage(): Storage | null {
    if (typeof window === 'undefined') return null;
    return window.sessionStorage;
}

export const tokenStorage = {
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
        this.removeUser();
    },
};
