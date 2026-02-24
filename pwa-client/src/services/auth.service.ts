import api from '@/lib/api';
import { User } from '@/types/auth';

interface AuthResponse {
    user: User;
    token: string;
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
    /** Authentifie l'utilisateur avec email et mot de passe */
    login: (payload: LoginPayload) =>
        api.post<AuthResponse>('/auth/login', payload).then(r => r.data),

    /** Crée un nouveau compte utilisateur */
    register: (payload: RegisterPayload) =>
        api.post<AuthResponse>('/auth/register', payload).then(r => r.data),
};
