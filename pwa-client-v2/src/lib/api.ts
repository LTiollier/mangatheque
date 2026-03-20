import axios from 'axios';
import { tokenStorage } from './tokenStorage';

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
});

api.interceptors.request.use((config) => {
    const token = tokenStorage.getToken();
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
});

// Interceptor : redirect /login sur 401 (session expirée)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 && typeof window !== 'undefined') {
            tokenStorage.clear();
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

/** Enveloppe standard des réponses Laravel API Resources */
export type ApiResponse<T> = { data: T };

export default api;
