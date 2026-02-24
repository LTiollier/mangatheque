import api, { ApiResponse } from '@/lib/api';
import { Manga, MangaSearchResult } from '@/types/manga';
import { MangaSchema, MangaSearchResultSchema } from '@/schemas/manga';
import { z } from 'zod';

export const mangaService = {
    /** Récupère tous les mangas de la collection de l'utilisateur */
    getCollection: () =>
        api.get<ApiResponse<Manga[]>>('/mangas').then(r => {
            try {
                // Validation automatique des données reçues avec Zod
                return z.array(MangaSchema).parse(r.data.data);
            } catch (error) {
                console.error("Manga validation failed:", error);
                // En cas d'erreur de validation, on renvoie les données quand même 
                // pour ne pas bloquer l'interface, tout en logguant le problème.
                return r.data.data as unknown as Manga[];
            }
        }),

    /** Recherche des mangas par titre ou ISBN */
    search: (query: string) =>
        api.get<ApiResponse<MangaSearchResult[]>>(`/mangas/search?query=${encodeURIComponent(query)}`).then(r => {
            try {
                return z.array(MangaSearchResultSchema).parse(r.data.data);
            } catch (error) {
                console.error("Search result validation failed:", error);
                return r.data.data as unknown as MangaSearchResult[];
            }
        }),

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
