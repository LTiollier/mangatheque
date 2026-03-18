import api, { initCsrf } from '@/lib/api';
import { User } from '@/types/auth';
import { AuthResponseSchema } from '@/schemas/auth';

interface AuthResponse {
    user: User;
}

interface LoginPayload {
    email: string;
    password: string;
}

interface RegisterPayload {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
}

export const authService = {
    login: async (payload: LoginPayload): Promise<AuthResponse> => {
        await initCsrf();
        return api.post<AuthResponse>('/auth/login', payload).then(r => {
            return AuthResponseSchema.parse(r.data);
        });
    },

    register: async (payload: RegisterPayload): Promise<AuthResponse> => {
        await initCsrf();
        return api.post<AuthResponse>('/auth/register', payload).then(r => {
            return AuthResponseSchema.parse(r.data);
        });
    },

    logout: () =>
        api.post('/auth/logout'),

    forgotPassword: (email: string) =>
        api.post('/auth/forgot-password', { email }),

    resetPassword: (payload: Record<string, unknown>) =>
        api.post('/auth/reset-password', payload),
};
