import api, { ApiResponse } from '@/lib/api';
import { Manga, MangaSearchResult } from '@/types/manga';

export const mangaService = {
    /** Récupère tous les mangas de la collection de l'utilisateur */
    getCollection: () =>
        api.get<ApiResponse<Manga[]>>('/mangas').then(r => r.data.data),

    /** Recherche des mangas par titre ou ISBN */
    search: (query: string) =>
        api.get<ApiResponse<MangaSearchResult[]>>(`/mangas/search?query=${encodeURIComponent(query)}`).then(r => r.data.data),

    /** Ajoute un manga à la collection via son api_id */
    addToCollection: (apiId: string) =>
        api.post('/mangas', { api_id: apiId }),

    /** Ajoute plusieurs tomes d'une édition en une seule requête */
    addBulk: (editionId: number, numbers: number[]) =>
        api.post('/mangas/bulk', { edition_id: editionId, numbers }),

    /** Ajoute plusieurs mangas via scan de codes-barres */
    scanBulk: (isbns: string[]) =>
        api.post('/mangas/scan-bulk', { isbns }),

    /** Supprime un volume de la collection */
    removeVolume: (volumeId: number) =>
        api.delete(`/mangas/${volumeId}`),
};
