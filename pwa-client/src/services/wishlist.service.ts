import api, { ApiResponse } from '@/lib/api';
import { Manga } from '@/types/manga';
import { MangaSchema } from '@/schemas/manga';
import { z } from 'zod';

export const wishlistService = {
    /** Récupère la liste de souhaits de l'utilisateur */
    getAll: () =>
        api.get<ApiResponse<Manga[]>>('/wishlist').then(r => {
            try {
                return z.array(MangaSchema).parse(r.data.data);
            } catch (error) {
                console.error("Wishlist validation failed:", error);
                return r.data.data as unknown as Manga[];
            }
        }),

    /** Ajoute un manga à la liste de souhaits via son api_id */
    add: (apiId: string) =>
        api.post('/wishlist', { api_id: apiId }),

    /** Retire un manga de la liste de souhaits */
    remove: (mangaId: string) =>
        api.delete(`/wishlist/${mangaId}`),
};
