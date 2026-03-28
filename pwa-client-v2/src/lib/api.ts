import { tokenStorage } from './tokenStorage';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL
    ? (process.env.NEXT_PUBLIC_API_URL.endsWith('/api')
        ? process.env.NEXT_PUBLIC_API_URL
        : `${process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '')}/api`)
    : 'http://localhost:8000/api';

/** Enveloppe standard des réponses Laravel API Resources */
export type ApiResponse<T> = { data: T };

/** Erreur HTTP avec body parsé — remplace AxiosError */
export class ApiError extends Error {
    constructor(
        public readonly status: number,
        public readonly data: unknown,
    ) {
        super(`HTTP ${status}`);
        this.name = 'ApiError';
    }
}

/** Forme retournée par chaque méthode — compatibilité avec les services existants */
export interface FetchResponse<T> {
    data: T;
    status: number;
}

function buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    };
    const token = tokenStorage.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
}

async function request<T>(
    method: string,
    path: string,
    options: {
        body?: unknown;
        params?: Record<string, string | number | undefined>;
    } = {},
): Promise<FetchResponse<T>> {
    let url = `${BASE_URL}${path}`;

    if (options.params) {
        const qs = new URLSearchParams();
        for (const [key, value] of Object.entries(options.params)) {
            if (value !== undefined) qs.set(key, String(value));
        }
        const qsStr = qs.toString();
        if (qsStr) url += `?${qsStr}`;
    }

    const res = await fetch(url, {
        method,
        headers: buildHeaders(),
        body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });

    const contentType = res.headers.get('content-type') ?? '';
    const data: unknown = contentType.includes('application/json')
        ? await res.json()
        : await res.text();

    if (!res.ok) {
        // Redirect to /login on 401, sauf endpoints d'auth (login/register)
        if (res.status === 401 && typeof window !== 'undefined' && !path.includes('/auth/')) {
            tokenStorage.clear();
            window.location.href = '/login';
        }
        throw new ApiError(res.status, data);
    }

    return { data: data as T, status: res.status };
}

const api = {
    get: <T>(path: string, options?: { params?: Record<string, string | number | undefined> }) =>
        request<T>('GET', path, { params: options?.params }),

    post: <T = unknown>(path: string, body?: unknown) =>
        request<T>('POST', path, { body }),

    patch: <T = unknown>(path: string, body?: unknown) =>
        request<T>('PATCH', path, { body }),

    delete: <T = unknown>(path: string, options?: { data?: unknown }) =>
        request<T>('DELETE', path, { body: options?.data }),
};

export default api;
