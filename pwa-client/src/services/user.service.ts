import api from '@/lib/api';
import { User } from '@/types/auth';
import { Manga } from '@/types/manga';

interface UpdateSettingsPayload {
    username: string | null;
    is_public: boolean;
}

interface PublicProfile {
    id: number;
    name: string;
    username: string;
}

export const userService = {
    /** Met à jour les paramètres du profil de l'utilisateur connecté */
    updateSettings: (payload: UpdateSettingsPayload) =>
        api.put<{ data: User }>('/user/settings', payload).then(r => r.data.data),

    /** Récupère le profil public d'un utilisateur par son username */
    getPublicProfile: (username: string) =>
        api.get<{ data: PublicProfile }>(`/users/${username}`).then(r => r.data.data),

    /** Récupère la collection publique d'un utilisateur par son username */
    getPublicCollection: (username: string) =>
        api.get<{ data: Manga[] }>(`/users/${username}/collection`).then(r => r.data.data),

    /** Récupère les volumes d'une édition spécifique */
    getEditionVolumes: (editionId: string) =>
        api.get<{ data: Manga[] }>(`/editions/${editionId}/volumes`).then(r => r.data.data),

    /** Récupère les informations d'une série */
    getSeries: (seriesId: string) =>
        api.get(`/series/${seriesId}`).then(r => r.data.data),

    /** Supprime toute une série de la collection */
    removeSeries: (seriesId: string) =>
        api.delete(`/series/${seriesId}`),
};
