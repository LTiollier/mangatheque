import api from '@/lib/api';
import { tokenStorage } from '@/lib/tokenStorage';
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
        const response = await api.post('/auth/login', payload);
        const validated = AuthResponseSchema.parse(response.data);
        tokenStorage.setToken(validated.token);
        return { user: validated.user };
    },

    register: async (payload: RegisterPayload): Promise<AuthResponse> => {
        const response = await api.post('/auth/register', payload);
        const validated = AuthResponseSchema.parse(response.data);
        tokenStorage.setToken(validated.token);
        return { user: validated.user };
    },

    logout: () =>
        api.post('/auth/logout'),

    forgotPassword: (email: string) =>
        api.post('/auth/forgot-password', { email }),

    resetPassword: (payload: Record<string, unknown>) =>
        api.post('/auth/reset-password', payload),
};
