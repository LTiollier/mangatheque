import api, { ApiResponse } from '@/lib/api';
import { User } from '@/types/auth';
import { Manga, Series } from '@/types/manga';

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
        api.put<ApiResponse<User>>('/user/settings', payload).then(r => r.data.data),

    /** Récupère le profil public d'un utilisateur par son username */
    getPublicProfile: (username: string) =>
        api.get<ApiResponse<PublicProfile>>(`/users/${username}`).then(r => r.data.data),

    /** Récupère la collection publique d'un utilisateur par son username */
    getPublicCollection: (username: string) =>
        api.get<ApiResponse<Manga[]>>(`/users/${username}/collection`).then(r => r.data.data),

    /** Récupère les volumes d'une édition spécifique */
    getEditionVolumes: (editionId: string) =>
        api.get<ApiResponse<Manga[]>>(`/editions/${editionId}/volumes`).then(r => r.data.data),

    /** Récupère les informations d'une série */
    getSeries: (seriesId: string) =>
        api.get<ApiResponse<Series>>(`/series/${seriesId}`).then(r => r.data.data),

    /** Supprime toute une série de la collection */
    removeSeries: (seriesId: string) =>
        api.delete(`/series/${seriesId}`),
};
