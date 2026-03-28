import api from '@/lib/api';

export const authService = {
    logout: () =>
        api.post('/auth/logout'),

    forgotPassword: (email: string) =>
        api.post('/auth/forgot-password', { email }),

    resetPassword: (payload: Record<string, unknown>) =>
        api.post('/auth/reset-password', payload),

    sendVerificationEmail: () =>
        api.post('/auth/email/verification-notification'),

    verifyEmail: (id: string, hash: string, expires: string, signature: string) =>
        api.get(`/auth/verify-email/${id}/${hash}?expires=${expires}&signature=${signature}`),
};
