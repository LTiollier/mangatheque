import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL
    ? (process.env.NEXT_PUBLIC_API_URL.endsWith('/api')
        ? process.env.NEXT_PUBLIC_API_URL
        : `${process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '')}/api`)
    : 'http://localhost:8000/api';

const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    // Requis pour transmettre le cookie httpOnly `auth_token` cross-origin
    // et pour que axios lise le cookie XSRF-TOKEN et envoie X-XSRF-TOKEN automatiquement
    withCredentials: true,
    xsrfCookieName: 'XSRF-TOKEN',
    xsrfHeaderName: 'X-XSRF-TOKEN',
});

// Interceptor to manually add X-XSRF-TOKEN header for cross-port requests
api.interceptors.request.use((config) => {
    if (typeof document !== 'undefined') {
        // Axios built-in xsrf support sometimes fails on different ports of localhost.
        // We manually extract it from cookies as a fallback.
        const name = 'XSRF-TOKEN=';
        const decodedCookie = decodeURIComponent(document.cookie);
        const ca = decodedCookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1);
            if (c.indexOf(name) === 0) {
                config.headers['X-XSRF-TOKEN'] = c.substring(name.length, c.length);
                break;
            }
        }
    }
    return config;
});

// Interceptor to handle unauthorized errors (expiration de session)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 && typeof window !== 'undefined') {
            // Le cookie est supprimé côté serveur lors du logout
            // On redirige simplement vers la page de connexion
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

/** Initialise le cookie CSRF de Sanctum — à appeler avant login/register */
export async function initCsrf(): Promise<void> {
    // On retire /api de la fin pour appeler la route racine de Sanctum
    const rootUrl = BASE_URL.replace(/\/api$/, '');
    await api.get(`${rootUrl}/sanctum/csrf-cookie`);
}

/** Enveloppe standard des réponses Laravel API Resources */
export type ApiResponse<T> = { data: T };

export default api;
