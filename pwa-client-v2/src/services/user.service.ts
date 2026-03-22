import api, { ApiResponse } from '@/lib/api';
import { User } from '@/types/auth';
import { Manga, Series, Edition } from '@/types/manga';

interface UpdateSettingsPayload {
    username: string | null;
    is_public: boolean;
    theme: string;
    palette: string;
}

interface PublicProfile {
    id: number;
    name: string;
    username: string;
}

interface UpdateEmailPayload {
    email: string;
    current_password: string;
}

interface UpdatePasswordPayload {
    current_password: string;
    password: string;
    password_confirmation: string;
}

export const userService = {
    updateSettings: (payload: UpdateSettingsPayload) =>
        api.put<ApiResponse<User>>('/user/settings', payload).then(r => r.data.data),

    updateEmail: (payload: UpdateEmailPayload) =>
        api.put<ApiResponse<User>>('/user/settings/email', payload).then(r => r.data.data),

    updatePassword: (payload: UpdatePasswordPayload) =>
        api.put<ApiResponse<User>>('/user/settings/password', payload).then(r => r.data.data),

    importMangaCollec: (url: string) =>
        api.post<ApiResponse<{ imported: number; failed: number }>>('/user/settings/import/mangacollec', { url }).then(r => r.data.data),

    getPublicProfile: (username: string) =>
        api.get<ApiResponse<PublicProfile>>(`/users/${username}`).then(r => r.data.data),

    getPublicCollection: (username: string) =>
        api.get<ApiResponse<Manga[]>>(`/users/${username}/collection`).then(r => r.data.data),

    getEditionVolumes: (editionId: string) =>
        api.get<ApiResponse<Manga[]>>(`/editions/${editionId}/volumes`).then(r => r.data.data),

    getSeries: (seriesId: string) =>
        api.get<ApiResponse<Series>>(`/series/${seriesId}`).then(r => r.data.data),

    getSeriesEditions: (seriesId: string) =>
        api.get<ApiResponse<Edition[]>>(`/series/${seriesId}/editions`).then(r => r.data.data),

    removeSeries: (seriesId: string) =>
        api.delete(`/series/${seriesId}`),
};
