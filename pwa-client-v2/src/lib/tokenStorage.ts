const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

function getLocalStorage(): Storage | null {
    if (typeof window === 'undefined') return null;
    return window.localStorage;
}

function getSessionStorage(): Storage | null {
    if (typeof window === 'undefined') return null;
    return window.sessionStorage;
}

export const tokenStorage = {
    getToken(): string | null {
        return getLocalStorage()?.getItem(TOKEN_KEY) ?? null;
    },

    setToken(token: string): void {
        getLocalStorage()?.setItem(TOKEN_KEY, token);
        if (typeof document !== 'undefined') {
            document.cookie = 'auth_check=1; path=/; SameSite=Lax';
        }
    },

    removeToken(): void {
        getLocalStorage()?.removeItem(TOKEN_KEY);
        if (typeof document !== 'undefined') {
            document.cookie = 'auth_check=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        }
    },

    getUser<T>(): T | null {
        const raw = getSessionStorage()?.getItem(USER_KEY);
        if (!raw) return null;
        try {
            return JSON.parse(raw) as T;
        } catch {
            return null;
        }
    },

    setUser<T>(user: T): void {
        getSessionStorage()?.setItem(USER_KEY, JSON.stringify(user));
    },

    removeUser(): void {
        getSessionStorage()?.removeItem(USER_KEY);
    },

    clear(): void {
        this.removeToken();
        this.removeUser();
    },
};
